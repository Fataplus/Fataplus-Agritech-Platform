/**
 * Authentication routes for Cloudflare Worker
 */

import { Hono } from 'hono';
import { sign, verify } from 'hono/jwt';
import { HTTPException } from 'hono/http-exception';

const auth = new Hono();

// Register new user
auth.post('/register', async (c) => {
  try {
    const { email, password, name, phone, role = 'farmer' } = await c.req.json();

    // Validate required fields
    if (!email || !password || !name) {
      throw new HTTPException(400, { message: 'Email, password, and name are required' });
    }

    // Check if user already exists
    const existingUser = await c.env.DB.prepare(
      'SELECT id FROM users WHERE email = ?'
    ).bind(email).first();

    if (existingUser) {
      throw new HTTPException(409, { message: 'User with this email already exists' });
    }

    // Hash password (simplified for demo - use proper hashing in production)
    const hashedPassword = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(password + 'salt'));
    const passwordHash = Array.from(new Uint8Array(hashedPassword))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');

    // Create user
    const result = await c.env.DB.prepare(
      `INSERT INTO users (email, password_hash, name, phone, role, created_at, updated_at) 
       VALUES (?, ?, ?, ?, ?, datetime('now'), datetime('now'))`
    ).bind(email, passwordHash, name, phone, role).run();

    if (!result.success) {
      throw new HTTPException(500, { message: 'Failed to create user' });
    }

    // Generate JWT token
    const payload = {
      userId: result.meta.last_row_id,
      email,
      role,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60), // 24 hours
    };

    const token = await sign(payload, c.env.JWT_SECRET_KEY);

    // Cache user session
    await c.env.CACHE.put(`session:${result.meta.last_row_id}`, JSON.stringify(payload), {
      expirationTtl: 24 * 60 * 60, // 24 hours
    });

    return c.json({
      success: true,
      message: 'User registered successfully',
      user: {
        id: result.meta.last_row_id,
        email,
        name,
        role,
      },
      token,
    }, 201);

  } catch (error) {
    if (error instanceof HTTPException) {
      throw error;
    }
    console.error('Registration error:', error);
    throw new HTTPException(500, { message: 'Internal server error' });
  }
});

// Login user
auth.post('/login', async (c) => {
  try {
    const { email, password } = await c.req.json();

    if (!email || !password) {
      throw new HTTPException(400, { message: 'Email and password are required' });
    }

    // Find user by email
    const user = await c.env.DB.prepare(
      'SELECT id, email, password_hash, name, role, active FROM users WHERE email = ?'
    ).bind(email).first();

    if (!user) {
      throw new HTTPException(401, { message: 'Invalid credentials' });
    }

    if (!user.active) {
      throw new HTTPException(401, { message: 'Account is deactivated' });
    }

    // Verify password (simplified - use proper verification in production)
    const hashedPassword = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(password + 'salt'));
    const passwordHash = Array.from(new Uint8Array(hashedPassword))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');

    if (passwordHash !== user.password_hash) {
      throw new HTTPException(401, { message: 'Invalid credentials' });
    }

    // Generate JWT token
    const payload = {
      userId: user.id,
      email: user.email,
      role: user.role,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60), // 24 hours
    };

    const token = await sign(payload, c.env.JWT_SECRET_KEY);

    // Cache user session
    await c.env.CACHE.put(`session:${user.id}`, JSON.stringify(payload), {
      expirationTtl: 24 * 60 * 60, // 24 hours
    });

    // Update last login
    await c.env.DB.prepare(
      'UPDATE users SET last_login = datetime(\'now\') WHERE id = ?'
    ).bind(user.id).run();

    return c.json({
      success: true,
      message: 'Login successful',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
      token,
    });

  } catch (error) {
    if (error instanceof HTTPException) {
      throw error;
    }
    console.error('Login error:', error);
    throw new HTTPException(500, { message: 'Internal server error' });
  }
});

// Logout user
auth.post('/logout', async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new HTTPException(401, { message: 'No token provided' });
    }

    const token = authHeader.substring(7);
    const payload = await verify(token, c.env.JWT_SECRET_KEY);

    // Remove session from cache
    await c.env.CACHE.delete(`session:${payload.userId}`);

    return c.json({
      success: true,
      message: 'Logout successful',
    });

  } catch (error) {
    console.error('Logout error:', error);
    // Don't throw error for logout - just return success
    return c.json({
      success: true,
      message: 'Logout successful',
    });
  }
});

// Refresh token
auth.post('/refresh', async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new HTTPException(401, { message: 'No token provided' });
    }

    const token = authHeader.substring(7);
    const payload = await verify(token, c.env.JWT_SECRET_KEY);

    // Check if session still exists
    const sessionData = await c.env.CACHE.get(`session:${payload.userId}`);
    if (!sessionData) {
      throw new HTTPException(401, { message: 'Session expired' });
    }

    // Generate new token
    const newPayload = {
      ...payload,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60), // 24 hours
    };

    const newToken = await sign(newPayload, c.env.JWT_SECRET_KEY);

    // Update session cache
    await c.env.CACHE.put(`session:${payload.userId}`, JSON.stringify(newPayload), {
      expirationTtl: 24 * 60 * 60, // 24 hours
    });

    return c.json({
      success: true,
      message: 'Token refreshed successfully',
      token: newToken,
    });

  } catch (error) {
    if (error instanceof HTTPException) {
      throw error;
    }
    console.error('Token refresh error:', error);
    throw new HTTPException(500, { message: 'Internal server error' });
  }
});

// Verify token endpoint
auth.get('/verify', async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new HTTPException(401, { message: 'No token provided' });
    }

    const token = authHeader.substring(7);
    const payload = await verify(token, c.env.JWT_SECRET_KEY);

    // Check if session still exists
    const sessionData = await c.env.CACHE.get(`session:${payload.userId}`);
    if (!sessionData) {
      throw new HTTPException(401, { message: 'Session expired' });
    }

    // Get user data
    const user = await c.env.DB.prepare(
      'SELECT id, email, name, role, active FROM users WHERE id = ?'
    ).bind(payload.userId).first();

    if (!user || !user.active) {
      throw new HTTPException(401, { message: 'Invalid user' });
    }

    return c.json({
      success: true,
      valid: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    });

  } catch (error) {
    if (error instanceof HTTPException) {
      throw error;
    }
    console.error('Token verification error:', error);
    return c.json({
      success: false,
      valid: false,
      message: 'Invalid token',
    }, 401);
  }
});

// Password reset request
auth.post('/forgot-password', async (c) => {
  try {
    const { email } = await c.req.json();

    if (!email) {
      throw new HTTPException(400, { message: 'Email is required' });
    }

    // Check if user exists
    const user = await c.env.DB.prepare(
      'SELECT id, email, name FROM users WHERE email = ? AND active = 1'
    ).bind(email).first();

    // Always return success for security (don't reveal if email exists)
    if (user) {
      // Generate reset token
      const resetToken = crypto.randomUUID();
      const resetExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

      // Store reset token
      await c.env.CACHE.put(`reset:${resetToken}`, JSON.stringify({
        userId: user.id,
        email: user.email,
        expiry: resetExpiry.toISOString(),
      }), {
        expirationTtl: 60 * 60, // 1 hour
      });

      // Queue password reset email
      await c.env.EMAIL_QUEUE.send({
        to: user.email,
        subject: 'Password Reset Request - Fataplus',
        template: 'password-reset',
        data: {
          name: user.name,
          resetToken,
          resetUrl: `https://app.fata.plus/reset-password?token=${resetToken}`,
        },
      });
    }

    return c.json({
      success: true,
      message: 'If the email exists, a password reset link has been sent',
    });

  } catch (error) {
    if (error instanceof HTTPException) {
      throw error;
    }
    console.error('Password reset request error:', error);
    throw new HTTPException(500, { message: 'Internal server error' });
  }
});

// Password reset
auth.post('/reset-password', async (c) => {
  try {
    const { token, newPassword } = await c.req.json();

    if (!token || !newPassword) {
      throw new HTTPException(400, { message: 'Token and new password are required' });
    }

    if (newPassword.length < 8) {
      throw new HTTPException(400, { message: 'Password must be at least 8 characters long' });
    }

    // Get reset token data
    const resetData = await c.env.CACHE.get(`reset:${token}`);
    if (!resetData) {
      throw new HTTPException(400, { message: 'Invalid or expired reset token' });
    }

    const { userId, expiry } = JSON.parse(resetData);
    if (new Date() > new Date(expiry)) {
      throw new HTTPException(400, { message: 'Reset token has expired' });
    }

    // Hash new password
    const hashedPassword = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(newPassword + 'salt'));
    const passwordHash = Array.from(new Uint8Array(hashedPassword))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');

    // Update password
    const result = await c.env.DB.prepare(
      'UPDATE users SET password_hash = ?, updated_at = datetime(\'now\') WHERE id = ?'
    ).bind(passwordHash, userId).run();

    if (!result.success) {
      throw new HTTPException(500, { message: 'Failed to update password' });
    }

    // Clear reset token
    await c.env.CACHE.delete(`reset:${token}`);

    // Clear all user sessions
    const sessions = await c.env.CACHE.list({ prefix: `session:${userId}` });
    for (const session of sessions.keys) {
      await c.env.CACHE.delete(session.name);
    }

    return c.json({
      success: true,
      message: 'Password reset successfully',
    });

  } catch (error) {
    if (error instanceof HTTPException) {
      throw error;
    }
    console.error('Password reset error:', error);
    throw new HTTPException(500, { message: 'Internal server error' });
  }
});

export { auth as authRoutes };