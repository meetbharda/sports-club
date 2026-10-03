const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { db } = require('./db');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'the-champions-club-super-secret-key-2026';

app.use(cors());
app.use(express.json());

// Audit Log Helper
function logAudit(userId, userEmail, role, action, entity, entityId, metadata = {}) {
  try {
    db.prepare(`
      INSERT INTO audit_logs (user_id, user_email, role, action, entity, entity_id, metadata)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(userId, userEmail, role, action, entity, String(entityId || ''), JSON.stringify(metadata));
  } catch (err) {
    console.error('Audit log error:', err);
  }
}

// Notification Helper
function createNotification(userId, roleTarget, title, message, type = 'info', linkUrl = null) {
  try {
    db.prepare(`
      INSERT INTO notifications (user_id, role_target, title, message, type, link_url)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(userId, roleTarget, title, message, type, linkUrl);
  } catch (err) {
    console.error('Notification creation error:', err);
  }
}

// Auth Middleware
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Authentication token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Session expired or invalid token. Please log in again.' });
    }

    // Verify user is active in DB
    const dbUser = db.prepare('SELECT id, email, full_name, role, status FROM users WHERE id = ?').get(user.id);
    if (!dbUser || dbUser.status !== 'active') {
      return res.status(403).json({ error: 'Account is inactive or suspended.' });
    }

    // Load all user roles
    const userRoles = db.prepare('SELECT role FROM user_roles WHERE user_id = ?').all(user.id).map(r => r.role);
    if (!userRoles.includes(dbUser.role)) {
      userRoles.push(dbUser.role);
    }

    // Load member info if exists
    const member = db.prepare(`
      SELECT m.*, p.code as plan_code, p.name as plan_name, p.court_discount_pct, p.shop_discount_pct, p.bar_discount_pct, p.daily_booking_limit
      FROM members m
      LEFT JOIN membership_plans p ON m.plan_id = p.id
      WHERE m.user_id = ?
    `).get(user.id);

    req.user = {
      ...dbUser,
      roles: userRoles,
      member: member || null
    };

    next();
  });
}

// Role Authorization Middleware
function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    // Super admin/owner has access everywhere
    if (req.user.roles.includes('admin') || req.user.role === 'admin') {
      return next();
    }

    const hasAllowedRole = allowedRoles.some(role => req.user.roles.includes(role) || req.user.role === role);
    if (!hasAllowedRole) {
      return res.status(403).json({
        error: 'Access denied: You do not have permission to perform this action or view this resource.',
        requiredRoles: allowedRoles,
        userRole: req.user.role
      });
    }

    next();
  };
}

// ==========================================
// 1. AUTHENTICATION & IDENTITY
// ==========================================

app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  const user = db.prepare('SELECT * FROM users WHERE LOWER(email) = LOWER(?)').get(email.trim());
  if (!user) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }

  if (user.status !== 'active') {
    return res.status(403).json({ error: 'Your account is currently suspended or inactive. Please contact the front desk.' });
  }

  const isMatch = bcrypt.compareSync(password, user.password_hash);
  if (!isMatch) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }

  // Get all assigned roles
  const roles = db.prepare('SELECT role FROM user_roles WHERE user_id = ?').all(user.id).map(r => r.role);
  if (!roles.includes(user.role)) roles.push(user.role);

  // Get member profile if applicable
  const member = db.prepare(`
    SELECT m.*, p.code as plan_code, p.name as plan_name, p.court_discount_pct, p.shop_discount_pct, p.bar_discount_pct, p.daily_booking_limit
    FROM members m
    LEFT JOIN membership_plans p ON m.plan_id = p.id
    WHERE m.user_id = ?
  `).get(user.id);

  const token = jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    JWT_SECRET,
    { expiresIn: '7d' }
  );

  logAudit(user.id, user.email, user.role, 'LOGIN', 'users', user.id, { ip: req.ip });

  res.json({
    message: 'Login successful',
    token,
    user: {
      id: user.id,
      email: user.email,
      full_name: user.full_name,
      phone: user.phone,
      role: user.role,
      roles,
      member: member || null
    }
  });
});

app.post('/api/auth/register', (req, res) => {
  const { full_name, email, password, phone, plan_code = 'SILVER' } = req.body;

  if (!full_name || !email || !password) {
    return res.status(400).json({ error: 'Name, email, and password are required' });
  }

  const existing = db.prepare('SELECT id FROM users WHERE LOWER(email) = LOWER(?)').get(email.trim());
  if (existing) {
    return res.status(400).json({ error: 'An account with this email already exists' });
  }

  const plan = db.prepare('SELECT * FROM membership_plans WHERE code = ? AND is_active = 1').get(plan_code.toUpperCase());
  if (!plan) {
    return res.status(400).json({ error: 'Invalid or inactive membership plan selected' });
  }

  const password_hash = bcrypt.hashSync(password, 10);

  const tx = db.transaction(() => {
    const userRes = db.prepare(`
      INSERT INTO users (email, password_hash, full_name, phone, role, status)
      VALUES (?, ?, ?, ?, 'member', 'active')
    `).run(email.trim(), password_hash, full_name.trim(), phone || null);

    const userId = userRes.lastInsertRowid;
    db.prepare('INSERT INTO user_roles (user_id, role) VALUES (?, ?)').run(userId, 'member');

    const memberCode = `MEM-${Math.floor(1000 + Math.random() * 9000)}`;
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    const expiry = new Date(today);
    expiry.setFullYear(today.getFullYear() + 1);
    const expiryStr = expiry.toISOString().split('T')[0];

    const memRes = db.prepare(`
      INSERT INTO members (user_id, member_code, plan_id, status, start_date, expiry_date, booking_allowance_daily, loyalty_points)
      VALUES (?, ?, ?, 'Active', ?, ?, ?, 50)
    `).run(userId, memberCode, plan.id, todayStr, expiryStr, plan.daily_booking_limit);

    // Create welcome notification
    db.prepare(`
      INSERT INTO notifications (user_id, role_target, title, message, type, link_url)
      VALUES (?, 'member', 'Welcome to The Champions Club!', 'Your membership profile has been created. Start booking courts and explore our premium amenities.', 'success', '/member/dashboard')
    `).run(userId);

    logAudit(userId, email, 'member', 'MEMBER_REGISTER', 'users', userId, { plan: plan.name });

    return { userId, memberCode, planId: plan.id };
  });

  const created = tx();

  const token = jwt.sign(
    { id: created.userId, email: email.trim(), role: 'member' },
    JWT_SECRET,
    { expiresIn: '7d' }
  );

  const member = db.prepare(`
    SELECT m.*, p.code as plan_code, p.name as plan_name, p.court_discount_pct, p.shop_discount_pct, p.bar_discount_pct, p.daily_booking_limit
    FROM members m
    JOIN membership_plans p ON m.plan_id = p.id
    WHERE m.user_id = ?
  `).get(created.userId);

  res.status(201).json({
    message: 'Registration successful! Welcome to The Champions Club.',
    token,
    user: {
      id: created.userId,
      email: email.trim(),
      full_name: full_name.trim(),
      phone: phone || null,
      role: 'member',
      roles: ['member'],
      member
    }
  });
});

app.get('/api/auth/me', authenticateToken, (req, res) => {
  res.json({ user: req.user });
});

// ==========================================
// 2. PUBLIC DATA & CRM ENQUIRIES
// ==========================================

app.get('/api/public/sports', (req, res) => {
  const sports = db.prepare('SELECT * FROM sports').all();
  const facilities = db.prepare('SELECT * FROM facilities WHERE is_active = 1').all();
  const courts = db.prepare('SELECT * FROM courts').all();

  const result = sports.map(s => ({
    ...s,
    facilities: facilities.filter(f => f.sport_id === s.id).map(f => ({
      ...f,
      courts: courts.filter(c => c.facility_id === f.id)
    }))
  }));

  res.json(result);
});

app.get('/api/public/membership-plans', (req, res) => {
  const plans = db.prepare('SELECT * FROM membership_plans WHERE is_active = 1 ORDER BY monthly_price ASC').all();
  res.json(plans);
});

app.get('/api/public/courts', (req, res) => {
  const courts = db.prepare(`
    SELECT c.*, f.name as facility_name, f.location, s.name as sport_name
    FROM courts c
    JOIN facilities f ON c.facility_id = f.id
    JOIN sports s ON f.sport_id = s.id
    WHERE f.is_active = 1
  `).all();
  res.json(courts);
});

app.get('/api/public/shop-preview', (req, res) => {
  const products = db.prepare(`
    SELECT p.id, p.sku, p.name, p.brand, p.description, p.image_url, p.selling_price, p.stock_quantity, c.name as category_name
    FROM products p
    JOIN product_categories c ON p.category_id = c.id
    WHERE p.is_active = 1
    ORDER BY p.id DESC
  `).all();
  res.json(products);
});

app.get('/api/public/bar-menu', (req, res) => {
  const menu = db.prepare('SELECT * FROM bar_menu_items WHERE is_available = 1 ORDER BY category, name').all();
  res.json(menu);
});

app.post('/api/public/enquiry', (req, res) => {
  const { name, phone, email, source = 'Website Trial', interested_sport, membership_interest, preferred_date, preferred_time, message } = req.body;

  if (!name || !phone || !email) {
    return res.status(400).json({ error: 'Name, phone number, and email are required.' });
  }

  const enquiryCode = `ENQ-${Math.floor(1000 + Math.random() * 9000)}`;

  const result = db.prepare(`
    INSERT INTO customer_enquiries (enquiry_code, name, phone, email, source, interested_sport, membership_interest, preferred_date, preferred_time, message, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'New')
  `).run(enquiryCode, name.trim(), phone.trim(), email.trim(), source, interested_sport || null, membership_interest || null, preferred_date || null, preferred_time || null, message || null);

  // Notify front desk and admin
  createNotification(null, 'frontdesk', `New Enquiry: ${name}`, `${name} submitted an enquiry for ${interested_sport || 'Club Membership'} (${source}).`, 'info', '/frontdesk/enquiries');
  createNotification(null, 'admin', `New Lead: ${name}`, `${name} (${email}) requested trial session.`, 'info', '/admin/crm');

  res.status(201).json({
    message: 'Your enquiry has been received. Our concierge team will reach out within 2 hours.',
    enquiry_code: enquiryCode
  });
});

// ==========================================
// 3. COURT BOOKING ENGINE (STRICT CONCURRENCY)
// ==========================================

// Get real-time schedule & slot availability for date & court/sport
app.get('/api/bookings/schedule', (req, res) => {
  const { date, court_id, sport_id } = req.query;
  const targetDate = date || new Date().toISOString().split('T')[0];

  let query = `
    SELECT b.*, c.name as court_name, c.court_type, u.full_name as user_name, u.email as user_email
    FROM court_bookings b
    JOIN courts c ON b.court_id = c.id
    JOIN facilities f ON c.facility_id = f.id
    LEFT JOIN users u ON b.user_id = u.id
    WHERE b.date = ? AND b.status NOT IN ('Cancelled')
  `;
  const params = [targetDate];

  if (court_id) {
    query += ` AND b.court_id = ?`;
    params.push(court_id);
  } else if (sport_id) {
    query += ` AND f.sport_id = ?`;
    params.push(sport_id);
  }

  query += ` ORDER BY b.start_time ASC`;
  const bookings = db.prepare(query).all(...params);

  // Also fetch social sessions on that date
  const socialSessions = db.prepare(`
    SELECT s.*, c.name as court_name,
      (SELECT COUNT(*) FROM social_participants p WHERE p.session_id = s.id) as participant_count
    FROM social_sessions s
    JOIN courts c ON s.court_id = c.id
    WHERE s.date = ? AND s.status != 'Cancelled'
  `).all(targetDate);

  res.json({
    date: targetDate,
    bookings,
    socialSessions
  });
});

// Create court booking with strict atomic conflict validation
app.post('/api/bookings', authenticateToken, (req, res) => {
  const { court_id, date, start_time, end_time, booking_type = 'member', guest_name, guest_phone, notes, payment_method = 'card' } = req.body;

  if (!court_id || !date || !start_time || !end_time) {
    return res.status(400).json({ error: 'Court ID, date, start time, and end time are required' });
  }

  // Validate court exists
  const court = db.prepare(`
    SELECT c.*, f.opening_time, f.closing_time, s.name as sport_name
    FROM courts c
    JOIN facilities f ON c.facility_id = f.id
    JOIN sports s ON f.sport_id = s.id
    WHERE c.id = ?
  `).get(court_id);

  if (!court) {
    return res.status(404).json({ error: 'Court not found' });
  }

  if (court.status === 'Maintenance') {
    return res.status(400).json({ error: 'This court is currently undergoing scheduled maintenance.' });
  }

  // Check if booking is within operating hours
  if (start_time < court.opening_time || end_time > court.closing_time) {
    return res.status(400).json({ error: `Bookings must be within operating hours (${court.opening_time} - ${court.closing_time})` });
  }

  // If member booking, enforce member status & daily quota
  let memberRecord = null;
  let finalPrice = court.hourly_rate_walkin;

  if (booking_type === 'member') {
    // If user is member, verify active membership
    memberRecord = db.prepare(`
      SELECT m.*, p.court_discount_pct, p.daily_booking_limit, p.code as plan_code
      FROM members m
      JOIN membership_plans p ON m.plan_id = p.id
      WHERE m.user_id = ?
    `).get(req.user.id);

    if (!memberRecord) {
      return res.status(400).json({ error: 'No active club membership found for this user.' });
    }

    if (memberRecord.status !== 'Active') {
      return res.status(400).json({ error: `Membership is ${memberRecord.status.toLowerCase()}. Please renew your membership to book courts.` });
    }

    const todayStr = new Date().toISOString().split('T')[0];
    if (memberRecord.expiry_date < todayStr) {
      return res.status(400).json({ error: 'Your membership has expired. Please renew to book courts.' });
    }

    // Check daily booking limit for this member
    const existingTodayCount = db.prepare(`
      SELECT COUNT(*) as count
      FROM court_bookings
      WHERE user_id = ? AND date = ? AND status NOT IN ('Cancelled')
    `).get(req.user.id, date).count;

    const limit = memberRecord.booking_allowance_daily || memberRecord.daily_booking_limit || 2;
    if (existingTodayCount >= limit) {
      return res.status(400).json({
        error: `Daily booking limit of ${limit} reservation(s) reached for your membership tier on ${date}.`
      });
    }

    // Apply member discount
    const discountPct = memberRecord.court_discount_pct || 0;
    finalPrice = Math.max(0, court.hourly_rate_member * (1 - discountPct / 100));
  } else if (booking_type === 'walk-in') {
    // Front desk walk-in booking
    if (!['frontdesk', 'admin'].includes(req.user.role)) {
      return res.status(403).json({ error: 'Only front desk staff or administrators can create walk-in bookings' });
    }
    finalPrice = court.hourly_rate_walkin;
  }

  // ATOMIC DATABASE TRANSACTION FOR CONFLICT CHECKING & CREATION
  try {
    const bookingTx = db.transaction(() => {
      // 1. Check for overlapping court bookings
      const conflict = db.prepare(`
        SELECT id, booking_code, start_time, end_time
        FROM court_bookings
        WHERE court_id = ?
          AND date = ?
          AND status NOT IN ('Cancelled')
          AND NOT (end_time <= ? OR start_time >= ?)
      `).get(court_id, date, start_time, end_time);

      if (conflict) {
        throw new Error(`That court has just been booked by another member for ${conflict.start_time}-${conflict.end_time}. Please choose another slot.`);
      }

      // 2. Check for overlapping social sessions
      const socialConflict = db.prepare(`
        SELECT id, title, start_time, end_time
        FROM social_sessions
        WHERE court_id = ?
          AND date = ?
          AND status NOT IN ('Cancelled')
          AND NOT (end_time <= ? OR start_time >= ?)
      `).get(court_id, date, start_time, end_time);

      if (socialConflict) {
        throw new Error(`Court is reserved for club social session: ${socialConflict.title} (${socialConflict.start_time}-${socialConflict.end_time})`);
      }

      const bookingCode = `BKG-${new Date().getFullYear()}-${Math.floor(10000 + Math.random() * 90000)}`;

      const insertRes = db.prepare(`
        INSERT INTO court_bookings (
          booking_code, court_id, user_id, member_id, guest_name, guest_phone,
          booking_type, date, start_time, end_time, duration_minutes,
          price, payment_method, payment_status, status, notes, created_by_user_id
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 60, ?, ?, 'Paid', 'Confirmed', ?, ?)
      `).run(
        bookingCode,
        court_id,
        booking_type === 'member' ? req.user.id : null,
        memberRecord ? memberRecord.id : null,
        guest_name || (booking_type === 'member' ? req.user.full_name : null),
        guest_phone || (booking_type === 'member' ? req.user.phone : null),
        booking_type,
        date,
        start_time,
        end_time,
        finalPrice,
        payment_method,
        notes || null,
        req.user.id
      );

      return { bookingId: insertRes.lastInsertRowid, bookingCode };
    });

    const result = bookingTx();

    logAudit(req.user.id, req.user.email, req.user.role, 'BOOKING_CREATE', 'court_bookings', result.bookingId, {
      court: court.name,
      date,
      start_time,
      price: finalPrice
    });

    createNotification(
      req.user.id,
      'member',
      'Court Booking Confirmed',
      `Your reservation for ${court.name} on ${date} from ${start_time} to ${end_time} is confirmed!`,
      'booking',
      '/member/bookings'
    );

    res.status(201).json({
      message: 'Booking confirmed successfully!',
      booking: {
        id: result.bookingId,
        booking_code: result.bookingCode,
        court_name: court.name,
        date,
        start_time,
        end_time,
        price: finalPrice,
        status: 'Confirmed'
      }
    });
  } catch (err) {
    return res.status(409).json({ error: err.message });
  }
});

// Member's own bookings
app.get('/api/bookings/my', authenticateToken, (req, res) => {
  const bookings = db.prepare(`
    SELECT b.*, c.name as court_name, c.court_type, s.name as sport_name
    FROM court_bookings b
    JOIN courts c ON b.court_id = c.id
    JOIN facilities f ON c.facility_id = f.id
    JOIN sports s ON f.sport_id = s.id
    WHERE b.user_id = ?
    ORDER BY b.date DESC, b.start_time DESC
  `).all(req.user.id);

  res.json(bookings);
});

// Cancel a booking
app.post('/api/bookings/:id/cancel', authenticateToken, (req, res) => {
  const bookingId = req.params.id;
  const booking = db.prepare('SELECT * FROM court_bookings WHERE id = ?').get(bookingId);

  if (!booking) {
    return res.status(404).json({ error: 'Booking not found' });
  }

  // Authorization: must be the booking owner, or frontdesk/admin
  const isOwner = booking.user_id === req.user.id;
  const isStaff = ['frontdesk', 'admin'].includes(req.user.role);

  if (!isOwner && !isStaff) {
    return res.status(403).json({ error: 'You are not authorized to cancel this booking' });
  }

  if (booking.status === 'Cancelled') {
    return res.status(400).json({ error: 'Booking is already cancelled' });
  }

  // If member, check cancellation cutoff
  if (isOwner && !isStaff) {
    const bookingDateTime = new Date(`${booking.date}T${booking.start_time}`);
    const now = new Date();
    const diffHours = (bookingDateTime - now) / (1000 * 60 * 60);

    const cutoffSetting = db.prepare("SELECT value FROM club_settings WHERE key = 'cancellation_cutoff_hours'").get();
    const cutoff = cutoffSetting ? parseInt(cutoffSetting.value, 10) : 4;

    if (diffHours < cutoff) {
      return res.status(400).json({
        error: `Bookings can only be cancelled at least ${cutoff} hours in advance. Please contact the front desk.`
      });
    }
  }

  db.prepare(`
    UPDATE court_bookings
    SET status = 'Cancelled', notes = COALESCE(notes || ' | ', '') || 'Cancelled by user ' || ?
    WHERE id = ?
  `).run(req.user.email, bookingId);

  logAudit(req.user.id, req.user.email, req.user.role, 'BOOKING_CANCEL', 'court_bookings', bookingId, {
    reason: req.body.reason || 'User cancellation'
  });

  res.json({ message: 'Booking has been cancelled.' });
});

// Front desk check-in
app.post('/api/bookings/:id/check-in', authenticateToken, requireRole('frontdesk', 'admin'), (req, res) => {
  const bookingId = req.params.id;
  const booking = db.prepare('SELECT * FROM court_bookings WHERE id = ?').get(bookingId);

  if (!booking) {
    return res.status(404).json({ error: 'Booking not found' });
  }

  db.prepare("UPDATE court_bookings SET status = 'Checked In' WHERE id = ?").run(bookingId);

  logAudit(req.user.id, req.user.email, req.user.role, 'BOOKING_CHECK_IN', 'court_bookings', bookingId);
  res.json({ message: 'Member checked in successfully!' });
});

// Front desk / Admin all bookings
app.get('/api/bookings', authenticateToken, requireRole('frontdesk', 'admin', 'coach'), (req, res) => {
  const { date, status, sport_id } = req.query;
  let query = `
    SELECT b.*, c.name as court_name, c.court_type, s.name as sport_name,
      u.full_name as member_name, u.phone as member_phone, u.email as member_email,
      m.member_code, p.name as plan_name
    FROM court_bookings b
    JOIN courts c ON b.court_id = c.id
    JOIN facilities f ON c.facility_id = f.id
    JOIN sports s ON f.sport_id = s.id
    LEFT JOIN users u ON b.user_id = u.id
    LEFT JOIN members m ON b.member_id = m.id
    LEFT JOIN membership_plans p ON m.plan_id = p.id
    WHERE 1=1
  `;
  const params = [];

  if (date) {
    query += ` AND b.date = ?`;
    params.push(date);
  }
  if (status) {
    query += ` AND b.status = ?`;
    params.push(status);
  }
  if (sport_id) {
    query += ` AND s.id = ?`;
    params.push(sport_id);
  }

  query += ` ORDER BY b.date DESC, b.start_time DESC LIMIT 200`;
  const bookings = db.prepare(query).all(...params);
  res.json(bookings);
});

// Social sessions
app.get('/api/social-sessions', (req, res) => {
  const sessions = db.prepare(`
    SELECT s.*, c.name as court_name,
      (SELECT COUNT(*) FROM social_participants p WHERE p.session_id = s.id) as participant_count
    FROM social_sessions s
    JOIN courts c ON s.court_id = c.id
    WHERE s.date >= date('now', '-1 day')
    ORDER BY s.date ASC, s.start_time ASC
  `).all();

  res.json(sessions);
});

app.post('/api/social-sessions/:id/join', authenticateToken, (req, res) => {
  const sessionId = req.params.id;
  const session = db.prepare('SELECT * FROM social_sessions WHERE id = ?').get(sessionId);

  if (!session) {
    return res.status(404).json({ error: 'Social session not found' });
  }

  try {
    const joinTx = db.transaction(() => {
      const currentCount = db.prepare('SELECT COUNT(*) as count FROM social_participants WHERE session_id = ?').get(sessionId).count;
      if (currentCount >= session.capacity) {
        throw new Error('This social play session has reached maximum capacity.');
      }

      const alreadyJoined = db.prepare('SELECT id FROM social_participants WHERE session_id = ? AND user_id = ?').get(sessionId, req.user.id);
      if (alreadyJoined) {
        throw new Error('You have already registered for this social session.');
      }

      db.prepare(`
        INSERT INTO social_participants (session_id, user_id, member_id, name, phone, payment_status)
        VALUES (?, ?, ?, ?, ?, 'Paid')
      `).run(sessionId, req.user.id, req.user.member ? req.user.member.id : null, req.user.full_name, req.user.phone || '+1 555-0000');

      return currentCount + 1;
    });

    const newCount = joinTx();
    logAudit(req.user.id, req.user.email, req.user.role, 'SOCIAL_JOIN', 'social_sessions', sessionId);

    res.json({ message: 'Successfully registered for social play session!', participant_count: newCount });
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
});

// ==========================================
// 4. MEMBERS MANAGEMENT
// ==========================================

app.get('/api/members', authenticateToken, requireRole('frontdesk', 'admin', 'coach', 'finance', 'hr'), (req, res) => {
  const { q } = req.query;
  let query = `
    SELECT m.*, u.full_name, u.email, u.phone, u.status as user_status,
      p.code as plan_code, p.name as plan_name, p.monthly_price, p.court_discount_pct, p.shop_discount_pct, p.bar_discount_pct
    FROM members m
    JOIN users u ON m.user_id = u.id
    LEFT JOIN membership_plans p ON m.plan_id = p.id
    WHERE 1=1
  `;
  const params = [];

  if (q && q.trim()) {
    query += ` AND (LOWER(u.full_name) LIKE ? OR LOWER(u.email) LIKE ? OR u.phone LIKE ? OR LOWER(m.member_code) LIKE ?)`;
    const search = `%${q.trim().toLowerCase()}%`;
    params.push(search, search, search, search);
  }

  query += ` ORDER BY m.id DESC LIMIT 100`;
  const members = db.prepare(query).all(...params);
  res.json(members);
});

app.get('/api/members/:id', authenticateToken, requireRole('frontdesk', 'admin', 'coach', 'finance'), (req, res) => {
  const member = db.prepare(`
    SELECT m.*, u.full_name, u.email, u.phone, u.status as user_status,
      p.code as plan_code, p.name as plan_name, p.monthly_price, p.court_discount_pct, p.shop_discount_pct, p.bar_discount_pct
    FROM members m
    JOIN users u ON m.user_id = u.id
    LEFT JOIN membership_plans p ON m.plan_id = p.id
    WHERE m.id = ?
  `).get(req.params.id);

  if (!member) {
    return res.status(404).json({ error: 'Member not found' });
  }

  const recentBookings = db.prepare(`
    SELECT b.*, c.name as court_name
    FROM court_bookings b
    JOIN courts c ON b.court_id = c.id
    WHERE b.member_id = ?
    ORDER BY b.date DESC, b.start_time DESC LIMIT 10
  `).all(member.id);

  const recentOrders = db.prepare(`
    SELECT * FROM shop_orders WHERE member_id = ? ORDER BY id DESC LIMIT 10
  `).all(member.id);

  const barTabs = db.prepare(`
    SELECT * FROM bar_orders WHERE member_id = ? ORDER BY id DESC LIMIT 10
  `).all(member.id);

  const invoices = db.prepare(`
    SELECT * FROM invoices WHERE member_id = ? ORDER BY id DESC LIMIT 10
  `).all(member.id);

  res.json({
    member,
    recentBookings,
    recentOrders,
    barTabs,
    invoices
  });
});

app.post('/api/members', authenticateToken, requireRole('frontdesk', 'admin'), (req, res) => {
  const { full_name, email, phone, plan_id, dob, address, emergency_contact_name, emergency_contact_phone, notes } = req.body;

  if (!full_name || !email || !plan_id) {
    return res.status(400).json({ error: 'Full name, email, and membership plan are required' });
  }

  const existing = db.prepare('SELECT id FROM users WHERE LOWER(email) = LOWER(?)').get(email.trim());
  if (existing) {
    return res.status(400).json({ error: 'A user with this email already exists' });
  }

  const plan = db.prepare('SELECT * FROM membership_plans WHERE id = ?').get(plan_id);
  if (!plan) {
    return res.status(400).json({ error: 'Invalid membership plan selected' });
  }

  const defaultPassword = 'Champion#2026';
  const passwordHash = bcrypt.hashSync(defaultPassword, 10);

  const createTx = db.transaction(() => {
    const userRes = db.prepare(`
      INSERT INTO users (email, password_hash, full_name, phone, role, status)
      VALUES (?, ?, ?, ?, 'member', 'active')
    `).run(email.trim(), passwordHash, full_name.trim(), phone || null);

    const userId = userRes.lastInsertRowid;
    db.prepare('INSERT INTO user_roles (user_id, role) VALUES (?, ?)').run(userId, 'member');

    const memberCode = `MEM-${Math.floor(1000 + Math.random() * 9000)}`;
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    const expiry = new Date(today);
    expiry.setFullYear(today.getFullYear() + 1);
    const expiryStr = expiry.toISOString().split('T')[0];

    const memRes = db.prepare(`
      INSERT INTO members (user_id, member_code, plan_id, status, start_date, expiry_date, dob, address, emergency_contact_name, emergency_contact_phone, booking_allowance_daily, notes)
      VALUES (?, ?, ?, 'Active', ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      userId,
      memberCode,
      plan.id,
      todayStr,
      expiryStr,
      dob || null,
      address || null,
      emergency_contact_name || null,
      emergency_contact_phone || null,
      plan.daily_booking_limit,
      notes || null
    );

    // Create Initial Invoice
    const invoiceNum = `INV-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const tax = plan.monthly_price * 0.05;
    const total = plan.monthly_price + tax;

    const invRes = db.prepare(`
      INSERT INTO invoices (invoice_number, customer_name, customer_email, customer_phone, member_id, invoice_type, issue_date, due_date, subtotal, tax_amount, total_amount, paid_amount, status)
      VALUES (?, ?, ?, ?, ?, 'membership', ?, ?, ?, ?, ?, ?, 'Paid')
    `).run(invoiceNum, full_name.trim(), email.trim(), phone || null, memRes.lastInsertRowid, todayStr, todayStr, plan.monthly_price, tax, total, total);

    db.prepare(`
      INSERT INTO invoice_items (invoice_id, description, quantity, unit_price, total_price)
      VALUES (?, ?, 1, ?, ?)
    `).run(invRes.lastInsertRowid, `${plan.name} Membership Fee`, plan.monthly_price, plan.monthly_price);

    logAudit(req.user.id, req.user.email, req.user.role, 'MEMBER_CREATE', 'members', memRes.lastInsertRowid, {
      name: full_name,
      code: memberCode,
      plan: plan.name
    });

    return { memberId: memRes.lastInsertRowid, memberCode };
  });

  const created = createTx();
  res.status(201).json({
    message: 'Member registered successfully!',
    member_code: created.memberCode,
    id: created.memberId
  });
});

app.put('/api/members/:id', authenticateToken, requireRole('frontdesk', 'admin'), (req, res) => {
  const { status, plan_id, notes, emergency_contact_name, emergency_contact_phone } = req.body;
  const memberId = req.params.id;

  db.prepare(`
    UPDATE members
    SET status = COALESCE(?, status),
        plan_id = COALESCE(?, plan_id),
        notes = COALESCE(?, notes),
        emergency_contact_name = COALESCE(?, emergency_contact_name),
        emergency_contact_phone = COALESCE(?, emergency_contact_phone)
    WHERE id = ?
  `).run(status, plan_id, notes, emergency_contact_name, emergency_contact_phone, memberId);

  logAudit(req.user.id, req.user.email, req.user.role, 'MEMBER_UPDATE', 'members', memberId, { status, plan_id });
  res.json({ message: 'Member profile updated successfully' });
});

// ==========================================
// 5. SHOP & INVENTORY
// ==========================================

app.get('/api/products', (req, res) => {
  const { category_id, search, low_stock } = req.query;
  let query = `
    SELECT p.*, c.name as category_name
    FROM products p
    JOIN product_categories c ON p.category_id = c.id
    WHERE p.is_active = 1
  `;
  const params = [];

  if (category_id) {
    query += ` AND p.category_id = ?`;
    params.push(category_id);
  }
  if (search && search.trim()) {
    query += ` AND (LOWER(p.name) LIKE ? OR LOWER(p.sku) LIKE ? OR LOWER(p.brand) LIKE ?)`;
    const term = `%${search.trim().toLowerCase()}%`;
    params.push(term, term, term);
  }
  if (low_stock === 'true') {
    query += ` AND p.stock_quantity <= p.low_stock_threshold`;
  }

  query += ` ORDER BY p.name ASC`;
  const products = db.prepare(query).all(...params);
  res.json(products);
});

app.get('/api/products/categories', (req, res) => {
  const categories = db.prepare('SELECT * FROM product_categories ORDER BY name ASC').all();
  res.json(categories);
});

app.post('/api/products', authenticateToken, requireRole('shop', 'admin'), (req, res) => {
  const { sku, name, category_id, brand, description, image_url, selling_price, cost_price, stock_quantity, low_stock_threshold, supplier_name } = req.body;

  if (!sku || !name || !category_id || !selling_price) {
    return res.status(400).json({ error: 'SKU, name, category, and selling price are required' });
  }

  const existing = db.prepare('SELECT id FROM products WHERE sku = ?').get(sku.trim());
  if (existing) {
    return res.status(400).json({ error: 'Product with this SKU already exists' });
  }

  const result = db.prepare(`
    INSERT INTO products (sku, name, category_id, brand, description, image_url, selling_price, cost_price, stock_quantity, low_stock_threshold, supplier_name)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    sku.trim(),
    name.trim(),
    category_id,
    brand || null,
    description || null,
    image_url || 'https://images.unsplash.com/photo-1595435934249-5df7ed86e1c0?auto=format&fit=crop&w=600&q=80',
    selling_price,
    cost_price || (selling_price * 0.6),
    stock_quantity || 0,
    low_stock_threshold || 5,
    supplier_name || 'Standard Supplier'
  );

  logAudit(req.user.id, req.user.email, req.user.role, 'PRODUCT_CREATE', 'products', result.lastInsertRowid, { sku, name });
  res.status(201).json({ message: 'Product created successfully', id: result.lastInsertRowid });
});

// Adjust or Restock Inventory
app.post('/api/products/:id/adjust-stock', authenticateToken, requireRole('shop', 'admin'), (req, res) => {
  const productId = req.params.id;
  const { change_qty, transaction_type = 'restock', notes } = req.body;

  if (!change_qty || isNaN(change_qty)) {
    return res.status(400).json({ error: 'Valid numeric change quantity required' });
  }

  const product = db.prepare('SELECT * FROM products WHERE id = ?').get(productId);
  if (!product) {
    return res.status(404).json({ error: 'Product not found' });
  }

  const newQty = product.stock_quantity + Number(change_qty);
  if (newQty < 0) {
    return res.status(400).json({ error: `Cannot adjust stock below zero. Current stock is ${product.stock_quantity}.` });
  }

  const stockTx = db.transaction(() => {
    db.prepare('UPDATE products SET stock_quantity = ? WHERE id = ?').run(newQty, productId);
    db.prepare(`
      INSERT INTO inventory_transactions (product_id, change_qty, balance_after, transaction_type, reference_id, notes, created_by_user_id)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(productId, change_qty, newQty, transaction_type, `ADJ-${Date.now()}`, notes || null, req.user.id);
  });

  stockTx();

  logAudit(req.user.id, req.user.email, req.user.role, 'STOCK_ADJUST', 'products', productId, {
    change_qty,
    balance_after: newQty,
    type: transaction_type
  });

  res.json({ message: 'Stock updated successfully', new_stock: newQty });
});

// Shop POS / Checkout with Atomic Concurrency & Discount Calculation
app.post('/api/shop/checkout', authenticateToken, (req, res) => {
  const {
    items, // array of { product_id, quantity }
    order_type = 'pickup', // pickup, delivery
    delivery_address,
    payment_method = 'card',
    customer_name,
    customer_phone,
    member_id
  } = req.body;

  if (!items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'Cart is empty. Please select products to purchase.' });
  }

  // Determine active member discount
  let discountPct = 0;
  let memberObj = null;

  if (member_id || req.user.member) {
    const targetMemberId = member_id || (req.user.member && req.user.member.id);
    memberObj = db.prepare(`
      SELECT m.*, p.shop_discount_pct
      FROM members m
      JOIN membership_plans p ON m.plan_id = p.id
      WHERE m.id = ? AND m.status = 'Active'
    `).get(targetMemberId);

    if (memberObj) {
      discountPct = memberObj.discount_shop_override !== null ? memberObj.discount_shop_override : memberObj.shop_discount_pct;
    }
  }

  try {
    const checkoutTx = db.transaction(() => {
      let subtotal = 0;
      const orderItemsToInsert = [];

      for (const item of items) {
        // Atomic check and decrement:
        // Use an UPDATE with WHERE stock_quantity >= quantity to ensure no negative stock under concurrency
        const product = db.prepare('SELECT * FROM products WHERE id = ?').get(item.product_id);
        if (!product) {
          throw new Error(`Product ID ${item.product_id} not found.`);
        }

        if (product.stock_quantity < item.quantity) {
          throw new Error(`Insufficient stock for "${product.name}". Available: ${product.stock_quantity}, Requested: ${item.quantity}.`);
        }

        const updateRes = db.prepare(`
          UPDATE products
          SET stock_quantity = stock_quantity - ?
          WHERE id = ? AND stock_quantity >= ?
        `).run(item.quantity, item.product_id, item.quantity);

        if (updateRes.changes === 0) {
          throw new Error(`Conflict: Stock for "${product.name}" was just reserved by another customer. Please try again.`);
        }

        const lineTotal = product.selling_price * item.quantity;
        subtotal += lineTotal;

        orderItemsToInsert.push({
          product_id: product.id,
          name: product.name,
          unit_price: product.selling_price,
          quantity: item.quantity,
          line_total: lineTotal,
          new_stock: product.stock_quantity - item.quantity
        });
      }

      const discountAmount = Number(((subtotal * discountPct) / 100).toFixed(2));
      const taxableAmount = subtotal - discountAmount;
      const taxAmount = Number((taxableAmount * 0.05).toFixed(2));
      const totalAmount = Number((taxableAmount + taxAmount).toFixed(2));

      const orderNumber = `ORD-${Date.now().toString().slice(-6)}`;
      const orderRes = db.prepare(`
        INSERT INTO shop_orders (
          order_number, customer_type, user_id, member_id, customer_name, customer_phone,
          order_type, delivery_address, subtotal, discount_amount, tax_amount, total_amount,
          payment_method, payment_status, order_status, staff_user_id
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Paid', 'Confirmed', ?)
      `).run(
        orderNumber,
        memberObj ? 'member' : 'guest',
        req.user.id,
        memberObj ? memberObj.id : null,
        customer_name || req.user.full_name,
        customer_phone || req.user.phone || '+1 555-0000',
        order_type,
        delivery_address || null,
        subtotal,
        discountAmount,
        taxAmount,
        totalAmount,
        payment_method,
        req.user.id
      );

      const orderId = orderRes.lastInsertRowid;

      // Insert Order Items and Inventory Audit Transactions
      for (const oi of orderItemsToInsert) {
        db.prepare(`
          INSERT INTO shop_order_items (order_id, product_id, product_name, unit_price, quantity, total_price)
          VALUES (?, ?, ?, ?, ?, ?)
        `).run(orderId, oi.product_id, oi.name, oi.unit_price, oi.quantity, oi.line_total);

        db.prepare(`
          INSERT INTO inventory_transactions (product_id, change_qty, balance_after, transaction_type, reference_id, notes, created_by_user_id)
          VALUES (?, ?, ?, 'sale', ?, 'Shop sale checkout', ?)
        `).run(oi.product_id, -oi.quantity, oi.new_stock, orderNumber, req.user.id);
      }

      return {
        orderId,
        orderNumber,
        subtotal,
        discountAmount,
        taxAmount,
        totalAmount,
        discountPct,
        orderItemsToInsert
      };
    });

    const result = checkoutTx();

    logAudit(req.user.id, req.user.email, req.user.role, 'SHOP_PURCHASE', 'shop_orders', result.orderId, {
      orderNumber: result.orderNumber,
      total: result.totalAmount,
      items: result.orderItemsToInsert.length
    });

    createNotification(
      req.user.id,
      'member',
      `Order Confirmed (${result.orderNumber})`,
      `Your purchase of $${result.totalAmount.toFixed(2)} has been processed. Order is ${order_type === 'pickup' ? 'being prepared for pickup' : 'scheduled for dispatch'}.`,
      'order',
      '/member/orders'
    );

    res.status(201).json({
      message: 'Checkout completed successfully!',
      order: {
        id: result.orderId,
        order_number: result.orderNumber,
        subtotal: result.subtotal,
        discount_amount: result.discountAmount,
        tax_amount: result.taxAmount,
        total_amount: result.totalAmount,
        discount_percentage: result.discountPct,
        items: result.orderItemsToInsert
      }
    });
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
});

app.get('/api/shop/orders', authenticateToken, (req, res) => {
  const isShopStaff = ['shop', 'admin'].includes(req.user.role);

  let query = `
    SELECT o.*, u.email as user_email
    FROM shop_orders o
    LEFT JOIN users u ON o.user_id = u.id
  `;
  const params = [];

  if (!isShopStaff) {
    // Only return member's own orders
    query += ` WHERE o.user_id = ?`;
    params.push(req.user.id);
  }

  query += ` ORDER BY o.id DESC LIMIT 100`;
  const orders = db.prepare(query).all(...params);

  // Attach items to each order
  const orderIds = orders.map(o => o.id);
  if (orderIds.length > 0) {
    const items = db.prepare(`SELECT * FROM shop_order_items WHERE order_id IN (${orderIds.join(',')})`).all();
    orders.forEach(o => {
      o.items = items.filter(i => i.order_id === o.id);
    });
  }

  res.json(orders);
});

app.put('/api/shop/orders/:id/status', authenticateToken, requireRole('shop', 'admin'), (req, res) => {
  const { status } = req.body;
  const orderId = req.params.id;

  const validStatuses = ['Pending', 'Confirmed', 'Preparing', 'Ready for Pickup', 'Out for Delivery', 'Delivered', 'Cancelled', 'Refunded'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ error: 'Invalid order status' });
  }

  const order = db.prepare('SELECT * FROM shop_orders WHERE id = ?').get(orderId);
  if (!order) {
    return res.status(404).json({ error: 'Order not found' });
  }

  db.prepare('UPDATE shop_orders SET order_status = ? WHERE id = ?').run(status, orderId);

  // Notify customer
  if (order.user_id) {
    createNotification(
      order.user_id,
      'member',
      `Order #${order.order_number} Update: ${status}`,
      `Your order is now marked as ${status}.`,
      'order',
      '/member/orders'
    );
  }

  logAudit(req.user.id, req.user.email, req.user.role, 'ORDER_STATUS_UPDATE', 'shop_orders', orderId, { status });
  res.json({ message: `Order status updated to ${status}` });
});

// ==========================================
// 6. BAR / CAFETERIA POS & KITCHEN DISPLAY
// ==========================================

app.get('/api/bar/tables', authenticateToken, requireRole('bar', 'admin', 'frontdesk'), (req, res) => {
  const tables = db.prepare(`
    SELECT t.*, o.id as tab_id, o.order_number, o.customer_name, o.total_amount, o.kitchen_status, o.created_at as tab_created_at
    FROM bar_tables t
    LEFT JOIN bar_orders o ON t.current_tab_id = o.id AND o.status = 'Open'
    ORDER BY t.table_number ASC
  `).all();

  res.json(tables);
});

app.post('/api/bar/tables/:id/open', authenticateToken, requireRole('bar', 'admin'), (req, res) => {
  const tableId = req.params.id;
  const { customer_name, member_id } = req.body;

  const table = db.prepare('SELECT * FROM bar_tables WHERE id = ?').get(tableId);
  if (!table) {
    return res.status(404).json({ error: 'Table not found' });
  }

  if (table.status === 'Occupied' && table.current_tab_id) {
    return res.status(400).json({ error: 'Table is already occupied with an active tab.' });
  }

  const tabTx = db.transaction(() => {
    const orderNumber = `BAR-TAB-${Math.floor(100 + Math.random() * 900)}`;

    const orderRes = db.prepare(`
      INSERT INTO bar_orders (order_number, table_id, customer_name, member_id, is_tab, subtotal, discount_amount, tax_amount, total_amount, payment_status, kitchen_status, status, staff_user_id)
      VALUES (?, ?, ?, ?, 1, 0, 0, 0, 0, 'Pending', 'NEW', 'Open', ?)
    `).run(orderNumber, tableId, customer_name || `Guest (${table.table_number})`, member_id || null, req.user.id);

    const tabId = orderRes.lastInsertRowid;
    db.prepare("UPDATE bar_tables SET status = 'Occupied', current_tab_id = ? WHERE id = ?").run(tabId, tableId);

    return { tabId, orderNumber };
  });

  const created = tabTx();
  res.status(201).json({ message: 'Table opened successfully with new tab', tab: created });
});

// Get details of active tab or order
app.get('/api/bar/orders/:id', authenticateToken, requireRole('bar', 'admin'), (req, res) => {
  const order = db.prepare(`
    SELECT o.*, t.table_number, t.name as table_name
    FROM bar_orders o
    JOIN bar_tables t ON o.table_id = t.id
    WHERE o.id = ?
  `).get(req.params.id);

  if (!order) {
    return res.status(404).json({ error: 'Bar order not found' });
  }

  const items = db.prepare('SELECT * FROM bar_order_items WHERE bar_order_id = ?').all(order.id);
  res.json({ ...order, items });
});

// Add items to Bar Tab & send to Kitchen
app.post('/api/bar/orders/:id/items', authenticateToken, requireRole('bar', 'admin'), (req, res) => {
  const orderId = req.params.id;
  const { items } = req.body; // array of { name, category, unit_price, quantity, notes }

  if (!items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'No items provided' });
  }

  const order = db.prepare('SELECT * FROM bar_orders WHERE id = ? AND status = \'Open\'').get(orderId);
  if (!order) {
    return res.status(404).json({ error: 'Active tab not found' });
  }

  // Calculate member discount if applicable
  let discountPct = 0;
  if (order.member_id) {
    const member = db.prepare(`
      SELECT m.*, p.bar_discount_pct
      FROM members m
      JOIN membership_plans p ON m.plan_id = p.id
      WHERE m.id = ?
    `).get(order.member_id);
    if (member) {
      discountPct = member.discount_bar_override !== null ? member.discount_bar_override : member.bar_discount_pct;
    }
  }

  const addItemsTx = db.transaction(() => {
    for (const item of items) {
      db.prepare(`
        INSERT INTO bar_order_items (bar_order_id, item_name, category, unit_price, quantity, notes, kitchen_status)
        VALUES (?, ?, ?, ?, ?, ?, 'NEW')
      `).run(orderId, item.name, item.category || 'Mains', item.unit_price, item.quantity || 1, item.notes || null);
    }

    // Recalculate totals
    const currentItems = db.prepare('SELECT unit_price, quantity FROM bar_order_items WHERE bar_order_id = ?').all(orderId);
    const subtotal = currentItems.reduce((sum, i) => sum + (i.unit_price * i.quantity), 0);
    const discountAmount = Number(((subtotal * discountPct) / 100).toFixed(2));
    const taxable = subtotal - discountAmount;
    const taxAmount = Number((taxable * 0.05).toFixed(2));
    const totalAmount = Number((taxable + taxAmount).toFixed(2));

    db.prepare(`
      UPDATE bar_orders
      SET subtotal = ?, discount_amount = ?, tax_amount = ?, total_amount = ?, kitchen_status = 'PREPARING'
      WHERE id = ?
    `).run(subtotal, discountAmount, taxAmount, totalAmount, orderId);

    return { subtotal, discountAmount, taxAmount, totalAmount };
  });

  const totals = addItemsTx();

  logAudit(req.user.id, req.user.email, req.user.role, 'BAR_ORDER_ADD_ITEMS', 'bar_orders', orderId, {
    itemsCount: items.length,
    newTotal: totals.totalAmount
  });

  res.json({ message: 'Items added to tab and routed to kitchen display!', totals });
});

// Kitchen Display System (KDS) Active Orders
app.get('/api/bar/kds/orders', authenticateToken, requireRole('bar', 'admin'), (req, res) => {
  const orders = db.prepare(`
    SELECT o.id, o.order_number, o.table_id, o.customer_name, o.kitchen_status, o.created_at,
      t.table_number, t.name as table_name
    FROM bar_orders o
    JOIN bar_tables t ON o.table_id = t.id
    WHERE o.status = 'Open' AND o.kitchen_status IN ('NEW', 'PREPARING', 'READY')
    ORDER BY o.created_at ASC
  `).all();

  const items = db.prepare(`
    SELECT i.*, o.table_id
    FROM bar_order_items i
    JOIN bar_orders o ON i.bar_order_id = o.id
    WHERE o.status = 'Open'
  `).all();

  orders.forEach(o => {
    o.items = items.filter(i => i.bar_order_id === o.id);
  });

  res.json(orders);
});

// Update Kitchen Order Status (NEW -> PREPARING -> READY -> COMPLETED)
app.put('/api/bar/orders/:id/kds-status', authenticateToken, requireRole('bar', 'admin'), (req, res) => {
  const { kitchen_status } = req.body;
  const orderId = req.params.id;

  const valid = ['NEW', 'PREPARING', 'READY', 'COMPLETED'];
  if (!valid.includes(kitchen_status)) {
    return res.status(400).json({ error: 'Invalid kitchen status' });
  }

  db.prepare(`
    UPDATE bar_orders SET kitchen_status = ? WHERE id = ?
  `).run(kitchen_status, orderId);

  db.prepare(`
    UPDATE bar_order_items SET kitchen_status = ? WHERE bar_order_id = ?
  `).run(kitchen_status, orderId);

  res.json({ message: `Kitchen order status updated to ${kitchen_status}` });
});

// Settle Bar Tab / Close Table
app.post('/api/bar/orders/:id/settle', authenticateToken, requireRole('bar', 'admin'), (req, res) => {
  const orderId = req.params.id;
  const { payment_method = 'card' } = req.body;

  const order = db.prepare('SELECT * FROM bar_orders WHERE id = ?').get(orderId);
  if (!order) {
    return res.status(404).json({ error: 'Bar order not found' });
  }

  const settleTx = db.transaction(() => {
    const closedAt = new Date().toISOString();
    db.prepare(`
      UPDATE bar_orders
      SET status = 'Settled', payment_status = 'Settled', payment_method = ?, closed_at = ?
      WHERE id = ?
    `).run(payment_method, closedAt, orderId);

    // Free up table
    db.prepare(`
      UPDATE bar_tables
      SET status = 'Available', current_tab_id = NULL
      WHERE id = ?
    `).run(order.table_id);
  });

  settleTx();

  logAudit(req.user.id, req.user.email, req.user.role, 'BAR_TAB_SETTLE', 'bar_orders', orderId, {
    total: order.total_amount,
    payment_method
  });

  res.json({
    message: 'Bar tab settled successfully! Receipt generated.',
    receipt: {
      order_number: order.order_number,
      total_amount: order.total_amount,
      discount_amount: order.discount_amount,
      payment_method,
      settled_at: new Date().toISOString()
    }
  });
});

// ==========================================
// 7. CRM / ENQUIRIES MANAGEMENT
// ==========================================

app.get('/api/enquiries', authenticateToken, requireRole('frontdesk', 'admin'), (req, res) => {
  const { status } = req.query;
  let query = `
    SELECT e.*, u.full_name as assigned_staff_name
    FROM customer_enquiries e
    LEFT JOIN users u ON e.assigned_staff_id = u.id
    WHERE 1=1
  `;
  const params = [];

  if (status) {
    query += ` AND e.status = ?`;
    params.push(status);
  }

  query += ` ORDER BY e.id DESC`;
  const enquiries = db.prepare(query).all(...params);
  res.json(enquiries);
});

app.put('/api/enquiries/:id', authenticateToken, requireRole('frontdesk', 'admin'), (req, res) => {
  const { status, follow_up_date, notes, assigned_staff_id } = req.body;
  const enquiryId = req.params.id;

  db.prepare(`
    UPDATE customer_enquiries
    SET status = COALESCE(?, status),
        follow_up_date = COALESCE(?, follow_up_date),
        notes = COALESCE(?, notes),
        assigned_staff_id = COALESCE(?, assigned_staff_id)
    WHERE id = ?
  `).run(status, follow_up_date, notes, assigned_staff_id, enquiryId);

  logAudit(req.user.id, req.user.email, req.user.role, 'ENQUIRY_UPDATE', 'customer_enquiries', enquiryId, { status });
  res.json({ message: 'Enquiry updated successfully' });
});

// Convert Enquiry directly to Active Member
app.post('/api/enquiries/:id/convert', authenticateToken, requireRole('frontdesk', 'admin'), (req, res) => {
  const enquiryId = req.params.id;
  const { plan_code = 'GOLD' } = req.body;

  const enquiry = db.prepare('SELECT * FROM customer_enquiries WHERE id = ?').get(enquiryId);
  if (!enquiry) {
    return res.status(404).json({ error: 'Enquiry not found' });
  }

  if (enquiry.status === 'Converted') {
    return res.status(400).json({ error: 'This lead has already been converted to a member' });
  }

  const plan = db.prepare('SELECT * FROM membership_plans WHERE code = ?').get(plan_code);
  if (!plan) {
    return res.status(400).json({ error: 'Invalid membership plan' });
  }

  const convertTx = db.transaction(() => {
    // Check if user already exists with this email
    let user = db.prepare('SELECT id FROM users WHERE LOWER(email) = LOWER(?)').get(enquiry.email);
    let userId;

    if (!user) {
      const passwordHash = bcrypt.hashSync('Champion#2026', 10);
      const userRes = db.prepare(`
        INSERT INTO users (email, password_hash, full_name, phone, role, status)
        VALUES (?, ?, ?, ?, 'member', 'active')
      `).run(enquiry.email, passwordHash, enquiry.name, enquiry.phone);

      userId = userRes.lastInsertRowid;
      db.prepare('INSERT INTO user_roles (user_id, role) VALUES (?, ?)').run(userId, 'member');
    } else {
      userId = user.id;
    }

    const memberCode = `MEM-${Math.floor(1000 + Math.random() * 9000)}`;
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    const expiry = new Date(today);
    expiry.setFullYear(today.getFullYear() + 1);
    const expiryStr = expiry.toISOString().split('T')[0];

    const memRes = db.prepare(`
      INSERT INTO members (user_id, member_code, plan_id, status, start_date, expiry_date, booking_allowance_daily, notes)
      VALUES (?, ?, ?, 'Active', ?, ?, ?, ?)
    `).run(userId, memberCode, plan.id, todayStr, expiryStr, plan.daily_booking_limit, `Converted from lead ${enquiry.enquiry_code}`);

    const memberId = memRes.lastInsertRowid;

    // Update enquiry record while preserving history
    db.prepare(`
      UPDATE customer_enquiries
      SET status = 'Converted', converted_member_id = ?
      WHERE id = ?
    `).run(memberId, enquiryId);

    return { memberId, memberCode };
  });

  const result = convertTx();

  logAudit(req.user.id, req.user.email, req.user.role, 'ENQUIRY_CONVERT', 'customer_enquiries', enquiryId, {
    memberCode: result.memberCode
  });

  res.json({
    message: `Lead successfully converted into active member (${result.memberCode})!`,
    member_id: result.memberId,
    member_code: result.memberCode
  });
});

// ==========================================
// 8. FINANCE & INVOICES
// ==========================================

app.get('/api/finance/overview', authenticateToken, requireRole('finance', 'admin'), (req, res) => {
  const todayStr = new Date().toISOString().split('T')[0];
  const firstOfMonth = `${todayStr.slice(0, 7)}-01`;

  // Total revenues
  const courtRevToday = db.prepare(`
    SELECT COALESCE(SUM(price), 0) as total FROM court_bookings
    WHERE date = ? AND payment_status = 'Paid' AND status != 'Cancelled'
  `).get(todayStr).total;

  const shopRevToday = db.prepare(`
    SELECT COALESCE(SUM(total_amount), 0) as total FROM shop_orders
    WHERE DATE(created_at) = ? AND payment_status = 'Paid'
  `).get(todayStr).total;

  const barRevToday = db.prepare(`
    SELECT COALESCE(SUM(total_amount), 0) as total FROM bar_orders
    WHERE DATE(created_at) = ? AND payment_status = 'Settled'
  `).get(todayStr).total;

  const monthRevenue = db.prepare(`
    SELECT
      (SELECT COALESCE(SUM(price), 0) FROM court_bookings WHERE date >= ? AND payment_status = 'Paid' AND status != 'Cancelled') +
      (SELECT COALESCE(SUM(total_amount), 0) FROM shop_orders WHERE DATE(created_at) >= ? AND payment_status = 'Paid') +
      (SELECT COALESCE(SUM(total_amount), 0) FROM bar_orders WHERE DATE(created_at) >= ? AND payment_status = 'Settled') +
      (SELECT COALESCE(SUM(paid_amount), 0) FROM invoices WHERE issue_date >= ?) as total
  `).get(firstOfMonth, firstOfMonth, firstOfMonth, firstOfMonth).total;

  const totalExpensesMonth = db.prepare(`
    SELECT COALESCE(SUM(amount), 0) as total FROM expenses WHERE date >= ?
  `).get(firstOfMonth).total;

  const receivables = db.prepare(`
    SELECT COALESCE(SUM(total_amount - paid_amount), 0) as total
    FROM invoices WHERE status IN ('Sent', 'Partially Paid', 'Overdue')
  `).get().total;

  res.json({
    todayRevenue: {
      total: Number((courtRevToday + shopRevToday + barRevToday).toFixed(2)),
      court: courtRevToday,
      shop: shopRevToday,
      bar: barRevToday
    },
    monthRevenue: Number(monthRevenue.toFixed(2)),
    monthExpenses: Number(totalExpensesMonth.toFixed(2)),
    netProfitMonth: Number((monthRevenue - totalExpensesMonth).toFixed(2)),
    outstandingReceivables: Number(receivables.toFixed(2))
  });
});

app.get('/api/finance/invoices', authenticateToken, requireRole('finance', 'admin'), (req, res) => {
  const invoices = db.prepare(`
    SELECT i.*, m.member_code
    FROM invoices i
    LEFT JOIN members m ON i.member_id = m.id
    ORDER BY i.id DESC
  `).all();

  res.json(invoices);
});

app.post('/api/finance/invoices', authenticateToken, requireRole('finance', 'admin'), (req, res) => {
  const { customer_name, customer_email, customer_phone, member_id, invoice_type = 'other', due_date, items, notes } = req.body;

  if (!customer_name || !due_date || !items || items.length === 0) {
    return res.status(400).json({ error: 'Customer name, due date, and line items are required' });
  }

  const invTx = db.transaction(() => {
    let subtotal = 0;
    items.forEach(i => { subtotal += i.unit_price * (i.quantity || 1); });
    const tax = subtotal * 0.05;
    const total = subtotal + tax;
    const invoiceNum = `INV-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const todayStr = new Date().toISOString().split('T')[0];

    const invRes = db.prepare(`
      INSERT INTO invoices (invoice_number, customer_name, customer_email, customer_phone, member_id, invoice_type, issue_date, due_date, subtotal, tax_amount, total_amount, paid_amount, status, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 'Sent', ?)
    `).run(invoiceNum, customer_name, customer_email || null, customer_phone || null, member_id || null, invoice_type, todayStr, due_date, subtotal, tax, total, notes || null);

    const invId = invRes.lastInsertRowid;
    for (const item of items) {
      db.prepare(`
        INSERT INTO invoice_items (invoice_id, description, quantity, unit_price, total_price)
        VALUES (?, ?, ?, ?, ?)
      `).run(invId, item.description, item.quantity || 1, item.unit_price, item.unit_price * (item.quantity || 1));
    }

    return { invId, invoiceNum, total };
  });

  const created = invTx();
  logAudit(req.user.id, req.user.email, req.user.role, 'INVOICE_CREATE', 'invoices', created.invId, { number: created.invoiceNum });
  res.status(201).json({ message: 'Invoice generated successfully', invoice: created });
});

app.put('/api/finance/invoices/:id/pay', authenticateToken, requireRole('finance', 'admin'), (req, res) => {
  const invoiceId = req.params.id;
  const { amount_paid } = req.body;

  const invoice = db.prepare('SELECT * FROM invoices WHERE id = ?').get(invoiceId);
  if (!invoice) return res.status(404).json({ error: 'Invoice not found' });

  const newPaid = Number(invoice.paid_amount) + Number(amount_paid || invoice.total_amount);
  const newStatus = newPaid >= invoice.total_amount ? 'Paid' : 'Partially Paid';

  db.prepare(`
    UPDATE invoices
    SET paid_amount = ?, status = ?
    WHERE id = ?
  `).run(newPaid, newStatus, invoiceId);

  logAudit(req.user.id, req.user.email, req.user.role, 'INVOICE_PAY', 'invoices', invoiceId, { paid: newPaid });
  res.json({ message: 'Payment recorded on invoice successfully', status: newStatus });
});

app.get('/api/finance/expenses', authenticateToken, requireRole('finance', 'admin'), (req, res) => {
  const expenses = db.prepare('SELECT * FROM expenses ORDER BY date DESC').all();
  res.json(expenses);
});

app.post('/api/finance/expenses', authenticateToken, requireRole('finance', 'admin'), (req, res) => {
  const { vendor_name, category, amount, payment_method, date, notes } = req.body;

  if (!vendor_name || !amount || !category) {
    return res.status(400).json({ error: 'Vendor, category, and amount are required' });
  }

  const expNum = `EXP-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`;
  const dateStr = date || new Date().toISOString().split('T')[0];

  const resInsert = db.prepare(`
    INSERT INTO expenses (expense_number, vendor_name, category, amount, tax_amount, payment_method, date, notes, created_by_user_id)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(expNum, vendor_name, category, amount, amount * 0.05, payment_method || 'Bank Transfer', dateStr, notes || null, req.user.id);

  logAudit(req.user.id, req.user.email, req.user.role, 'EXPENSE_CREATE', 'expenses', resInsert.lastInsertRowid, { vendor: vendor_name, amount });
  res.status(201).json({ message: 'Expense recorded successfully', expense_number: expNum });
});

// ==========================================
// 9. HR & STAFF MANAGEMENT
// ==========================================

app.get('/api/hr/employees', authenticateToken, requireRole('hr', 'admin'), (req, res) => {
  const employees = db.prepare(`
    SELECT e.*, u.email as account_email, u.status as account_status
    FROM employees e
    LEFT JOIN users u ON e.user_id = u.id
    ORDER BY e.name ASC
  `).all();
  res.json(employees);
});

app.get('/api/hr/shifts', authenticateToken, requireRole('hr', 'admin', 'frontdesk'), (req, res) => {
  const { date } = req.query;
  const targetDate = date || new Date().toISOString().split('T')[0];

  const shifts = db.prepare(`
    SELECT s.*, e.name as employee_name, e.department, e.role as staff_role
    FROM shifts s
    JOIN employees e ON s.employee_id = e.id
    WHERE s.date = ?
    ORDER BY s.start_time ASC
  `).all(targetDate);

  res.json(shifts);
});

app.post('/api/hr/shifts', authenticateToken, requireRole('hr', 'admin'), (req, res) => {
  const { employee_id, date, start_time, end_time, notes } = req.body;

  if (!employee_id || !date || !start_time || !end_time) {
    return res.status(400).json({ error: 'Employee, date, start time, and end time are required' });
  }

  const result = db.prepare(`
    INSERT INTO shifts (employee_id, date, start_time, end_time, status, notes)
    VALUES (?, ?, ?, ?, 'Scheduled', ?)
  `).run(employee_id, date, start_time, end_time, notes || null);

  res.status(201).json({ message: 'Shift rostered successfully', id: result.lastInsertRowid });
});

app.get('/api/hr/leave', authenticateToken, requireRole('hr', 'admin', 'coach'), (req, res) => {
  let query = `
    SELECT l.*, e.name as employee_name, e.department, e.role as staff_role
    FROM leave_requests l
    JOIN employees e ON l.employee_id = e.id
  `;

  // If coach or non-HR staff, only see own leave
  if (req.user.role === 'coach') {
    const coachEmp = db.prepare('SELECT id FROM employees WHERE user_id = ?').get(req.user.id);
    if (coachEmp) {
      query += ` WHERE l.employee_id = ${coachEmp.id}`;
    }
  }

  query += ` ORDER BY l.id DESC`;
  const leave = db.prepare(query).all();
  res.json(leave);
});

app.post('/api/hr/leave', authenticateToken, (req, res) => {
  const { leave_type, start_date, end_date, reason } = req.body;
  const emp = db.prepare('SELECT id FROM employees WHERE user_id = ?').get(req.user.id);

  if (!emp) {
    return res.status(400).json({ error: 'Only registered club employees can submit leave requests.' });
  }

  const result = db.prepare(`
    INSERT INTO leave_requests (employee_id, leave_type, start_date, end_date, reason, status)
    VALUES (?, ?, ?, ?, ?, 'Pending')
  `).run(emp.id, leave_type || 'Casual', start_date, end_date, reason);

  createNotification(null, 'hr', 'New Leave Request', `Staff member submitted a leave request (${leave_type}).`, 'info', '/hr/leave');
  res.status(201).json({ message: 'Leave request submitted for manager approval.' });
});

app.put('/api/hr/leave/:id', authenticateToken, requireRole('hr', 'admin'), (req, res) => {
  const { status, review_notes } = req.body;
  const leaveId = req.params.id;

  if (!['Approved', 'Rejected'].includes(status)) {
    return res.status(400).json({ error: 'Status must be Approved or Rejected' });
  }

  db.prepare(`
    UPDATE leave_requests
    SET status = ?, review_notes = ?, reviewed_by_user_id = ?
    WHERE id = ?
  `).run(status, review_notes || null, req.user.id, leaveId);

  const leave = db.prepare(`
    SELECT l.*, e.user_id FROM leave_requests l JOIN employees e ON l.employee_id = e.id WHERE l.id = ?
  `).get(leaveId);

  if (leave && leave.user_id) {
    createNotification(
      leave.user_id,
      'all',
      `Leave Request ${status}`,
      `Your ${leave.leave_type} leave from ${leave.start_date} to ${leave.end_date} has been ${status.toLowerCase()}.`,
      status === 'Approved' ? 'success' : 'warning',
      '/hr/leave'
    );
  }

  res.json({ message: `Leave request ${status.toLowerCase()} successfully.` });
});

// ==========================================
// 10. COACH PORTAL
// ==========================================

app.get('/api/coach/schedule', authenticateToken, requireRole('coach', 'admin'), (req, res) => {
  const todayStr = new Date().toISOString().split('T')[0];

  const sessions = db.prepare(`
    SELECT b.*, c.name as court_name, u.full_name as member_name, u.phone as member_phone
    FROM court_bookings b
    JOIN courts c ON b.court_id = c.id
    LEFT JOIN users u ON b.user_id = u.id
    WHERE b.date >= ? AND b.status NOT IN ('Cancelled')
    ORDER BY b.date ASC, b.start_time ASC
  `).all(todayStr);

  const socials = db.prepare(`
    SELECT s.*, c.name as court_name,
      (SELECT COUNT(*) FROM social_participants p WHERE p.session_id = s.id) as participant_count
    FROM social_sessions s
    JOIN courts c ON s.court_id = c.id
    WHERE s.date >= ?
    ORDER BY s.date ASC
  `).all(todayStr);

  res.json({ sessions, socials });
});

// ==========================================
// 11. ADMIN EXECUTIVE DASHBOARD & SETTINGS
// ==========================================

app.get('/api/admin/dashboard', authenticateToken, requireRole('admin'), (req, res) => {
  const todayStr = new Date().toISOString().split('T')[0];
  const firstOfMonth = `${todayStr.slice(0, 7)}-01`;

  // Aggregate stats
  const activeMembers = db.prepare("SELECT COUNT(*) as count FROM members WHERE status = 'Active'").get().count;
  const expiringSoon = db.prepare(`
    SELECT COUNT(*) as count FROM members
    WHERE status = 'Active' AND expiry_date BETWEEN ? AND date(?, '+14 days')
  `).get(todayStr, todayStr).count;

  const totalCourts = db.prepare('SELECT COUNT(*) as count FROM courts').get().count;
  const courtsBookedToday = db.prepare(`
    SELECT COUNT(DISTINCT court_id) as count FROM court_bookings
    WHERE date = ? AND status NOT IN ('Cancelled')
  `).get(todayStr).count;

  const lowStockCount = db.prepare('SELECT COUNT(*) as count FROM products WHERE stock_quantity <= low_stock_threshold').get().count;
  const openTabsCount = db.prepare("SELECT COUNT(*) as count FROM bar_orders WHERE status = 'Open'").get().count;
  const openEnquiries = db.prepare("SELECT COUNT(*) as count FROM customer_enquiries WHERE status IN ('New', 'Contacted', 'Trial Scheduled')").get().count;

  // Revenues
  const courtRev = db.prepare("SELECT COALESCE(SUM(price), 0) as total FROM court_bookings WHERE payment_status = 'Paid' AND status != 'Cancelled'").get().total;
  const shopRev = db.prepare("SELECT COALESCE(SUM(total_amount), 0) as total FROM shop_orders WHERE payment_status = 'Paid'").get().total;
  const barRev = db.prepare("SELECT COALESCE(SUM(total_amount), 0) as total FROM bar_orders WHERE payment_status = 'Settled'").get().total;
  const memRev = db.prepare("SELECT COALESCE(SUM(paid_amount), 0) as total FROM invoices WHERE invoice_type = 'membership'").get().total;

  res.json({
    kpis: {
      activeMembers,
      expiringSoon,
      courtUtilizationPct: totalCourts > 0 ? Math.round((courtsBookedToday / totalCourts) * 100) : 0,
      lowStockCount,
      openTabsCount,
      openEnquiries,
      totalRevenue: Number((courtRev + shopRev + barRev + memRev).toFixed(2)),
      breakdown: {
        court: courtRev,
        shop: shopRev,
        bar: barRev,
        membership: memRev
      }
    }
  });
});

app.get('/api/admin/users', authenticateToken, requireRole('admin'), (req, res) => {
  const users = db.prepare(`
    SELECT u.id, u.email, u.full_name, u.phone, u.role, u.status, u.created_at,
      (SELECT GROUP_CONCAT(role, ', ') FROM user_roles WHERE user_id = u.id) as assigned_roles
    FROM users u
    ORDER BY u.id DESC
  `).all();
  res.json(users);
});

app.put('/api/admin/users/:id', authenticateToken, requireRole('admin'), (req, res) => {
  const { role, status, full_name, phone } = req.body;
  const userId = req.params.id;

  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
  if (!user) return res.status(404).json({ error: 'User not found' });

  db.prepare(`
    UPDATE users
    SET role = COALESCE(?, role),
        status = COALESCE(?, status),
        full_name = COALESCE(?, full_name),
        phone = COALESCE(?, phone)
    WHERE id = ?
  `).run(role, status, full_name, phone, userId);

  if (role) {
    // Ensure user_roles has the role
    const hasRole = db.prepare('SELECT id FROM user_roles WHERE user_id = ? AND role = ?').get(userId, role);
    if (!hasRole) {
      db.prepare('INSERT INTO user_roles (user_id, role) VALUES (?, ?)').run(userId, role);
    }
  }

  logAudit(req.user.id, req.user.email, req.user.role, 'USER_UPDATE', 'users', userId, { role, status });
  res.json({ message: 'User updated successfully' });
});

app.get('/api/admin/audit-logs', authenticateToken, requireRole('admin'), (req, res) => {
  const logs = db.prepare('SELECT * FROM audit_logs ORDER BY id DESC LIMIT 200').all();
  res.json(logs);
});

app.get('/api/admin/settings', authenticateToken, requireRole('admin'), (req, res) => {
  const settings = db.prepare('SELECT * FROM club_settings').all();
  const settingsObj = {};
  settings.forEach(s => { settingsObj[s.key] = s.value; });
  res.json(settingsObj);
});

app.put('/api/admin/settings', authenticateToken, requireRole('admin'), (req, res) => {
  const settings = req.body; // key-value object

  const updateTx = db.transaction(() => {
    for (const [key, value] of Object.entries(settings)) {
      db.prepare(`
        INSERT INTO club_settings (key, value, updated_at)
        VALUES (?, ?, CURRENT_TIMESTAMP)
        ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = CURRENT_TIMESTAMP
      `).run(key, String(value));
    }
  });

  updateTx();
  logAudit(req.user.id, req.user.email, req.user.role, 'SETTINGS_UPDATE', 'club_settings', 'all', settings);
  res.json({ message: 'Club settings updated successfully' });
});

// ==========================================
// 12. NOTIFICATIONS
// ==========================================

app.get('/api/notifications', authenticateToken, (req, res) => {
  const notifications = db.prepare(`
    SELECT * FROM notifications
    WHERE (user_id = ? OR role_target = ? OR role_target = 'all')
    ORDER BY id DESC LIMIT 50
  `).all(req.user.id, req.user.role);

  res.json(notifications);
});

app.put('/api/notifications/:id/read', authenticateToken, (req, res) => {
  db.prepare('UPDATE notifications SET is_read = 1 WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

app.post('/api/notifications/mark-all-read', authenticateToken, (req, res) => {
  db.prepare(`
    UPDATE notifications
    SET is_read = 1
    WHERE (user_id = ? OR role_target = ? OR role_target = 'all')
  `).run(req.user.id, req.user.role);
  res.json({ success: true });
});

// Serve client static files from client/dist if available
const clientDistPath = path.join(__dirname, '..', 'client', 'dist');
app.use(express.static(clientDistPath));

app.use((req, res, next) => {
  if (req.method === 'GET' && !req.path.startsWith('/api')) {
    return res.sendFile(path.join(clientDistPath, 'index.html'));
  }
  next();
});

// Start Express Server
app.listen(PORT, () => {
  console.log(`The Champions Club Operating System API is live on port ${PORT}`);
});
