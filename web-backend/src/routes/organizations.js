/**
 * Organization management routes for Cloudflare Worker
 */

import { Hono } from 'hono';
import { HTTPException } from 'hono/http-exception';

const organizations = new Hono();

// Get all organizations (public listing)
organizations.get('/', async (c) => {
  try {
    const { page = '1', limit = '20', search, type, location } = c.req.query();
    const offset = (parseInt(page) - 1) * parseInt(limit);

    let query = `
      SELECT o.id, o.name, o.type, o.description, o.location, o.website,
             o.logo_url, o.created_at,
             COUNT(DISTINCT om.user_id) as member_count,
             COUNT(DISTINCT f.id) as farm_count
      FROM organizations o
      LEFT JOIN organization_members om ON o.id = om.organization_id AND om.active = 1
      LEFT JOIN farms f ON o.id = f.organization_id AND f.active = 1
      WHERE o.active = 1 AND o.is_public = 1
    `;

    const params = [];

    if (search) {
      query += ' AND (o.name LIKE ? OR o.description LIKE ?)';
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm);
    }

    if (type) {
      query += ' AND o.type = ?';
      params.push(type);
    }

    if (location) {
      query += ' AND o.location LIKE ?';
      params.push(`%${location}%`);
    }

    query += ' GROUP BY o.id ORDER BY o.created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), offset);

    const result = await c.env.DB.prepare(query).bind(...params).all();

    return c.json({
      success: true,
      organizations: result.results,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        hasMore: result.results.length === parseInt(limit),
      },
    });

  } catch (error) {
    console.error('Get organizations error:', error);
    throw new HTTPException(500, { message: 'Internal server error' });
  }
});

// Get organization by ID
organizations.get('/:id', async (c) => {
  try {
    const orgId = c.req.param('id');

    const org = await c.env.DB.prepare(`
      SELECT o.*, 
             COUNT(DISTINCT om.user_id) as member_count,
             COUNT(DISTINCT f.id) as farm_count
      FROM organizations o
      LEFT JOIN organization_members om ON o.id = om.organization_id AND om.active = 1
      LEFT JOIN farms f ON o.id = f.organization_id AND f.active = 1
      WHERE o.id = ? AND o.active = 1
      GROUP BY o.id
    `).bind(orgId).first();

    if (!org) {
      throw new HTTPException(404, { message: 'Organization not found' });
    }

    // Check if organization is public or user has access
    const { userId } = c.get('jwtPayload') || {};
    let hasAccess = org.is_public;
    let userRole = null;

    if (userId) {
      const membership = await c.env.DB.prepare(
        'SELECT role FROM organization_members WHERE organization_id = ? AND user_id = ? AND active = 1'
      ).bind(orgId, userId).first();
      
      if (membership) {
        hasAccess = true;
        userRole = membership.role;
      }
    }

    if (!hasAccess) {
      throw new HTTPException(403, { message: 'Access denied' });
    }

    // Get members if user has access
    let members = [];
    if (hasAccess && (org.show_members || userRole)) {
      const membersResult = await c.env.DB.prepare(`
        SELECT u.id, u.name, u.email, u.profile_image, om.role, om.joined_at
        FROM organization_members om
        JOIN users u ON om.user_id = u.id
        WHERE om.organization_id = ? AND om.active = 1 AND u.active = 1
        ORDER BY om.joined_at DESC
      `).bind(orgId).all();
      
      members = membersResult.results;
    }

    return c.json({
      success: true,
      organization: {
        ...org,
        userRole,
        members: members,
      },
    });

  } catch (error) {
    if (error instanceof HTTPException) {
      throw error;
    }
    console.error('Get organization error:', error);
    throw new HTTPException(500, { message: 'Internal server error' });
  }
});

// Create new organization
organizations.post('/', async (c) => {
  try {
    const { userId } = c.get('jwtPayload');
    const {
      name,
      type,
      description,
      location,
      website,
      phone,
      email,
      isPublic = true,
      showMembers = true,
    } = await c.req.json();

    if (!name || !type || !description) {
      throw new HTTPException(400, { 
        message: 'Name, type, and description are required' 
      });
    }

    // Check if organization name already exists
    const existing = await c.env.DB.prepare(
      'SELECT id FROM organizations WHERE name = ? AND active = 1'
    ).bind(name).first();

    if (existing) {
      throw new HTTPException(409, { 
        message: 'Organization with this name already exists' 
      });
    }

    // Create organization
    const result = await c.env.DB.prepare(`
      INSERT INTO organizations (
        name, type, description, location, website, phone, email,
        is_public, show_members, created_by, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
    `).bind(
      name, type, description, location, website, phone, email,
      isPublic ? 1 : 0, showMembers ? 1 : 0, userId
    ).run();

    if (!result.success) {
      throw new HTTPException(500, { message: 'Failed to create organization' });
    }

    const orgId = result.meta.last_row_id;

    // Add creator as admin member
    await c.env.DB.prepare(`
      INSERT INTO organization_members (organization_id, user_id, role, joined_at, active)
      VALUES (?, ?, 'admin', datetime('now'), 1)
    `).bind(orgId, userId).run();

    // Log activity
    await logUserActivity(c.env.DB, userId, 'organization_created', 'Organization Created',
      `Created organization: ${name}`, { organizationId: orgId });

    return c.json({
      success: true,
      message: 'Organization created successfully',
      organizationId: orgId,
    }, 201);

  } catch (error) {
    if (error instanceof HTTPException) {
      throw error;
    }
    console.error('Create organization error:', error);
    throw new HTTPException(500, { message: 'Internal server error' });
  }
});

// Update organization
organizations.put('/:id', async (c) => {
  try {
    const { userId } = c.get('jwtPayload');
    const orgId = c.req.param('id');
    const updateData = await c.req.json();

    // Check if user has admin permission
    const membership = await c.env.DB.prepare(
      'SELECT role FROM organization_members WHERE organization_id = ? AND user_id = ? AND active = 1'
    ).bind(orgId, userId).first();

    if (!membership || membership.role !== 'admin') {
      throw new HTTPException(403, { message: 'Admin access required' });
    }

    // Build update query
    const allowedFields = [
      'name', 'type', 'description', 'location', 'website', 'phone', 'email',
      'is_public', 'show_members', 'logo_url'
    ];
    
    const updates = [];
    const values = [];

    Object.keys(updateData).forEach(key => {
      const dbKey = key.replace(/([A-Z])/g, '_$1').toLowerCase(); // Convert camelCase to snake_case
      if (allowedFields.includes(dbKey) && updateData[key] !== undefined) {
        updates.push(`${dbKey} = ?`);
        values.push(updateData[key]);
      }
    });

    if (updates.length === 0) {
      throw new HTTPException(400, { message: 'No valid fields to update' });
    }

    updates.push('updated_at = datetime(\'now\')');
    values.push(orgId);

    const query = `UPDATE organizations SET ${updates.join(', ')} WHERE id = ? AND active = 1`;
    const result = await c.env.DB.prepare(query).bind(...values).run();

    if (!result.success || result.changes === 0) {
      throw new HTTPException(404, { message: 'Organization not found or no changes made' });
    }

    // Log activity
    await logUserActivity(c.env.DB, userId, 'organization_updated', 'Organization Updated',
      `Updated organization settings`, { organizationId: orgId });

    return c.json({
      success: true,
      message: 'Organization updated successfully',
    });

  } catch (error) {
    if (error instanceof HTTPException) {
      throw error;
    }
    console.error('Update organization error:', error);
    throw new HTTPException(500, { message: 'Internal server error' });
  }
});

// Join organization
organizations.post('/:id/join', async (c) => {
  try {
    const { userId } = c.get('jwtPayload');
    const orgId = c.req.param('id');
    const { message } = await c.req.json();

    // Check if organization exists and is joinable
    const org = await c.env.DB.prepare(
      'SELECT name, is_public FROM organizations WHERE id = ? AND active = 1'
    ).bind(orgId).first();

    if (!org) {
      throw new HTTPException(404, { message: 'Organization not found' });
    }

    if (!org.is_public) {
      throw new HTTPException(403, { message: 'Organization is not accepting new members' });
    }

    // Check if user is already a member
    const existing = await c.env.DB.prepare(
      'SELECT id FROM organization_members WHERE organization_id = ? AND user_id = ?'
    ).bind(orgId, userId).first();

    if (existing) {
      throw new HTTPException(409, { message: 'Already a member of this organization' });
    }

    // Add user as pending member
    await c.env.DB.prepare(`
      INSERT INTO organization_members (organization_id, user_id, role, status, join_message, joined_at, active)
      VALUES (?, ?, 'member', 'pending', ?, datetime('now'), 1)
    `).bind(orgId, userId, message || null).run();

    // Notify organization admins
    const admins = await c.env.DB.prepare(`
      SELECT u.email, u.name FROM organization_members om
      JOIN users u ON om.user_id = u.id
      WHERE om.organization_id = ? AND om.role = 'admin' AND om.active = 1
    `).bind(orgId).all();

    for (const admin of admins.results) {
      await c.env.EMAIL_QUEUE.send({
        to: admin.email,
        subject: `New membership request for ${org.name}`,
        template: 'membership-request',
        data: {
          adminName: admin.name,
          organizationName: org.name,
          requestMessage: message,
        },
      });
    }

    return c.json({
      success: true,
      message: 'Membership request sent successfully',
    });

  } catch (error) {
    if (error instanceof HTTPException) {
      throw error;
    }
    console.error('Join organization error:', error);
    throw new HTTPException(500, { message: 'Internal server error' });
  }
});

// Manage member (approve, reject, change role, remove)
organizations.put('/:id/members/:memberId', async (c) => {
  try {
    const { userId } = c.get('jwtPayload');
    const orgId = c.req.param('id');
    const memberId = c.req.param('memberId');
    const { action, role } = await c.req.json();

    // Check if user has admin permission
    const adminMembership = await c.env.DB.prepare(
      'SELECT role FROM organization_members WHERE organization_id = ? AND user_id = ? AND active = 1'
    ).bind(orgId, userId).first();

    if (!adminMembership || adminMembership.role !== 'admin') {
      throw new HTTPException(403, { message: 'Admin access required' });
    }

    // Get target member
    const targetMember = await c.env.DB.prepare(`
      SELECT om.id, om.user_id, om.role, om.status, u.name, u.email
      FROM organization_members om
      JOIN users u ON om.user_id = u.id
      WHERE om.organization_id = ? AND om.user_id = ? AND om.active = 1
    `).bind(orgId, memberId).first();

    if (!targetMember) {
      throw new HTTPException(404, { message: 'Member not found' });
    }

    let result;
    let message = '';

    switch (action) {
      case 'approve':
        result = await c.env.DB.prepare(
          'UPDATE organization_members SET status = \'active\' WHERE id = ?'
        ).bind(targetMember.id).run();
        message = 'Member approved successfully';
        break;

      case 'reject':
        result = await c.env.DB.prepare(
          'UPDATE organization_members SET active = 0 WHERE id = ?'
        ).bind(targetMember.id).run();
        message = 'Member rejected';
        break;

      case 'change_role':
        if (!role || !['admin', 'manager', 'member'].includes(role)) {
          throw new HTTPException(400, { message: 'Valid role is required' });
        }
        result = await c.env.DB.prepare(
          'UPDATE organization_members SET role = ? WHERE id = ?'
        ).bind(role, targetMember.id).run();
        message = 'Member role updated successfully';
        break;

      case 'remove':
        result = await c.env.DB.prepare(
          'UPDATE organization_members SET active = 0 WHERE id = ?'
        ).bind(targetMember.id).run();
        message = 'Member removed successfully';
        break;

      default:
        throw new HTTPException(400, { message: 'Invalid action' });
    }

    if (!result.success) {
      throw new HTTPException(500, { message: 'Failed to update member' });
    }

    // Log activity
    await logUserActivity(c.env.DB, userId, 'member_management', 'Member Management',
      `${action} member: ${targetMember.name}`, { 
        organizationId: orgId, 
        targetUserId: memberId,
        action 
      });

    return c.json({
      success: true,
      message,
    });

  } catch (error) {
    if (error instanceof HTTPException) {
      throw error;
    }
    console.error('Manage member error:', error);
    throw new HTTPException(500, { message: 'Internal server error' });
  }
});

// Leave organization
organizations.post('/:id/leave', async (c) => {
  try {
    const { userId } = c.get('jwtPayload');
    const orgId = c.req.param('id');

    // Check if user is a member
    const membership = await c.env.DB.prepare(
      'SELECT id, role FROM organization_members WHERE organization_id = ? AND user_id = ? AND active = 1'
    ).bind(orgId, userId).first();

    if (!membership) {
      throw new HTTPException(404, { message: 'Not a member of this organization' });
    }

    // Check if user is the only admin
    if (membership.role === 'admin') {
      const adminCount = await c.env.DB.prepare(
        'SELECT COUNT(*) as count FROM organization_members WHERE organization_id = ? AND role = \'admin\' AND active = 1'
      ).bind(orgId).first();

      if (adminCount.count <= 1) {
        throw new HTTPException(400, { 
          message: 'Cannot leave organization as the only admin. Please assign another admin first.' 
        });
      }
    }

    // Remove membership
    const result = await c.env.DB.prepare(
      'UPDATE organization_members SET active = 0 WHERE id = ?'
    ).bind(membership.id).run();

    if (!result.success) {
      throw new HTTPException(500, { message: 'Failed to leave organization' });
    }

    // Log activity
    await logUserActivity(c.env.DB, userId, 'organization_left', 'Left Organization',
      'Left organization', { organizationId: orgId });

    return c.json({
      success: true,
      message: 'Successfully left organization',
    });

  } catch (error) {
    if (error instanceof HTTPException) {
      throw error;
    }
    console.error('Leave organization error:', error);
    throw new HTTPException(500, { message: 'Internal server error' });
  }
});

// Get organization statistics
organizations.get('/:id/stats', async (c) => {
  try {
    const orgId = c.req.param('id');
    const { userId } = c.get('jwtPayload');

    // Check access
    const hasAccess = await checkOrganizationAccess(c.env.DB, orgId, userId);
    if (!hasAccess) {
      throw new HTTPException(403, { message: 'Access denied' });
    }

    const [memberStats, farmStats, activityStats] = await Promise.all([
      c.env.DB.prepare(`
        SELECT 
          COUNT(*) as total_members,
          COUNT(CASE WHEN role = 'admin' THEN 1 END) as admin_count,
          COUNT(CASE WHEN role = 'manager' THEN 1 END) as manager_count,
          COUNT(CASE WHEN role = 'member' THEN 1 END) as member_count,
          COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_count
        FROM organization_members WHERE organization_id = ? AND active = 1
      `).bind(orgId).first(),

      c.env.DB.prepare(`
        SELECT 
          COUNT(*) as total_farms,
          SUM(size_hectares) as total_area,
          COUNT(DISTINCT farm_type) as farm_types
        FROM farms WHERE organization_id = ? AND active = 1
      `).bind(orgId).first(),

      c.env.DB.prepare(`
        SELECT COUNT(*) as activity_count
        FROM user_activities ua
        JOIN organization_members om ON ua.user_id = om.user_id
        WHERE om.organization_id = ? AND om.active = 1
        AND ua.created_at >= date('now', '-30 days')
      `).bind(orgId).first()
    ]);

    return c.json({
      success: true,
      stats: {
        members: memberStats,
        farms: farmStats,
        activity: activityStats,
      },
    });

  } catch (error) {
    if (error instanceof HTTPException) {
      throw error;
    }
    console.error('Get organization stats error:', error);
    throw new HTTPException(500, { message: 'Internal server error' });
  }
});

// Helper functions
async function checkOrganizationAccess(db, orgId, userId) {
  const org = await db.prepare(
    'SELECT is_public FROM organizations WHERE id = ? AND active = 1'
  ).bind(orgId).first();

  if (!org) return false;
  if (org.is_public) return true;

  if (userId) {
    const membership = await db.prepare(
      'SELECT id FROM organization_members WHERE organization_id = ? AND user_id = ? AND active = 1'
    ).bind(orgId, userId).first();
    return !!membership;
  }

  return false;
}

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

export { organizations as organizationRoutes };