/**
 * Context management routes for Cloudflare Worker
 */

import { Hono } from 'hono';
import { HTTPException } from 'hono/http-exception';

const contexts = new Hono();

// Get all contexts (with filters and permissions)
contexts.get('/', async (c) => {
  try {
    const { userId, role } = c.get('jwtPayload');
    const { 
      page = '1', 
      limit = '20', 
      search, 
      category, 
      tags,
      sortBy = 'created_at', 
      sortOrder = 'DESC' 
    } = c.req.query();

    const offset = (parseInt(page) - 1) * parseInt(limit);

    // Build query based on user permissions
    let baseQuery = `
      SELECT c.id, c.title, c.category, c.description, c.tags, c.priority,
             c.status, c.visibility, c.created_at, c.updated_at,
             u.name as creator_name, u.email as creator_email,
             COUNT(DISTINCT ci.id) as interaction_count,
             COUNT(DISTINCT cf.user_id) as follower_count
      FROM contexts c
      JOIN users u ON c.created_by = u.id
      LEFT JOIN context_interactions ci ON c.id = ci.context_id
      LEFT JOIN context_followers cf ON c.id = cf.context_id AND cf.active = 1
      WHERE c.active = 1
    `;

    const params = [];

    // Apply visibility filters based on user role
    if (role === 'admin') {
      // Admins can see all contexts
    } else if (role === 'organization_member') {
      baseQuery += ` AND (
        c.visibility = 'public' OR 
        c.created_by = ? OR
        c.organization_id IN (
          SELECT organization_id FROM organization_members 
          WHERE user_id = ? AND active = 1
        )
      )`;
      params.push(userId, userId);
    } else {
      // Regular users see public contexts and their own
      baseQuery += ' AND (c.visibility = \'public\' OR c.created_by = ?)';
      params.push(userId);
    }

    // Add filters
    if (search) {
      baseQuery += ' AND (c.title LIKE ? OR c.description LIKE ? OR c.tags LIKE ?)';
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }

    if (category) {
      baseQuery += ' AND c.category = ?';
      params.push(category);
    }

    if (tags) {
      const tagList = tags.split(',').map(tag => `%${tag.trim()}%`);
      const tagConditions = tagList.map(() => 'c.tags LIKE ?').join(' OR ');
      baseQuery += ` AND (${tagConditions})`;
      params.push(...tagList);
    }

    baseQuery += ' GROUP BY c.id, u.id';

    // Add sorting
    const validSortColumns = ['title', 'category', 'priority', 'status', 'created_at', 'updated_at'];
    const validSortOrders = ['ASC', 'DESC'];
    
    if (validSortColumns.includes(sortBy) && validSortOrders.includes(sortOrder.toUpperCase())) {
      baseQuery += ` ORDER BY c.${sortBy} ${sortOrder.toUpperCase()}`;
    } else {
      baseQuery += ' ORDER BY c.created_at DESC';
    }

    baseQuery += ' LIMIT ? OFFSET ?';
    params.push(parseInt(limit), offset);

    const result = await c.env.DB.prepare(baseQuery).bind(...params).all();

    // Get total count for pagination
    let countQuery = `
      SELECT COUNT(DISTINCT c.id) as total
      FROM contexts c
      WHERE c.active = 1
    `;
    const countParams = [];

    // Apply same visibility filters for count
    if (role !== 'admin') {
      if (role === 'organization_member') {
        countQuery += ` AND (
          c.visibility = 'public' OR 
          c.created_by = ? OR
          c.organization_id IN (
            SELECT organization_id FROM organization_members 
            WHERE user_id = ? AND active = 1
          )
        )`;
        countParams.push(userId, userId);
      } else {
        countQuery += ' AND (c.visibility = \'public\' OR c.created_by = ?)';
        countParams.push(userId);
      }
    }

    // Apply same filters for count
    if (search) {
      countQuery += ' AND (c.title LIKE ? OR c.description LIKE ? OR c.tags LIKE ?)';
      const searchTerm = `%${search}%`;
      countParams.push(searchTerm, searchTerm, searchTerm);
    }

    if (category) {
      countQuery += ' AND c.category = ?';
      countParams.push(category);
    }

    if (tags) {
      const tagList = tags.split(',').map(tag => `%${tag.trim()}%`);
      const tagConditions = tagList.map(() => 'c.tags LIKE ?').join(' OR ');
      countQuery += ` AND (${tagConditions})`;
      countParams.push(...tagList);
    }

    const countResult = await c.env.DB.prepare(countQuery).bind(...countParams).first();
    const totalCount = countResult?.total || 0;

    return c.json({
      success: true,
      contexts: result.results.map(context => ({
        ...context,
        tags: context.tags ? context.tags.split(',').map(tag => tag.trim()) : [],
      })),
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: totalCount,
        totalPages: Math.ceil(totalCount / parseInt(limit)),
        hasNext: offset + parseInt(limit) < totalCount,
        hasPrev: parseInt(page) > 1,
      },
    });

  } catch (error) {
    console.error('Get contexts error:', error);
    throw new HTTPException(500, { message: 'Internal server error' });
  }
});

// Get context by ID
contexts.get('/:id', async (c) => {
  try {
    const { userId, role } = c.get('jwtPayload');
    const contextId = c.req.param('id');

    const context = await c.env.DB.prepare(`
      SELECT c.*, u.name as creator_name, u.email as creator_email, u.profile_image as creator_image,
             o.name as organization_name
      FROM contexts c
      JOIN users u ON c.created_by = u.id
      LEFT JOIN organizations o ON c.organization_id = o.id
      WHERE c.id = ? AND c.active = 1
    `).bind(contextId).first();

    if (!context) {
      throw new HTTPException(404, { message: 'Context not found' });
    }

    // Check access permissions
    let hasAccess = context.visibility === 'public' || 
                   context.created_by === userId ||
                   role === 'admin';

    if (!hasAccess && context.organization_id) {
      const membership = await c.env.DB.prepare(
        'SELECT id FROM organization_members WHERE organization_id = ? AND user_id = ? AND active = 1'
      ).bind(context.organization_id, userId).first();
      hasAccess = !!membership;
    }

    if (!hasAccess) {
      throw new HTTPException(403, { message: 'Access denied' });
    }

    // Get context interactions
    const interactions = await c.env.DB.prepare(`
      SELECT ci.*, u.name as user_name, u.profile_image as user_image
      FROM context_interactions ci
      JOIN users u ON ci.user_id = u.id
      WHERE ci.context_id = ? AND ci.active = 1
      ORDER BY ci.created_at DESC
      LIMIT 50
    `).bind(contextId).all();

    // Get context followers
    const followers = await c.env.DB.prepare(`
      SELECT u.id, u.name, u.profile_image, cf.created_at as followed_at
      FROM context_followers cf
      JOIN users u ON cf.user_id = u.id
      WHERE cf.context_id = ? AND cf.active = 1
      ORDER BY cf.created_at DESC
    `).bind(contextId).all();

    // Check if current user is following
    const isFollowing = userId ? await c.env.DB.prepare(
      'SELECT id FROM context_followers WHERE context_id = ? AND user_id = ? AND active = 1'
    ).bind(contextId, userId).first() : null;

    // Increment view count
    await c.env.DB.prepare(
      'UPDATE contexts SET view_count = view_count + 1 WHERE id = ?'
    ).bind(contextId).run();

    return c.json({
      success: true,
      context: {
        ...context,
        tags: context.tags ? context.tags.split(',').map(tag => tag.trim()) : [],
        interactions: interactions.results,
        followers: followers.results,
        isFollowing: !!isFollowing,
        canEdit: context.created_by === userId || role === 'admin',
      },
    });

  } catch (error) {
    if (error instanceof HTTPException) {
      throw error;
    }
    console.error('Get context error:', error);
    throw new HTTPException(500, { message: 'Internal server error' });
  }
});

// Create new context
contexts.post('/', async (c) => {
  try {
    const { userId } = c.get('jwtPayload');
    const {
      title,
      category,
      description,
      content,
      tags = [],
      priority = 'medium',
      visibility = 'public',
      organizationId,
      metadata = {},
    } = await c.req.json();

    // Validate required fields
    if (!title || !category || !description) {
      throw new HTTPException(400, { 
        message: 'Title, category, and description are required' 
      });
    }

    // Validate enums
    if (!['low', 'medium', 'high', 'urgent'].includes(priority)) {
      throw new HTTPException(400, { message: 'Invalid priority level' });
    }

    if (!['public', 'organization', 'private'].includes(visibility)) {
      throw new HTTPException(400, { message: 'Invalid visibility setting' });
    }

    // Check organization access if specified
    if (organizationId) {
      const membership = await c.env.DB.prepare(
        'SELECT role FROM organization_members WHERE organization_id = ? AND user_id = ? AND active = 1'
      ).bind(organizationId, userId).first();

      if (!membership) {
        throw new HTTPException(403, { 
          message: 'No permission to create context for this organization' 
        });
      }
    }

    // Create context
    const tagsString = Array.isArray(tags) ? tags.join(', ') : '';
    const result = await c.env.DB.prepare(`
      INSERT INTO contexts (
        title, category, description, content, tags, priority, visibility,
        organization_id, created_by, metadata, status, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active', datetime('now'), datetime('now'))
    `).bind(
      title, category, description, content, tagsString, priority, visibility,
      organizationId, userId, JSON.stringify(metadata)
    ).run();

    if (!result.success) {
      throw new HTTPException(500, { message: 'Failed to create context' });
    }

    const contextId = result.meta.last_row_id;

    // Auto-follow own context
    await c.env.DB.prepare(
      'INSERT INTO context_followers (context_id, user_id, active, created_at) VALUES (?, ?, 1, datetime(\'now\'))'
    ).bind(contextId, userId).run();

    // Log activity
    await logUserActivity(c.env.DB, userId, 'context_created', 'Context Created',
      `Created context: ${title}`, { contextId });

    return c.json({
      success: true,
      message: 'Context created successfully',
      contextId,
    }, 201);

  } catch (error) {
    if (error instanceof HTTPException) {
      throw error;
    }
    console.error('Create context error:', error);
    throw new HTTPException(500, { message: 'Internal server error' });
  }
});

// Update context
contexts.put('/:id', async (c) => {
  try {
    const { userId, role } = c.get('jwtPayload');
    const contextId = c.req.param('id');
    const updateData = await c.req.json();

    // Check if context exists and user has permission
    const context = await c.env.DB.prepare(
      'SELECT created_by, title FROM contexts WHERE id = ? AND active = 1'
    ).bind(contextId).first();

    if (!context) {
      throw new HTTPException(404, { message: 'Context not found' });
    }

    if (context.created_by !== userId && role !== 'admin') {
      throw new HTTPException(403, { message: 'Access denied' });
    }

    // Build update query
    const allowedFields = [
      'title', 'category', 'description', 'content', 'tags', 'priority', 'visibility', 'status'
    ];
    
    const updates = [];
    const values = [];

    Object.keys(updateData).forEach(key => {
      if (allowedFields.includes(key) && updateData[key] !== undefined) {
        if (key === 'tags' && Array.isArray(updateData[key])) {
          updates.push('tags = ?');
          values.push(updateData[key].join(', '));
        } else {
          updates.push(`${key} = ?`);
          values.push(updateData[key]);
        }
      }
    });

    if (updates.length === 0) {
      throw new HTTPException(400, { message: 'No valid fields to update' });
    }

    updates.push('updated_at = datetime(\'now\')');
    values.push(contextId);

    const query = `UPDATE contexts SET ${updates.join(', ')} WHERE id = ?`;
    const result = await c.env.DB.prepare(query).bind(...values).run();

    if (!result.success || result.changes === 0) {
      throw new HTTPException(404, { message: 'Context not found or no changes made' });
    }

    // Log activity
    await logUserActivity(c.env.DB, userId, 'context_updated', 'Context Updated',
      `Updated context: ${context.title}`, { contextId });

    return c.json({
      success: true,
      message: 'Context updated successfully',
    });

  } catch (error) {
    if (error instanceof HTTPException) {
      throw error;
    }
    console.error('Update context error:', error);
    throw new HTTPException(500, { message: 'Internal server error' });
  }
});

// Delete context (soft delete)
contexts.delete('/:id', async (c) => {
  try {
    const { userId, role } = c.get('jwtPayload');
    const contextId = c.req.param('id');

    // Check if context exists and user has permission
    const context = await c.env.DB.prepare(
      'SELECT created_by, title FROM contexts WHERE id = ? AND active = 1'
    ).bind(contextId).first();

    if (!context) {
      throw new HTTPException(404, { message: 'Context not found' });
    }

    if (context.created_by !== userId && role !== 'admin') {
      throw new HTTPException(403, { message: 'Access denied' });
    }

    // Soft delete context
    const result = await c.env.DB.prepare(
      'UPDATE contexts SET active = 0, updated_at = datetime(\'now\') WHERE id = ?'
    ).bind(contextId).run();

    if (!result.success || result.changes === 0) {
      throw new HTTPException(404, { message: 'Context not found' });
    }

    // Also deactivate related records
    await Promise.all([
      c.env.DB.prepare('UPDATE context_interactions SET active = 0 WHERE context_id = ?').bind(contextId).run(),
      c.env.DB.prepare('UPDATE context_followers SET active = 0 WHERE context_id = ?').bind(contextId).run(),
    ]);

    // Log activity
    await logUserActivity(c.env.DB, userId, 'context_deleted', 'Context Deleted',
      `Deleted context: ${context.title}`, { contextId });

    return c.json({
      success: true,
      message: 'Context deleted successfully',
    });

  } catch (error) {
    if (error instanceof HTTPException) {
      throw error;
    }
    console.error('Delete context error:', error);
    throw new HTTPException(500, { message: 'Internal server error' });
  }
});

// Follow/unfollow context
contexts.post('/:id/follow', async (c) => {
  try {
    const { userId } = c.get('jwtPayload');
    const contextId = c.req.param('id');

    // Check if context exists and is accessible
    const context = await c.env.DB.prepare(
      'SELECT id, visibility, created_by, organization_id FROM contexts WHERE id = ? AND active = 1'
    ).bind(contextId).first();

    if (!context) {
      throw new HTTPException(404, { message: 'Context not found' });
    }

    // Check access permissions (same as in get context)
    let hasAccess = context.visibility === 'public' || context.created_by === userId;
    
    if (!hasAccess && context.organization_id) {
      const membership = await c.env.DB.prepare(
        'SELECT id FROM organization_members WHERE organization_id = ? AND user_id = ? AND active = 1'
      ).bind(context.organization_id, userId).first();
      hasAccess = !!membership;
    }

    if (!hasAccess) {
      throw new HTTPException(403, { message: 'Access denied' });
    }

    // Check if already following
    const existing = await c.env.DB.prepare(
      'SELECT id, active FROM context_followers WHERE context_id = ? AND user_id = ?'
    ).bind(contextId, userId).first();

    let message = '';
    if (existing) {
      // Toggle follow status
      const newActive = existing.active ? 0 : 1;
      await c.env.DB.prepare(
        'UPDATE context_followers SET active = ?, updated_at = datetime(\'now\') WHERE id = ?'
      ).bind(newActive, existing.id).run();
      message = newActive ? 'Context followed successfully' : 'Context unfollowed successfully';
    } else {
      // Create new follow record
      await c.env.DB.prepare(
        'INSERT INTO context_followers (context_id, user_id, active, created_at) VALUES (?, ?, 1, datetime(\'now\'))'
      ).bind(contextId, userId).run();
      message = 'Context followed successfully';
    }

    return c.json({
      success: true,
      message,
    });

  } catch (error) {
    if (error instanceof HTTPException) {
      throw error;
    }
    console.error('Follow context error:', error);
    throw new HTTPException(500, { message: 'Internal server error' });
  }
});

// Add interaction to context
contexts.post('/:id/interact', async (c) => {
  try {
    const { userId } = c.get('jwtPayload');
    const contextId = c.req.param('id');
    const { type, content, metadata = {} } = await c.req.json();

    if (!type || !content) {
      throw new HTTPException(400, { message: 'Type and content are required' });
    }

    if (!['comment', 'question', 'suggestion', 'update'].includes(type)) {
      throw new HTTPException(400, { message: 'Invalid interaction type' });
    }

    // Check if context exists and is accessible (similar to follow logic)
    const context = await c.env.DB.prepare(
      'SELECT id, visibility, created_by, organization_id FROM contexts WHERE id = ? AND active = 1'
    ).bind(contextId).first();

    if (!context) {
      throw new HTTPException(404, { message: 'Context not found' });
    }

    // Check access permissions
    let hasAccess = context.visibility === 'public' || context.created_by === userId;
    
    if (!hasAccess && context.organization_id) {
      const membership = await c.env.DB.prepare(
        'SELECT id FROM organization_members WHERE organization_id = ? AND user_id = ? AND active = 1'
      ).bind(context.organization_id, userId).first();
      hasAccess = !!membership;
    }

    if (!hasAccess) {
      throw new HTTPException(403, { message: 'Access denied' });
    }

    // Create interaction
    const result = await c.env.DB.prepare(`
      INSERT INTO context_interactions (context_id, user_id, type, content, metadata, created_at, active)
      VALUES (?, ?, ?, ?, ?, datetime('now'), 1)
    `).bind(contextId, userId, type, content, JSON.stringify(metadata)).run();

    if (!result.success) {
      throw new HTTPException(500, { message: 'Failed to create interaction' });
    }

    // Update context's last activity
    await c.env.DB.prepare(
      'UPDATE contexts SET updated_at = datetime(\'now\') WHERE id = ?'
    ).bind(contextId).run();

    return c.json({
      success: true,
      message: 'Interaction added successfully',
      interactionId: result.meta.last_row_id,
    }, 201);

  } catch (error) {
    if (error instanceof HTTPException) {
      throw error;
    }
    console.error('Add interaction error:', error);
    throw new HTTPException(500, { message: 'Internal server error' });
  }
});

// Helper function
async function logUserActivity(db, userId, activityType, title, description, metadata = {}) {
  try {
    await db.prepare(`
      INSERT INTO user_activities (user_id, activity_type, title, description, metadata, created_at)
      VALUES (?, ?, ?, ?, ?, datetime('now'))
    `).bind(userId, activityType, title, description, JSON.stringify(metadata)).run();
  } catch (error) {
    console.error('Failed to log user activity:', error);
  }
}

export { contexts as contextRoutes };