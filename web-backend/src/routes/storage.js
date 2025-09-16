/**
 * Storage management routes for Cloudflare Worker (R2)
 */

import { Hono } from 'hono';
import { HTTPException } from 'hono/http-exception';

const storage = new Hono();

// Upload file to R2 storage
storage.post('/upload', async (c) => {
  try {
    const { userId } = c.get('jwtPayload');
    const formData = await c.req.formData();
    const file = formData.get('file');
    const category = formData.get('category') || 'general';
    const isPublic = formData.get('isPublic') === 'true';
    const metadata = formData.get('metadata');

    if (!file || !(file instanceof File)) {
      throw new HTTPException(400, { message: 'File is required' });
    }

    // Validate file size (50MB limit)
    if (file.size > 50 * 1024 * 1024) {
      throw new HTTPException(400, { message: 'File size must be less than 50MB' });
    }

    // Validate file type
    const allowedTypes = [
      'image/jpeg', 'image/png', 'image/gif', 'image/webp',
      'application/pdf', 'text/csv', 'application/json',
      'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ];

    if (!allowedTypes.includes(file.type)) {
      throw new HTTPException(400, { 
        message: 'File type not supported. Allowed: images, PDF, CSV, Excel, JSON' 
      });
    }

    // Generate unique filename
    const extension = file.name.split('.').pop();
    const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '');
    const timestamp = Date.now();
    const filename = `${category}/${userId}/${timestamp}-${sanitizedName}`;

    // Prepare file metadata
    const fileMetadata = {
      originalName: file.name,
      uploadedBy: userId,
      category,
      isPublic,
      uploadedAt: new Date().toISOString(),
      ...((metadata && JSON.parse(metadata)) || {}),
    };

    // Upload to R2
    const fileBuffer = await file.arrayBuffer();
    await c.env.STORAGE.put(filename, fileBuffer, {
      httpMetadata: {
        contentType: file.type,
        cacheControl: isPublic ? 'public, max-age=31536000' : 'private, max-age=3600',
      },
      customMetadata: {
        'uploaded-by': userId.toString(),
        'original-name': file.name,
        'category': category,
        'is-public': isPublic.toString(),
      },
    });

    // Store file record in database
    const result = await c.env.DB.prepare(`
      INSERT INTO files (
        filename, original_name, file_path, file_size, content_type,
        category, is_public, uploaded_by, metadata, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
    `).bind(
      filename,
      file.name,
      filename,
      file.size,
      file.type,
      category,
      isPublic ? 1 : 0,
      userId,
      JSON.stringify(fileMetadata)
    ).run();

    if (!result.success) {
      // Try to clean up uploaded file
      try {
        await c.env.STORAGE.delete(filename);
      } catch (cleanupError) {
        console.error('Failed to cleanup file after DB error:', cleanupError);
      }
      throw new HTTPException(500, { message: 'Failed to save file record' });
    }

    const fileId = result.meta.last_row_id;
    const fileUrl = isPublic 
      ? `https://storage.fata.plus/${filename}`
      : `https://api.fata.plus/storage/files/${fileId}`;

    // Log activity
    await logUserActivity(c.env.DB, userId, 'file_uploaded', 'File Uploaded',
      `Uploaded file: ${file.name}`, { fileId, filename, category });

    return c.json({
      success: true,
      message: 'File uploaded successfully',
      file: {
        id: fileId,
        filename: file.name,
        url: fileUrl,
        size: file.size,
        type: file.type,
        category,
        isPublic,
        uploadedAt: new Date().toISOString(),
      },
    }, 201);

  } catch (error) {
    if (error instanceof HTTPException) {
      throw error;
    }
    console.error('Upload file error:', error);
    throw new HTTPException(500, { message: 'Failed to upload file' });
  }
});

// Get file by ID (with access control)
storage.get('/files/:id', async (c) => {
  try {
    const { userId, role } = c.get('jwtPayload');
    const fileId = c.req.param('id');

    // Get file record from database
    const file = await c.env.DB.prepare(`
      SELECT f.*, u.name as uploader_name
      FROM files f
      JOIN users u ON f.uploaded_by = u.id
      WHERE f.id = ? AND f.active = 1
    `).bind(fileId).first();

    if (!file) {
      throw new HTTPException(404, { message: 'File not found' });
    }

    // Check access permissions
    const hasAccess = file.is_public || 
                     file.uploaded_by === userId || 
                     role === 'admin';

    if (!hasAccess) {
      throw new HTTPException(403, { message: 'Access denied' });
    }

    // Get file from R2
    const fileObject = await c.env.STORAGE.get(file.file_path);
    
    if (!fileObject) {
      throw new HTTPException(404, { message: 'File content not found' });
    }

    // Set appropriate headers
    const headers = new Headers();
    headers.set('Content-Type', file.content_type);
    headers.set('Content-Length', file.file_size.toString());
    headers.set('Content-Disposition', `inline; filename="${file.original_name}"`);
    
    if (file.is_public) {
      headers.set('Cache-Control', 'public, max-age=31536000');
    } else {
      headers.set('Cache-Control', 'private, max-age=3600');
    }

    // Return file stream
    return new Response(fileObject.body, {
      status: 200,
      headers,
    });

  } catch (error) {
    if (error instanceof HTTPException) {
      throw error;
    }
    console.error('Get file error:', error);
    throw new HTTPException(500, { message: 'Failed to retrieve file' });
  }
});

// List files (with filters and pagination)
storage.get('/files', async (c) => {
  try {
    const { userId, role } = c.get('jwtPayload');
    const { 
      page = '1', 
      limit = '20', 
      category, 
      fileType,
      search,
      isPublic,
      sortBy = 'created_at', 
      sortOrder = 'DESC' 
    } = c.req.query();

    const offset = (parseInt(page) - 1) * parseInt(limit);

    // Build query based on user permissions
    let baseQuery = `
      SELECT f.id, f.filename, f.original_name, f.file_size, f.content_type,
             f.category, f.is_public, f.created_at, f.updated_at,
             u.name as uploader_name
      FROM files f
      JOIN users u ON f.uploaded_by = u.id
      WHERE f.active = 1
    `;

    const params = [];

    // Apply access control
    if (role !== 'admin') {
      baseQuery += ' AND (f.is_public = 1 OR f.uploaded_by = ?)';
      params.push(userId);
    }

    // Add filters
    if (category) {
      baseQuery += ' AND f.category = ?';
      params.push(category);
    }

    if (fileType) {
      baseQuery += ' AND f.content_type LIKE ?';
      params.push(`${fileType}%`);
    }

    if (search) {
      baseQuery += ' AND (f.filename LIKE ? OR f.original_name LIKE ?)';
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm);
    }

    if (isPublic !== undefined) {
      baseQuery += ' AND f.is_public = ?';
      params.push(isPublic === 'true' ? 1 : 0);
    }

    // Add sorting
    const validSortColumns = ['filename', 'file_size', 'category', 'created_at', 'updated_at'];
    const validSortOrders = ['ASC', 'DESC'];
    
    if (validSortColumns.includes(sortBy) && validSortOrders.includes(sortOrder.toUpperCase())) {
      baseQuery += ` ORDER BY f.${sortBy} ${sortOrder.toUpperCase()}`;
    } else {
      baseQuery += ' ORDER BY f.created_at DESC';
    }

    baseQuery += ' LIMIT ? OFFSET ?';
    params.push(parseInt(limit), offset);

    const result = await c.env.DB.prepare(baseQuery).bind(...params).all();

    // Get total count for pagination
    let countQuery = 'SELECT COUNT(*) as total FROM files f WHERE f.active = 1';
    const countParams = [];

    if (role !== 'admin') {
      countQuery += ' AND (f.is_public = 1 OR f.uploaded_by = ?)';
      countParams.push(userId);
    }

    // Apply same filters for count
    if (category) {
      countQuery += ' AND f.category = ?';
      countParams.push(category);
    }

    if (fileType) {
      countQuery += ' AND f.content_type LIKE ?';
      countParams.push(`${fileType}%`);
    }

    if (search) {
      countQuery += ' AND (f.filename LIKE ? OR f.original_name LIKE ?)';
      const searchTerm = `%${search}%`;
      countParams.push(searchTerm, searchTerm);
    }

    if (isPublic !== undefined) {
      countQuery += ' AND f.is_public = ?';
      countParams.push(isPublic === 'true' ? 1 : 0);
    }

    const countResult = await c.env.DB.prepare(countQuery).bind(...countParams).first();
    const totalCount = countResult?.total || 0;

    // Generate URLs for files
    const filesWithUrls = result.results.map(file => ({
      ...file,
      url: file.is_public 
        ? `https://storage.fata.plus/${file.file_path}`
        : `https://api.fata.plus/storage/files/${file.id}`,
      downloadUrl: `https://api.fata.plus/storage/files/${file.id}/download`,
    }));

    return c.json({
      success: true,
      files: filesWithUrls,
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
    console.error('List files error:', error);
    throw new HTTPException(500, { message: 'Failed to list files' });
  }
});

// Download file (force download with proper headers)
storage.get('/files/:id/download', async (c) => {
  try {
    const { userId, role } = c.get('jwtPayload');
    const fileId = c.req.param('id');

    // Get file record
    const file = await c.env.DB.prepare(
      'SELECT * FROM files WHERE id = ? AND active = 1'
    ).bind(fileId).first();

    if (!file) {
      throw new HTTPException(404, { message: 'File not found' });
    }

    // Check access permissions
    const hasAccess = file.is_public || 
                     file.uploaded_by === userId || 
                     role === 'admin';

    if (!hasAccess) {
      throw new HTTPException(403, { message: 'Access denied' });
    }

    // Get file from R2
    const fileObject = await c.env.STORAGE.get(file.file_path);
    
    if (!fileObject) {
      throw new HTTPException(404, { message: 'File content not found' });
    }

    // Set download headers
    const headers = new Headers();
    headers.set('Content-Type', file.content_type);
    headers.set('Content-Length', file.file_size.toString());
    headers.set('Content-Disposition', `attachment; filename="${file.original_name}"`);
    headers.set('Cache-Control', 'no-cache');

    // Log download activity
    await logUserActivity(c.env.DB, userId, 'file_downloaded', 'File Downloaded',
      `Downloaded file: ${file.original_name}`, { fileId, filename: file.original_name });

    return new Response(fileObject.body, {
      status: 200,
      headers,
    });

  } catch (error) {
    if (error instanceof HTTPException) {
      throw error;
    }
    console.error('Download file error:', error);
    throw new HTTPException(500, { message: 'Failed to download file' });
  }
});

// Update file metadata
storage.put('/files/:id', async (c) => {
  try {
    const { userId, role } = c.get('jwtPayload');
    const fileId = c.req.param('id');
    const { filename, category, isPublic, metadata } = await c.req.json();

    // Get file record
    const file = await c.env.DB.prepare(
      'SELECT * FROM files WHERE id = ? AND active = 1'
    ).bind(fileId).first();

    if (!file) {
      throw new HTTPException(404, { message: 'File not found' });
    }

    // Check permissions
    if (file.uploaded_by !== userId && role !== 'admin') {
      throw new HTTPException(403, { message: 'Access denied' });
    }

    // Build update query
    const updates = [];
    const values = [];

    if (filename !== undefined) {
      updates.push('filename = ?');
      values.push(filename);
    }

    if (category !== undefined) {
      updates.push('category = ?');
      values.push(category);
    }

    if (isPublic !== undefined) {
      updates.push('is_public = ?');
      values.push(isPublic ? 1 : 0);
    }

    if (metadata !== undefined) {
      updates.push('metadata = ?');
      values.push(JSON.stringify(metadata));
    }

    if (updates.length === 0) {
      throw new HTTPException(400, { message: 'No fields to update' });
    }

    updates.push('updated_at = datetime(\'now\')');
    values.push(fileId);

    const query = `UPDATE files SET ${updates.join(', ')} WHERE id = ?`;
    const result = await c.env.DB.prepare(query).bind(...values).run();

    if (!result.success || result.changes === 0) {
      throw new HTTPException(404, { message: 'File not found or no changes made' });
    }

    // Update R2 metadata if visibility changed
    if (isPublic !== undefined && isPublic !== file.is_public) {
      try {
        const existingObject = await c.env.STORAGE.get(file.file_path);
        if (existingObject) {
          await c.env.STORAGE.put(file.file_path, existingObject.body, {
            httpMetadata: {
              contentType: file.content_type,
              cacheControl: isPublic ? 'public, max-age=31536000' : 'private, max-age=3600',
            },
            customMetadata: {
              'uploaded-by': file.uploaded_by.toString(),
              'original-name': file.original_name,
              'category': category || file.category,
              'is-public': isPublic.toString(),
            },
          });
        }
      } catch (r2Error) {
        console.error('Failed to update R2 metadata:', r2Error);
        // Don't fail the request, metadata update in R2 is not critical
      }
    }

    return c.json({
      success: true,
      message: 'File updated successfully',
    });

  } catch (error) {
    if (error instanceof HTTPException) {
      throw error;
    }
    console.error('Update file error:', error);
    throw new HTTPException(500, { message: 'Failed to update file' });
  }
});

// Delete file
storage.delete('/files/:id', async (c) => {
  try {
    const { userId, role } = c.get('jwtPayload');
    const fileId = c.req.param('id');

    // Get file record
    const file = await c.env.DB.prepare(
      'SELECT * FROM files WHERE id = ? AND active = 1'
    ).bind(fileId).first();

    if (!file) {
      throw new HTTPException(404, { message: 'File not found' });
    }

    // Check permissions
    if (file.uploaded_by !== userId && role !== 'admin') {
      throw new HTTPException(403, { message: 'Access denied' });
    }

    // Soft delete in database
    const result = await c.env.DB.prepare(
      'UPDATE files SET active = 0, updated_at = datetime(\'now\') WHERE id = ?'
    ).bind(fileId).run();

    if (!result.success || result.changes === 0) {
      throw new HTTPException(404, { message: 'File not found' });
    }

    // Delete from R2 (move to trash folder instead of permanent delete)
    try {
      const trashPath = `trash/${file.file_path}`;
      const existingObject = await c.env.STORAGE.get(file.file_path);
      
      if (existingObject) {
        // Move to trash folder
        await c.env.STORAGE.put(trashPath, existingObject.body, {
          httpMetadata: existingObject.httpMetadata,
          customMetadata: {
            ...existingObject.customMetadata,
            'deleted-at': new Date().toISOString(),
            'deleted-by': userId.toString(),
          },
        });
        
        // Delete original
        await c.env.STORAGE.delete(file.file_path);
      }
    } catch (r2Error) {
      console.error('Failed to delete from R2:', r2Error);
      // Don't fail the request, database soft delete is sufficient
    }

    // Log activity
    await logUserActivity(c.env.DB, userId, 'file_deleted', 'File Deleted',
      `Deleted file: ${file.original_name}`, { fileId, filename: file.original_name });

    return c.json({
      success: true,
      message: 'File deleted successfully',
    });

  } catch (error) {
    if (error instanceof HTTPException) {
      throw error;
    }
    console.error('Delete file error:', error);
    throw new HTTPException(500, { message: 'Failed to delete file' });
  }
});

// Get storage statistics
storage.get('/stats', async (c) => {
  try {
    const { userId, role } = c.get('jwtPayload');

    let baseQuery = 'FROM files f WHERE f.active = 1';
    const params = [];

    // Apply user filter if not admin
    if (role !== 'admin') {
      baseQuery += ' AND f.uploaded_by = ?';
      params.push(userId);
    }

    const [totalStats, categoryStats, typeStats] = await Promise.all([
      // Total statistics
      c.env.DB.prepare(`
        SELECT 
          COUNT(*) as total_files,
          SUM(file_size) as total_size,
          COUNT(CASE WHEN is_public = 1 THEN 1 END) as public_files,
          COUNT(CASE WHEN is_public = 0 THEN 1 END) as private_files
        ${baseQuery}
      `).bind(...params).first(),

      // Statistics by category
      c.env.DB.prepare(`
        SELECT category, COUNT(*) as count, SUM(file_size) as size
        ${baseQuery}
        GROUP BY category
        ORDER BY count DESC
      `).bind(...params).all(),

      // Statistics by file type
      c.env.DB.prepare(`
        SELECT 
          CASE 
            WHEN content_type LIKE 'image/%' THEN 'Images'
            WHEN content_type LIKE 'application/pdf' THEN 'PDFs'
            WHEN content_type LIKE '%spreadsheet%' OR content_type LIKE '%excel%' THEN 'Spreadsheets'
            WHEN content_type LIKE 'text/%' THEN 'Text Files'
            ELSE 'Other'
          END as type,
          COUNT(*) as count,
          SUM(file_size) as size
        ${baseQuery}
        GROUP BY type
        ORDER BY count DESC
      `).bind(...params).all(),
    ]);

    return c.json({
      success: true,
      stats: {
        total: totalStats,
        byCategory: categoryStats.results,
        byType: typeStats.results,
      },
    });

  } catch (error) {
    console.error('Get storage stats error:', error);
    throw new HTTPException(500, { message: 'Failed to get storage statistics' });
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

export { storage as storageRoutes };