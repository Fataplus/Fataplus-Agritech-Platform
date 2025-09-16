/**
 * Farm management routes for Cloudflare Worker
 */

import { Hono } from 'hono';
import { HTTPException } from 'hono/http-exception';

const farms = new Hono();

// Get all farms (with filters)
farms.get('/', async (c) => {
  try {
    const { userId, role } = c.get('jwtPayload');
    const { 
      page = '1', 
      limit = '20', 
      search, 
      farmType, 
      location, 
      sortBy = 'created_at', 
      sortOrder = 'DESC' 
    } = c.req.query();

    const offset = (parseInt(page) - 1) * parseInt(limit);
    
    // Build query based on user role
    let baseQuery = `
      SELECT f.id, f.name, f.location, f.size_hectares, f.farm_type, 
             f.description, f.created_at, f.updated_at,
             u.name as owner_name, u.email as owner_email,
             COUNT(DISTINCT c.id) as crop_count,
             COUNT(DISTINCT e.id) as equipment_count
      FROM farms f
      JOIN users u ON f.owner_id = u.id
      LEFT JOIN crops c ON f.id = c.farm_id AND c.active = 1
      LEFT JOIN farm_equipment e ON f.id = e.farm_id AND e.active = 1
      WHERE f.active = 1
    `;

    const params = [];

    // Role-based filtering
    if (role === 'farmer') {
      baseQuery += ' AND f.owner_id = ?';
      params.push(userId);
    } else if (role === 'organization_member') {
      // Get farms from user's organizations
      baseQuery += ` AND (f.owner_id = ? OR f.organization_id IN (
        SELECT organization_id FROM organization_members 
        WHERE user_id = ? AND active = 1
      ))`;
      params.push(userId, userId);
    }

    // Add filters
    if (search) {
      baseQuery += ' AND (f.name LIKE ? OR f.location LIKE ? OR f.description LIKE ?)';
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }

    if (farmType) {
      baseQuery += ' AND f.farm_type = ?';
      params.push(farmType);
    }

    if (location) {
      baseQuery += ' AND f.location LIKE ?';
      params.push(`%${location}%`);
    }

    baseQuery += ' GROUP BY f.id, u.id';

    // Add sorting
    const validSortColumns = ['name', 'location', 'size_hectares', 'farm_type', 'created_at'];
    const validSortOrders = ['ASC', 'DESC'];
    
    if (validSortColumns.includes(sortBy) && validSortOrders.includes(sortOrder.toUpperCase())) {
      baseQuery += ` ORDER BY f.${sortBy} ${sortOrder.toUpperCase()}`;
    } else {
      baseQuery += ' ORDER BY f.created_at DESC';
    }

    baseQuery += ' LIMIT ? OFFSET ?';
    params.push(parseInt(limit), offset);

    const farmsResult = await c.env.DB.prepare(baseQuery).bind(...params).all();

    // Get total count for pagination
    let countQuery = `
      SELECT COUNT(DISTINCT f.id) as total
      FROM farms f
      JOIN users u ON f.owner_id = u.id
      WHERE f.active = 1
    `;
    const countParams = [];

    if (role === 'farmer') {
      countQuery += ' AND f.owner_id = ?';
      countParams.push(userId);
    } else if (role === 'organization_member') {
      countQuery += ` AND (f.owner_id = ? OR f.organization_id IN (
        SELECT organization_id FROM organization_members 
        WHERE user_id = ? AND active = 1
      ))`;
      countParams.push(userId, userId);
    }

    if (search) {
      countQuery += ' AND (f.name LIKE ? OR f.location LIKE ? OR f.description LIKE ?)';
      const searchTerm = `%${search}%`;
      countParams.push(searchTerm, searchTerm, searchTerm);
    }

    if (farmType) {
      countQuery += ' AND f.farm_type = ?';
      countParams.push(farmType);
    }

    if (location) {
      countQuery += ' AND f.location LIKE ?';
      countParams.push(`%${location}%`);
    }

    const countResult = await c.env.DB.prepare(countQuery).bind(...countParams).first();
    const totalCount = countResult?.total || 0;

    return c.json({
      success: true,
      farms: farmsResult.results,
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
    console.error('Get farms error:', error);
    throw new HTTPException(500, { message: 'Internal server error' });
  }
});

// Get farm by ID
farms.get('/:id', async (c) => {
  try {
    const { userId, role } = c.get('jwtPayload');
    const farmId = c.req.param('id');

    const farm = await c.env.DB.prepare(`
      SELECT f.*, u.name as owner_name, u.email as owner_email, u.phone as owner_phone,
             o.name as organization_name, o.type as organization_type
      FROM farms f
      JOIN users u ON f.owner_id = u.id
      LEFT JOIN organizations o ON f.organization_id = o.id
      WHERE f.id = ? AND f.active = 1
    `).bind(farmId).first();

    if (!farm) {
      throw new HTTPException(404, { message: 'Farm not found' });
    }

    // Check access permissions
    const hasAccess = role === 'admin' || 
                     farm.owner_id === userId ||
                     (farm.organization_id && await checkOrganizationMembership(c.env.DB, userId, farm.organization_id));

    if (!hasAccess) {
      throw new HTTPException(403, { message: 'Access denied' });
    }

    // Get farm's crops
    const crops = await c.env.DB.prepare(`
      SELECT id, name, variety, planting_date, expected_harvest_date, 
             current_stage, health_status, area_hectares
      FROM crops
      WHERE farm_id = ? AND active = 1
      ORDER BY planting_date DESC
    `).bind(farmId).all();

    // Get farm's equipment
    const equipment = await c.env.DB.prepare(`
      SELECT id, name, type, brand, model, purchase_date, 
             condition_status, last_maintenance
      FROM farm_equipment
      WHERE farm_id = ? AND active = 1
      ORDER BY name
    `).bind(farmId).all();

    return c.json({
      success: true,
      farm: {
        ...farm,
        crops: crops.results,
        equipment: equipment.results,
      },
    });

  } catch (error) {
    if (error instanceof HTTPException) {
      throw error;
    }
    console.error('Get farm error:', error);
    throw new HTTPException(500, { message: 'Internal server error' });
  }
});

// Create new farm
farms.post('/', async (c) => {
  try {
    const { userId } = c.get('jwtPayload');
    const {
      name,
      location,
      sizeHectares,
      farmType,
      description,
      organizationId,
      coordinates,
      soilType,
      waterSource,
      climateZone,
    } = await c.req.json();

    // Validate required fields
    if (!name || !location || !sizeHectares || !farmType) {
      throw new HTTPException(400, { 
        message: 'Name, location, size, and farm type are required' 
      });
    }

    if (sizeHectares <= 0) {
      throw new HTTPException(400, { message: 'Farm size must be positive' });
    }

    // Check if user has permission to create farm for organization
    if (organizationId) {
      const hasPermission = await checkOrganizationPermission(
        c.env.DB, 
        userId, 
        organizationId, 
        'create_farm'
      );
      if (!hasPermission) {
        throw new HTTPException(403, { 
          message: 'No permission to create farm for this organization' 
        });
      }
    }

    const result = await c.env.DB.prepare(`
      INSERT INTO farms (
        owner_id, name, location, size_hectares, farm_type, description,
        organization_id, coordinates, soil_type, water_source, climate_zone,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
    `).bind(
      userId, name, location, sizeHectares, farmType, description,
      organizationId, coordinates ? JSON.stringify(coordinates) : null,
      soilType, waterSource, climateZone
    ).run();

    if (!result.success) {
      throw new HTTPException(500, { message: 'Failed to create farm' });
    }

    // Log activity
    await logUserActivity(c.env.DB, userId, 'farm_created', 'Farm Created', 
      `Created new farm: ${name}`, { farmId: result.meta.last_row_id });

    // Get created farm data
    const farm = await c.env.DB.prepare(
      'SELECT * FROM farms WHERE id = ?'
    ).bind(result.meta.last_row_id).first();

    return c.json({
      success: true,
      message: 'Farm created successfully',
      farm,
    }, 201);

  } catch (error) {
    if (error instanceof HTTPException) {
      throw error;
    }
    console.error('Create farm error:', error);
    throw new HTTPException(500, { message: 'Internal server error' });
  }
});

// Update farm
farms.put('/:id', async (c) => {
  try {
    const { userId, role } = c.get('jwtPayload');
    const farmId = c.req.param('id');
    const updateData = await c.req.json();

    // Check if farm exists and user has permission
    const farm = await c.env.DB.prepare(
      'SELECT owner_id, organization_id, name FROM farms WHERE id = ? AND active = 1'
    ).bind(farmId).first();

    if (!farm) {
      throw new HTTPException(404, { message: 'Farm not found' });
    }

    const hasAccess = role === 'admin' ||
                     farm.owner_id === userId ||
                     (farm.organization_id && await checkOrganizationPermission(
                       c.env.DB, userId, farm.organization_id, 'update_farm'
                     ));

    if (!hasAccess) {
      throw new HTTPException(403, { message: 'Access denied' });
    }

    // Build update query
    const allowedFields = [
      'name', 'location', 'size_hectares', 'farm_type', 'description',
      'coordinates', 'soil_type', 'water_source', 'climate_zone'
    ];
    
    const updates = [];
    const values = [];

    Object.keys(updateData).forEach(key => {
      if (allowedFields.includes(key) && updateData[key] !== undefined) {
        updates.push(`${key} = ?`);
        if (key === 'coordinates' && updateData[key]) {
          values.push(JSON.stringify(updateData[key]));
        } else {
          values.push(updateData[key]);
        }
      }
    });

    if (updates.length === 0) {
      throw new HTTPException(400, { message: 'No valid fields to update' });
    }

    updates.push('updated_at = datetime(\'now\')');
    values.push(farmId);

    const query = `UPDATE farms SET ${updates.join(', ')} WHERE id = ?`;
    const result = await c.env.DB.prepare(query).bind(...values).run();

    if (!result.success || result.changes === 0) {
      throw new HTTPException(404, { message: 'Farm not found or no changes made' });
    }

    // Log activity
    await logUserActivity(c.env.DB, userId, 'farm_updated', 'Farm Updated',
      `Updated farm: ${farm.name}`, { farmId });

    // Get updated farm data
    const updatedFarm = await c.env.DB.prepare(
      'SELECT * FROM farms WHERE id = ?'
    ).bind(farmId).first();

    return c.json({
      success: true,
      message: 'Farm updated successfully',
      farm: updatedFarm,
    });

  } catch (error) {
    if (error instanceof HTTPException) {
      throw error;
    }
    console.error('Update farm error:', error);
    throw new HTTPException(500, { message: 'Internal server error' });
  }
});

// Delete farm (soft delete)
farms.delete('/:id', async (c) => {
  try {
    const { userId, role } = c.get('jwtPayload');
    const farmId = c.req.param('id');

    // Check if farm exists and user has permission
    const farm = await c.env.DB.prepare(
      'SELECT owner_id, organization_id, name FROM farms WHERE id = ? AND active = 1'
    ).bind(farmId).first();

    if (!farm) {
      throw new HTTPException(404, { message: 'Farm not found' });
    }

    const hasAccess = role === 'admin' ||
                     farm.owner_id === userId ||
                     (farm.organization_id && await checkOrganizationPermission(
                       c.env.DB, userId, farm.organization_id, 'delete_farm'
                     ));

    if (!hasAccess) {
      throw new HTTPException(403, { message: 'Access denied' });
    }

    // Soft delete farm
    const result = await c.env.DB.prepare(
      'UPDATE farms SET active = 0, updated_at = datetime(\'now\') WHERE id = ?'
    ).bind(farmId).run();

    if (!result.success || result.changes === 0) {
      throw new HTTPException(404, { message: 'Farm not found' });
    }

    // Also deactivate related records
    await Promise.all([
      c.env.DB.prepare('UPDATE crops SET active = 0 WHERE farm_id = ?').bind(farmId).run(),
      c.env.DB.prepare('UPDATE farm_equipment SET active = 0 WHERE farm_id = ?').bind(farmId).run(),
    ]);

    // Log activity
    await logUserActivity(c.env.DB, userId, 'farm_deleted', 'Farm Deleted',
      `Deleted farm: ${farm.name}`, { farmId });

    return c.json({
      success: true,
      message: 'Farm deleted successfully',
    });

  } catch (error) {
    if (error instanceof HTTPException) {
      throw error;
    }
    console.error('Delete farm error:', error);
    throw new HTTPException(500, { message: 'Internal server error' });
  }
});

// Get farm statistics
farms.get('/:id/stats', async (c) => {
  try {
    const { userId, role } = c.get('jwtPayload');
    const farmId = c.req.param('id');

    // Check access
    const farm = await c.env.DB.prepare(
      'SELECT owner_id, organization_id FROM farms WHERE id = ? AND active = 1'
    ).bind(farmId).first();

    if (!farm) {
      throw new HTTPException(404, { message: 'Farm not found' });
    }

    const hasAccess = role === 'admin' ||
                     farm.owner_id === userId ||
                     (farm.organization_id && await checkOrganizationMembership(c.env.DB, userId, farm.organization_id));

    if (!hasAccess) {
      throw new HTTPException(403, { message: 'Access denied' });
    }

    // Get statistics
    const [cropStats, equipmentStats, recentActivity] = await Promise.all([
      c.env.DB.prepare(`
        SELECT 
          COUNT(*) as total_crops,
          COUNT(CASE WHEN current_stage = 'growing' THEN 1 END) as growing_crops,
          COUNT(CASE WHEN health_status = 'healthy' THEN 1 END) as healthy_crops,
          SUM(area_hectares) as total_crop_area
        FROM crops WHERE farm_id = ? AND active = 1
      `).bind(farmId).first(),
      
      c.env.DB.prepare(`
        SELECT 
          COUNT(*) as total_equipment,
          COUNT(CASE WHEN condition_status = 'good' THEN 1 END) as good_condition,
          COUNT(CASE WHEN condition_status = 'needs_maintenance' THEN 1 END) as needs_maintenance
        FROM farm_equipment WHERE farm_id = ? AND active = 1
      `).bind(farmId).first(),
      
      c.env.DB.prepare(`
        SELECT activity_type, title, description, created_at
        FROM user_activities 
        WHERE JSON_EXTRACT(metadata, '$.farmId') = ?
        ORDER BY created_at DESC
        LIMIT 5
      `).bind(farmId).all()
    ]);

    return c.json({
      success: true,
      stats: {
        crops: cropStats,
        equipment: equipmentStats,
        recentActivity: recentActivity.results,
      },
    });

  } catch (error) {
    if (error instanceof HTTPException) {
      throw error;
    }
    console.error('Get farm stats error:', error);
    throw new HTTPException(500, { message: 'Internal server error' });
  }
});

// Helper functions
async function checkOrganizationMembership(db, userId, organizationId) {
  const membership = await db.prepare(
    'SELECT id FROM organization_members WHERE user_id = ? AND organization_id = ? AND active = 1'
  ).bind(userId, organizationId).first();
  return !!membership;
}

async function checkOrganizationPermission(db, userId, organizationId, permission) {
  const member = await db.prepare(`
    SELECT role FROM organization_members 
    WHERE user_id = ? AND organization_id = ? AND active = 1
  `).bind(userId, organizationId).first();

  if (!member) return false;

  // For simplicity, assuming admin and manager roles have all permissions
  return ['admin', 'manager'].includes(member.role);
}

async function logUserActivity(db, userId, activityType, title, description, metadata = {}) {
  try {
    await db.prepare(`
      INSERT INTO user_activities (user_id, activity_type, title, description, metadata, created_at)
      VALUES (?, ?, ?, ?, ?, datetime('now'))
    `).bind(userId, activityType, title, description, JSON.stringify(metadata)).run();
  } catch (error) {
    console.error('Failed to log user activity:', error);
    // Don't throw error as this is not critical
  }
}

export { farms as farmRoutes };