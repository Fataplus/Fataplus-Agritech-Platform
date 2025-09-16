/**
 * User management routes for Cloudflare Worker
 */

import { Hono } from 'hono';
import { HTTPException } from 'hono/http-exception';

const users = new Hono();

// Get current user profile
users.get('/profile', async (c) => {
  try {
    const { userId } = c.get('jwtPayload');

    const user = await c.env.DB.prepare(
      `SELECT id, email, name, phone, role, organization_id, created_at, updated_at, last_login,
              profile_image, bio, location, preferences
       FROM users WHERE id = ? AND active = 1`
    ).bind(userId).first();

    if (!user) {
      throw new HTTPException(404, { message: 'User not found' });
    }

    // Get organization details if user belongs to one
    let organization = null;
    if (user.organization_id) {
      organization = await c.env.DB.prepare(
        'SELECT id, name, type FROM organizations WHERE id = ?'
      ).bind(user.organization_id).first();
    }

    return c.json({
      success: true,
      user: {
        ...user,
        preferences: user.preferences ? JSON.parse(user.preferences) : {},
        organization,
      },
    });

  } catch (error) {
    if (error instanceof HTTPException) {
      throw error;
    }
    console.error('Get profile error:', error);
    throw new HTTPException(500, { message: 'Internal server error' });
  }
});

// Update user profile
users.put('/profile', async (c) => {
  try {
    const { userId } = c.get('jwtPayload');
    const { name, phone, bio, location, preferences } = await c.req.json();

    // Validate input
    if (name && name.length < 2) {
      throw new HTTPException(400, { message: 'Name must be at least 2 characters long' });
    }

    if (phone && !/^\+?[1-9]\d{1,14}$/.test(phone)) {
      throw new HTTPException(400, { message: 'Invalid phone number format' });
    }

    // Build update query dynamically
    const updates = [];
    const values = [];

    if (name !== undefined) {
      updates.push('name = ?');
      values.push(name);
    }
    if (phone !== undefined) {
      updates.push('phone = ?');
      values.push(phone);
    }
    if (bio !== undefined) {
      updates.push('bio = ?');
      values.push(bio);
    }
    if (location !== undefined) {
      updates.push('location = ?');
      values.push(location);
    }
    if (preferences !== undefined) {
      updates.push('preferences = ?');
      values.push(JSON.stringify(preferences));
    }

    if (updates.length === 0) {
      throw new HTTPException(400, { message: 'No fields to update' });
    }

    updates.push('updated_at = datetime(\'now\')');
    values.push(userId);

    const query = `UPDATE users SET ${updates.join(', ')} WHERE id = ? AND active = 1`;
    const result = await c.env.DB.prepare(query).bind(...values).run();

    if (!result.success || result.changes === 0) {
      throw new HTTPException(404, { message: 'User not found or no changes made' });
    }

    // Get updated user data
    const updatedUser = await c.env.DB.prepare(
      `SELECT id, email, name, phone, role, bio, location, preferences, updated_at
       FROM users WHERE id = ?`
    ).bind(userId).first();

    return c.json({
      success: true,
      message: 'Profile updated successfully',
      user: {
        ...updatedUser,
        preferences: updatedUser.preferences ? JSON.parse(updatedUser.preferences) : {},
      },
    });

  } catch (error) {
    if (error instanceof HTTPException) {
      throw error;
    }
    console.error('Update profile error:', error);
    throw new HTTPException(500, { message: 'Internal server error' });
  }
});

// Upload profile image
users.post('/profile/image', async (c) => {
  try {
    const { userId } = c.get('jwtPayload');
    
    const formData = await c.req.formData();
    const imageFile = formData.get('image');

    if (!imageFile || !(imageFile instanceof File)) {
      throw new HTTPException(400, { message: 'No image file provided' });
    }

    // Validate file type
    if (!imageFile.type.startsWith('image/')) {
      throw new HTTPException(400, { message: 'File must be an image' });
    }

    // Validate file size (5MB limit)
    if (imageFile.size > 5 * 1024 * 1024) {
      throw new HTTPException(400, { message: 'Image size must be less than 5MB' });
    }

    // Generate unique filename
    const extension = imageFile.name.split('.').pop();
    const filename = `profile/${userId}-${Date.now()}.${extension}`;

    // Upload to R2 storage
    const imageBuffer = await imageFile.arrayBuffer();
    await c.env.STORAGE.put(filename, imageBuffer, {
      httpMetadata: {
        contentType: imageFile.type,
        cacheControl: 'public, max-age=31536000', // 1 year
      },
    });

    // Update user profile with image URL
    const imageUrl = `https://storage.fata.plus/${filename}`;
    await c.env.DB.prepare(
      'UPDATE users SET profile_image = ?, updated_at = datetime(\'now\') WHERE id = ?'
    ).bind(imageUrl, userId).run();

    return c.json({
      success: true,
      message: 'Profile image uploaded successfully',
      imageUrl,
    });

  } catch (error) {
    if (error instanceof HTTPException) {
      throw error;
    }
    console.error('Upload profile image error:', error);
    throw new HTTPException(500, { message: 'Internal server error' });
  }
});

// Get user's farms
users.get('/farms', async (c) => {
  try {
    const { userId } = c.get('jwtPayload');

    const farms = await c.env.DB.prepare(
      `SELECT f.id, f.name, f.location, f.size_hectares, f.farm_type, f.created_at,
              COUNT(c.id) as crop_count
       FROM farms f
       LEFT JOIN crops c ON f.id = c.farm_id AND c.active = 1
       WHERE f.owner_id = ? AND f.active = 1
       GROUP BY f.id
       ORDER BY f.created_at DESC`
    ).bind(userId).all();

    return c.json({
      success: true,
      farms: farms.results,
    });

  } catch (error) {
    console.error('Get user farms error:', error);
    throw new HTTPException(500, { message: 'Internal server error' });
  }
});

// Get user's organizations
users.get('/organizations', async (c) => {
  try {
    const { userId } = c.get('jwtPayload');

    // Get organizations where user is a member
    const organizations = await c.env.DB.prepare(
      `SELECT o.id, o.name, o.type, o.description, om.role, om.joined_at
       FROM organizations o
       JOIN organization_members om ON o.id = om.organization_id
       WHERE om.user_id = ? AND o.active = 1 AND om.active = 1
       ORDER BY om.joined_at DESC`
    ).bind(userId).all();

    return c.json({
      success: true,
      organizations: organizations.results,
    });

  } catch (error) {
    console.error('Get user organizations error:', error);
    throw new HTTPException(500, { message: 'Internal server error' });
  }
});

// Get user's activity feed
users.get('/activity', async (c) => {
  try {
    const { userId } = c.get('jwtPayload');
    const limit = parseInt(c.req.query('limit') || '20');
    const offset = parseInt(c.req.query('offset') || '0');

    const activities = await c.env.DB.prepare(
      `SELECT id, activity_type, title, description, metadata, created_at
       FROM user_activities 
       WHERE user_id = ? 
       ORDER BY created_at DESC 
       LIMIT ? OFFSET ?`
    ).bind(userId, limit, offset).all();

    return c.json({
      success: true,
      activities: activities.results.map(activity => ({
        ...activity,
        metadata: activity.metadata ? JSON.parse(activity.metadata) : {},
      })),
      pagination: {
        limit,
        offset,
        hasMore: activities.results.length === limit,
      },
    });

  } catch (error) {
    console.error('Get user activity error:', error);
    throw new HTTPException(500, { message: 'Internal server error' });
  }
});

// Get user statistics
users.get('/stats', async (c) => {
  try {
    const { userId } = c.get('jwtPayload');

    // Get various statistics
    const [farmsCount, cropsCount, organizationsCount, contextsCount] = await Promise.all([
      c.env.DB.prepare('SELECT COUNT(*) as count FROM farms WHERE owner_id = ? AND active = 1').bind(userId).first(),
      c.env.DB.prepare('SELECT COUNT(*) as count FROM crops c JOIN farms f ON c.farm_id = f.id WHERE f.owner_id = ? AND c.active = 1').bind(userId).first(),
      c.env.DB.prepare('SELECT COUNT(*) as count FROM organization_members WHERE user_id = ? AND active = 1').bind(userId).first(),
      c.env.DB.prepare('SELECT COUNT(*) as count FROM contexts WHERE created_by = ? AND active = 1').bind(userId).first(),
    ]);

    return c.json({
      success: true,
      stats: {
        totalFarms: farmsCount?.count || 0,
        totalCrops: cropsCount?.count || 0,
        totalOrganizations: organizationsCount?.count || 0,
        totalContexts: contextsCount?.count || 0,
      },
    });

  } catch (error) {
    console.error('Get user stats error:', error);
    throw new HTTPException(500, { message: 'Internal server error' });
  }
});

// Change password
users.put('/change-password', async (c) => {
  try {
    const { userId } = c.get('jwtPayload');
    const { currentPassword, newPassword } = await c.req.json();

    if (!currentPassword || !newPassword) {
      throw new HTTPException(400, { message: 'Current password and new password are required' });
    }

    if (newPassword.length < 8) {
      throw new HTTPException(400, { message: 'New password must be at least 8 characters long' });
    }

    // Get current user password
    const user = await c.env.DB.prepare(
      'SELECT password_hash FROM users WHERE id = ? AND active = 1'
    ).bind(userId).first();

    if (!user) {
      throw new HTTPException(404, { message: 'User not found' });
    }

    // Verify current password
    const currentPasswordHash = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(currentPassword + 'salt'));
    const currentPasswordHashStr = Array.from(new Uint8Array(currentPasswordHash))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');

    if (currentPasswordHashStr !== user.password_hash) {
      throw new HTTPException(400, { message: 'Current password is incorrect' });
    }

    // Hash new password
    const newPasswordHash = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(newPassword + 'salt'));
    const newPasswordHashStr = Array.from(new Uint8Array(newPasswordHash))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');

    // Update password
    const result = await c.env.DB.prepare(
      'UPDATE users SET password_hash = ?, updated_at = datetime(\'now\') WHERE id = ?'
    ).bind(newPasswordHashStr, userId).run();

    if (!result.success) {
      throw new HTTPException(500, { message: 'Failed to update password' });
    }

    // Clear all user sessions except current one
    const sessions = await c.env.CACHE.list({ prefix: `session:${userId}` });
    for (const session of sessions.keys) {
      await c.env.CACHE.delete(session.name);
    }

    return c.json({
      success: true,
      message: 'Password changed successfully',
    });

  } catch (error) {
    if (error instanceof HTTPException) {
      throw error;
    }
    console.error('Change password error:', error);
    throw new HTTPException(500, { message: 'Internal server error' });
  }
});

// Delete user account (soft delete)
users.delete('/account', async (c) => {
  try {
    const { userId } = c.get('jwtPayload');
    const { password, confirmation } = await c.req.json();

    if (!password || confirmation !== 'DELETE') {
      throw new HTTPException(400, { message: 'Password and confirmation are required' });
    }

    // Verify password
    const user = await c.env.DB.prepare(
      'SELECT password_hash FROM users WHERE id = ? AND active = 1'
    ).bind(userId).first();

    if (!user) {
      throw new HTTPException(404, { message: 'User not found' });
    }

    const passwordHash = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(password + 'salt'));
    const passwordHashStr = Array.from(new Uint8Array(passwordHash))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');

    if (passwordHashStr !== user.password_hash) {
      throw new HTTPException(400, { message: 'Password is incorrect' });
    }

    // Soft delete user account
    await c.env.DB.prepare(
      'UPDATE users SET active = 0, updated_at = datetime(\'now\') WHERE id = ?'
    ).bind(userId).run();

    // Clear all user sessions
    const sessions = await c.env.CACHE.list({ prefix: `session:${userId}` });
    for (const session of sessions.keys) {
      await c.env.CACHE.delete(session.name);
    }

    return c.json({
      success: true,
      message: 'Account deleted successfully',
    });

  } catch (error) {
    if (error instanceof HTTPException) {
      throw error;
    }
    console.error('Delete account error:', error);
    throw new HTTPException(500, { message: 'Internal server error' });
  }
});

export { users as userRoutes };