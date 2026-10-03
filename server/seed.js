const { db, initSchema } = require('./db');
const bcrypt = require('bcryptjs');

function seedDatabase() {
  initSchema();

  // Check if already seeded
  const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get().count;
  if (userCount > 0) {
    console.log('Database already seeded. Skipping initial seeding.');
    return;
  }

  console.log('Seeding fresh demo database...');

  const passwordHash = bcrypt.hashSync('Champion#2026', 10);

  const insertUser = db.prepare(`
    INSERT INTO users (email, password_hash, full_name, phone, role, status)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  const insertUserRole = db.prepare(`
    INSERT INTO user_roles (user_id, role) VALUES (?, ?)
  `);

  // Insert Core Staff & Admin Accounts
  const accounts = [
    { email: 'owner@championsclub.demo', name: 'Victoria Sterling (Owner)', phone: '+1 555-0101', role: 'admin' },
    { email: 'frontdesk@championsclub.demo', name: 'Sarah Jenkins (Front Desk)', phone: '+1 555-0102', role: 'frontdesk' },
    { email: 'coach@championsclub.demo', name: 'Marcus Vance (Head Tennis Coach)', phone: '+1 555-0103', role: 'coach' },
    { email: 'shop@championsclub.demo', name: 'Maya Patel (Shop Manager)', phone: '+1 555-0104', role: 'shop' },
    { email: 'bar@championsclub.demo', name: 'Liam O\'Connor (Barista & Bar Lead)', phone: '+1 555-0105', role: 'bar' },
    { email: 'finance@championsclub.demo', name: 'David Chen (Finance Controller)', phone: '+1 555-0106', role: 'finance' },
    { email: 'hr@championsclub.demo', name: 'Rachel Adams (HR Manager)', phone: '+1 555-0107', role: 'hr' },
    // Demo Members
    { email: 'member@championsclub.demo', name: 'Alexander Wright (Gold Member)', phone: '+1 555-0201', role: 'member' },
    { email: 'silver.member@championsclub.demo', name: 'Elena Rostova (Silver Member)', phone: '+1 555-0202', role: 'member' },
    { email: 'junior.member@championsclub.demo', name: 'Leo Martinez (Junior Member)', phone: '+1 555-0203', role: 'member' },
    { email: 'expired.member@championsclub.demo', name: 'Arthur Pendelton (Expired)', phone: '+1 555-0204', role: 'member' },
  ];

  const userMap = {};
  for (const acc of accounts) {
    const res = insertUser.run(acc.email, passwordHash, acc.name, acc.phone, acc.role, 'active');
    userMap[acc.email] = res.lastInsertRowid;
    insertUserRole.run(res.lastInsertRowid, acc.role);
  }

  // Owner also has fallback access
  insertUserRole.run(userMap['owner@championsclub.demo'], 'member');

  // Insert Membership Plans
  const insertPlan = db.prepare(`
    INSERT INTO membership_plans (code, name, description, monthly_price, annual_price, court_discount_pct, shop_discount_pct, bar_discount_pct, daily_booking_limit, peak_access, priority_days_advance, is_active)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const goldPlan = insertPlan.run('GOLD', 'Gold Championship Plan', 'Full premier access, 14-day advance booking, VIP lounge, highest pro-shop & bar discounts.', 149.0, 1490.0, 20.0, 10.0, 15.0, 2, 1, 14, 1);
  const silverPlan = insertPlan.run('SILVER', 'Silver Club Plan', 'Standard member access with 7-day advance booking and essential discounts.', 89.0, 890.0, 10.0, 5.0, 5.0, 1, 1, 7, 1);
  const juniorPlan = insertPlan.run('JUNIOR', 'Junior Stars (Under 18)', 'Special youth athletic development tier with supervised court access.', 49.0, 490.0, 15.0, 5.0, 5.0, 1, 0, 5, 1);

  // Today's date helpers
  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];
  const nextYear = new Date(today);
  nextYear.setFullYear(today.getFullYear() + 1);
  const nextYearStr = nextYear.toISOString().split('T')[0];
  
  const pastDate = new Date(today);
  pastDate.setMonth(today.getMonth() - 2);
  const pastDateStr = pastDate.toISOString().split('T')[0];

  const expSoonDate = new Date(today);
  expSoonDate.setDate(today.getDate() + 5);
  const expSoonDateStr = expSoonDate.toISOString().split('T')[0];

  // Insert Members
  const insertMember = db.prepare(`
    INSERT INTO members (user_id, member_code, plan_id, status, start_date, expiry_date, dob, emergency_contact_name, emergency_contact_phone, booking_allowance_daily, loyalty_points, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const m1 = insertMember.run(userMap['member@championsclub.demo'], 'MEM-1001', goldPlan.lastInsertRowid, 'Active', todayStr, nextYearStr, '1988-04-12', 'Claire Wright', '+1 555-0999', 2, 340, 'Club champion 2025 tennis finalist');
  const m2 = insertMember.run(userMap['silver.member@championsclub.demo'], 'MEM-1002', silverPlan.lastInsertRowid, 'Active', todayStr, nextYearStr, '1992-09-24', 'Dmitri Rostov', '+1 555-0998', 1, 120, 'Prefers evening badminton');
  const m3 = insertMember.run(userMap['junior.member@championsclub.demo'], 'MEM-1003', juniorPlan.lastInsertRowid, 'Active', todayStr, nextYearStr, '2009-11-15', 'Carla Martinez', '+1 555-0997', 1, 80, 'Under 18 tournament circuit');
  const m4 = insertMember.run(userMap['expired.member@championsclub.demo'], 'MEM-1004', silverPlan.lastInsertRowid, 'Expired', pastDateStr, pastDateStr, '1980-01-10', 'Laura Pendelton', '+1 555-0996', 0, 10, 'Membership lapsed last month');

  // Insert Sports
  const insertSport = db.prepare(`
    INSERT INTO sports (name, slug, description, image_url, icon)
    VALUES (?, ?, ?, ?, ?)
  `);

  const tennis = insertSport.run('Tennis', 'tennis', 'Championship clay and professional cushioned hard courts with LED tournament lighting.', 'https://images.unsplash.com/photo-1595435934249-5df7ed86e1c0?auto=format&fit=crop&w=1200&q=80', 'Activity');
  const badminton = insertSport.run('Badminton', 'badminton', 'BWF certified tournament wooden sprung floors with anti-glare overhead lumination.', 'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?auto=format&fit=crop&w=1200&q=80', 'Zap');
  const cricket = insertSport.run('Cricket', 'cricket', 'Indoor all-weather automated bowling turf nets and full match practice pitch.', 'https://images.unsplash.com/photo-1531415074868-036b1c57e3ce?auto=format&fit=crop&w=1200&q=80', 'Target');

  // Facilities
  const insertFacility = db.prepare(`
    INSERT INTO facilities (sport_id, name, location, opening_time, closing_time)
    VALUES (?, ?, ?, ?, ?)
  `);

  const facTennis = insertFacility.run(tennis.lastInsertRowid, 'Grand Slam Tennis Arena', 'North Pavilion Wing', '06:00', '23:00');
  const facBadminton = insertFacility.run(badminton.lastInsertRowid, 'Apex Badminton Dome', 'East Sports Hall', '06:00', '23:00');
  const facCricket = insertFacility.run(cricket.lastInsertRowid, 'Oval Practice Complex', 'West Pavilion Grounds', '06:00', '22:00');

  // Courts
  const insertCourt = db.prepare(`
    INSERT INTO courts (facility_id, name, court_type, hourly_rate_member, hourly_rate_walkin, status, image_url)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  const cTennis1 = insertCourt.run(facTennis.lastInsertRowid, 'Tennis Court 1 (Center Clay)', 'Red Clay', 25.0, 45.0, 'Available', 'https://images.unsplash.com/photo-1595435934249-5df7ed86e1c0?auto=format&fit=crop&w=800&q=80');
  const cTennis2 = insertCourt.run(facTennis.lastInsertRowid, 'Tennis Court 2 (Hard Court Pro)', 'DecoTurf Hard', 20.0, 40.0, 'Available', 'https://images.unsplash.com/photo-1554068865-24cecd4e34b8?auto=format&fit=crop&w=800&q=80');
  const cTennis3 = insertCourt.run(facTennis.lastInsertRowid, 'Tennis Court 3 (Covered Hard)', 'Covered Hard', 22.0, 42.0, 'Available', 'https://images.unsplash.com/photo-1622279457486-62dcc4a431d6?auto=format&fit=crop&w=800&q=80');
  
  const cBad1 = insertCourt.run(facBadminton.lastInsertRowid, 'Badminton Court 1 (BWF Mat)', 'BWF Certified Mat', 18.0, 32.0, 'Available', 'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?auto=format&fit=crop&w=800&q=80');
  const cBad2 = insertCourt.run(facBadminton.lastInsertRowid, 'Badminton Court 2 (Olympic Wood)', 'Maple Sprung Wood', 18.0, 32.0, 'Available', 'https://images.unsplash.com/photo-1613918108466-292b78a8ef95?auto=format&fit=crop&w=800&q=80');

  const cCric1 = insertCourt.run(facCricket.lastInsertRowid, 'Cricket Lane 1 (Pace Turf & Machine)', 'AstroTurf Pace Lane', 25.0, 45.0, 'Available', 'https://images.unsplash.com/photo-1531415074868-036b1c57e3ce?auto=format&fit=crop&w=800&q=80');
  const cCric2 = insertCourt.run(facCricket.lastInsertRowid, 'Cricket Lane 2 (Spin Turf)', 'Natural Spin Track', 25.0, 45.0, 'Available', 'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?auto=format&fit=crop&w=800&q=80');

  // Insert Existing Court Bookings for today
  const insertBooking = db.prepare(`
    INSERT INTO court_bookings (booking_code, court_id, user_id, member_id, guest_name, guest_phone, booking_type, date, start_time, end_time, duration_minutes, price, payment_status, status, notes, created_by_user_id)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  insertBooking.run('BKG-2026-001', cTennis1.lastInsertRowid, userMap['member@championsclub.demo'], m1.lastInsertRowid, null, null, 'member', todayStr, '10:00', '11:00', 60, 20.0, 'Paid', 'Confirmed', 'Morning singles rally', userMap['member@championsclub.demo']);
  insertBooking.run('BKG-2026-002', cBad1.lastInsertRowid, userMap['silver.member@championsclub.demo'], m2.lastInsertRowid, null, null, 'member', todayStr, '16:00', '17:00', 60, 16.2, 'Paid', 'Confirmed', 'Evening doubles practice', userMap['silver.member@championsclub.demo']);
  insertBooking.run('BKG-2026-003', cTennis2.lastInsertRowid, null, null, 'Robert Langdon (Walk-in)', '+1 555-8822', 'walk-in', todayStr, '14:00', '15:00', 60, 40.0, 'Paid', 'Checked In', 'Walk-in booked at reception', userMap['frontdesk@championsclub.demo']);

  // Insert Social Session
  const insertSocial = db.prepare(`
    INSERT INTO social_sessions (court_id, title, sport, date, start_time, end_time, capacity, price_per_person, organizer_name, status, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const soc1 = insertSocial.run(cTennis3.lastInsertRowid, 'Friday Sunset Tennis Mixer', 'Tennis', todayStr, '18:00', '20:00', 12, 15.0, 'Marcus Vance', 'Open', 'Mix and match social doubles with complimentary beverages at the clubhouse.');
  
  const insertSocialPart = db.prepare(`
    INSERT INTO social_participants (session_id, user_id, member_id, name, phone, payment_status)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  insertSocialPart.run(soc1.lastInsertRowid, userMap['member@championsclub.demo'], m1.lastInsertRowid, 'Alexander Wright', '+1 555-0201', 'Paid');

  // Insert Product Categories
  const insertCategory = db.prepare(`INSERT INTO product_categories (name, slug) VALUES (?, ?)`);
  const catRackets = insertCategory.run('Rackets & Bats', 'rackets');
  const catBalls = insertCategory.run('Balls & Shuttles', 'balls');
  const catShoes = insertCategory.run('Footwear', 'footwear');
  const catApparel = insertCategory.run('Apparel', 'apparel');
  const catAccessories = insertCategory.run('Accessories', 'accessories');

  // Insert Products
  const insertProduct = db.prepare(`
    INSERT INTO products (sku, name, category_id, brand, description, image_url, selling_price, cost_price, tax_pct, stock_quantity, low_stock_threshold, supplier_name)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const prod1 = insertProduct.run('PROD-RKT-001', 'Wilson Pro Staff 97 v14 Tennis Racket', catRackets.lastInsertRowid, 'Wilson', 'Precision graphite frame used by elite tour players. 315g unstrung.', 'https://images.unsplash.com/photo-1617083934555-563d41f0a202?auto=format&fit=crop&w=600&q=80', 269.0, 160.0, 5.0, 14, 3, 'Wilson Sports Global');
  const prod2 = insertProduct.run('PROD-RKT-002', 'Yonex Astrox 99 Pro Badminton Racket', catRackets.lastInsertRowid, 'Yonex', 'Head-heavy power offensive racket with Namd revolutionary graphite.', 'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?auto=format&fit=crop&w=600&q=80', 229.0, 135.0, 5.0, 8, 2, 'Yonex Distributors');
  const prod3 = insertProduct.run('PROD-BAL-001', 'Dunlop Fort All Court Tennis Balls (Can of 4)', catBalls.lastInsertRowid, 'Dunlop', 'Premium HD cloth pressurised championship tournament balls.', 'https://images.unsplash.com/photo-1595435934249-5df7ed86e1c0?auto=format&fit=crop&w=600&q=80', 12.0, 6.5, 5.0, 48, 10, 'Dunlop International');
  const prod4 = insertProduct.run('PROD-BAL-002', 'Yonex Aerosensa 30 Feather Shuttles (Dozen)', catBalls.lastInsertRowid, 'Yonex', 'Goose feather match-grade shuttles for pinpoint trajectory.', 'https://images.unsplash.com/photo-1613918108466-292b78a8ef95?auto=format&fit=crop&w=600&q=80', 38.0, 22.0, 5.0, 25, 5, 'Yonex Distributors');
  const prod5 = insertProduct.run('PROD-SHO-001', 'Asics Gel-Resolution 9 Clay Court Shoes', catShoes.lastInsertRowid, 'Asics', 'Dynawall support and Gel cushioning for rapid baseline pivots.', 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=600&q=80', 145.0, 85.0, 5.0, 6, 2, 'Asics Performance Group');
  const prod6 = insertProduct.run('PROD-ACC-001', 'Wilson Pro Comfort Overgrip (Pack of 3)', catAccessories.lastInsertRowid, 'Wilson', 'Super tacky, moisture-absorbing felt overgrip.', 'https://images.unsplash.com/photo-1554068865-24cecd4e34b8?auto=format&fit=crop&w=600&q=80', 9.5, 4.0, 5.0, 3, 5, 'Wilson Sports Global'); // Low stock!
  const prod7 = insertProduct.run('PROD-APP-001', 'Champions Club Premium DryFit Polo', catApparel.lastInsertRowid, 'Champions Club', 'Club embroidered breathable athletic polo with UV 50+ protection.', 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=600&q=80', 45.0, 18.0, 5.0, 32, 8, 'Custom Athletics Co');
  const prod8 = insertProduct.run('PROD-ACC-002', 'HydroClub Stainless Thermal Water Bottle 1L', catAccessories.lastInsertRowid, 'Champions Club', 'Double-wall vacuum insulated flask keeping liquids ice cold for 24h.', 'https://images.unsplash.com/photo-1602143407151-7111542de6e8?auto=format&fit=crop&w=600&q=80', 28.0, 11.0, 5.0, 2, 5, 'HydroCraft'); // Low stock!

  // Record initial inventory transactions
  const insertInvTx = db.prepare(`
    INSERT INTO inventory_transactions (product_id, change_qty, balance_after, transaction_type, reference_id, notes, created_by_user_id)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  insertInvTx.run(prod1.lastInsertRowid, 14, 14, 'restock', 'PO-9001', 'Initial stock intake', userMap['shop@championsclub.demo']);
  insertInvTx.run(prod6.lastInsertRowid, 3, 3, 'restock', 'PO-9002', 'Initial stock intake (low)', userMap['shop@championsclub.demo']);

  // Insert Bar Tables (10 tables)
  const insertTable = db.prepare(`
    INSERT INTO bar_tables (table_number, name, capacity, status)
    VALUES (?, ?, ?, ?)
  `);
  for (let i = 1; i <= 10; i++) {
    const status = i === 3 ? 'Occupied' : i === 7 ? 'Reserved' : 'Available';
    insertTable.run(`T-${i < 10 ? '0' + i : i}`, `Club Lounge Table ${i}`, i % 3 === 0 ? 6 : 4, status);
  }

  // Insert Bar Menu Items
  const insertMenuItem = db.prepare(`
    INSERT INTO bar_menu_items (name, category, price, description, image_url)
    VALUES (?, ?, ?, ?, ?)
  `);

  insertMenuItem.run('Artisanal Single-Origin Espresso', 'Coffee', 3.80, 'Double shot rich hazelnut crema blend.', 'https://images.unsplash.com/photo-1510591509098-f4fdc6d0ff04?auto=format&fit=crop&w=400&q=80');
  insertMenuItem.run('Cold Brew Nitro Tonic', 'Coffee', 4.90, 'Slow steeped 18-hour cold brew infused with organic tonic.', 'https://images.unsplash.com/photo-1517701604599-bb29b565090c?auto=format&fit=crop&w=400&q=80');
  insertMenuItem.run('Recovery Whey & Berry Protein Shake', 'Smoothies', 7.50, '30g whey isolate, mixed forest berries, almond butter, honey.', 'https://images.unsplash.com/photo-1553530666-ba11a7da3888?auto=format&fit=crop&w=400&q=80');
  insertMenuItem.run('Cold-Pressed Citrus Electrolyte Juice', 'Cold Drinks', 6.00, 'Fresh Valencia orange, pink grapefruit, lime, Celtic sea salt.', 'https://images.unsplash.com/photo-1613478223719-2ab802602423?auto=format&fit=crop&w=400&q=80');
  insertMenuItem.run('Signature Clubhouse Triple Decker Sandwich', 'Sandwiches', 14.50, 'Smoked turkey breast, crispy bacon, avocado, aged cheddar, herb mayo.', 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?auto=format&fit=crop&w=400&q=80');
  insertMenuItem.run('Prime Black Angus Brioche Burger', 'Mains', 17.50, '200g smashed patty, caramelized onions, house relish, pickles.', 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=400&q=80');
  insertMenuItem.run('Parmesan & Truffle Herb Fries', 'Snacks', 8.50, 'Crispy russet fries tossed in white truffle oil and fresh parmigiano.', 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?auto=format&fit=crop&w=400&q=80');
  insertMenuItem.run('Brazilian Acai Energy Bowl', 'Snacks', 11.00, 'Organic pure acai with chia seeds, banana slices, and toasted granola.', 'https://images.unsplash.com/photo-1590301157890-4810ed352733?auto=format&fit=crop&w=400&q=80');

  // Insert a current open Bar Tab on Table 3
  const insertBarOrder = db.prepare(`
    INSERT INTO bar_orders (order_number, table_id, user_id, member_id, customer_name, is_tab, subtotal, discount_amount, tax_amount, total_amount, payment_status, kitchen_status, status, staff_user_id)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const barOrder1 = insertBarOrder.run('BAR-TAB-301', 3, userMap['member@championsclub.demo'], m1.lastInsertRowid, 'Alexander Wright (T-03)', 1, 32.0, 4.8, 1.36, 28.56, 'Pending', 'PREPARING', 'Open', userMap['bar@championsclub.demo']);
  db.prepare('UPDATE bar_tables SET current_tab_id = ? WHERE id = 3').run(barOrder1.lastInsertRowid);

  const insertBarItem = db.prepare(`
    INSERT INTO bar_order_items (bar_order_id, item_name, category, unit_price, quantity, notes, kitchen_status)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  insertBarItem.run(barOrder1.lastInsertRowid, 'Prime Black Angus Brioche Burger', 'Mains', 17.50, 1, 'Medium rare, no pickles', 'PREPARING');
  insertBarItem.run(barOrder1.lastInsertRowid, 'Recovery Whey & Berry Protein Shake', 'Smoothies', 7.50, 1, 'Extra protein', 'READY');
  insertBarItem.run(barOrder1.lastInsertRowid, 'Parmesan & Truffle Herb Fries', 'Snacks', 8.50, 1, 'Extra dipping sauce', 'PREPARING');

  // Insert HR Employees
  const insertEmp = db.prepare(`
    INSERT INTO employees (emp_code, user_id, name, email, phone, department, role, joining_date, salary, employment_status, emergency_contact)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const empCoach = insertEmp.run('EMP-01', userMap['coach@championsclub.demo'], 'Marcus Vance', 'coach@championsclub.demo', '+1 555-0103', 'Coaching', 'Head Coach', '2023-01-15', 5800.0, 'Active', 'Helen Vance (+1 555-8101)');
  const empFront = insertEmp.run('EMP-02', userMap['frontdesk@championsclub.demo'], 'Sarah Jenkins', 'frontdesk@championsclub.demo', '+1 555-0102', 'Front Desk', 'Guest Services Lead', '2023-04-01', 4200.0, 'Active', 'Tom Jenkins (+1 555-8102)');
  const empShop = insertEmp.run('EMP-03', userMap['shop@championsclub.demo'], 'Maya Patel', 'shop@championsclub.demo', '+1 555-0104', 'Shop', 'Retail Lead', '2023-06-10', 4300.0, 'Active', 'Arun Patel (+1 555-8103)');
  const empBar = insertEmp.run('EMP-04', userMap['bar@championsclub.demo'], 'Liam O\'Connor', 'bar@championsclub.demo', '+1 555-0105', 'Bar/Cafeteria', 'Hospitality Lead', '2023-07-20', 4200.0, 'Active', 'Tara O\'Connor (+1 555-8104)');
  const empFin = insertEmp.run('EMP-05', userMap['finance@championsclub.demo'], 'David Chen', 'finance@championsclub.demo', '+1 555-0106', 'Finance', 'Finance Manager', '2022-11-01', 6500.0, 'Active', 'Grace Chen (+1 555-8105)');
  const empHR = insertEmp.run('EMP-06', userMap['hr@championsclub.demo'], 'Rachel Adams', 'hr@championsclub.demo', '+1 555-0107', 'HR', 'HR Director', '2022-09-15', 6400.0, 'Active', 'Sam Adams (+1 555-8106)');

  // Shifts for today
  const insertShift = db.prepare(`
    INSERT INTO shifts (employee_id, date, start_time, end_time, clock_in, clock_out, status, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  insertShift.run(empFront.lastInsertRowid, todayStr, '07:30', '15:30', '07:25', null, 'Active', 'Morning desk coverage');
  insertShift.run(empCoach.lastInsertRowid, todayStr, '09:00', '17:00', '08:50', null, 'Active', 'Private clinics & afternoon social');
  insertShift.run(empBar.lastInsertRowid, todayStr, '11:00', '19:00', '10:55', null, 'Active', 'Lunch rush and evening lounge');
  insertShift.run(empShop.lastInsertRowid, todayStr, '10:00', '18:00', '09:58', null, 'Active', 'Inventory count and customer fits');

  // Leave Requests
  const insertLeave = db.prepare(`
    INSERT INTO leave_requests (employee_id, leave_type, start_date, end_date, reason, status)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  insertLeave.run(empCoach.lastInsertRowid, 'Casual', '2026-10-15', '2026-10-17', 'Attending National Tennis Coaching Symposium', 'Pending');
  insertLeave.run(empBar.lastInsertRowid, 'Sick', '2026-09-20', '2026-09-21', 'Dental emergency recovery', 'Approved');

  // CRM Enquiries
  const insertEnquiry = db.prepare(`
    INSERT INTO customer_enquiries (enquiry_code, name, phone, email, source, interested_sport, membership_interest, preferred_date, message, status, assigned_staff_id, follow_up_date)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  insertEnquiry.run('ENQ-5001', 'James Sterling', '+1 555-3311', 'james.s@example.com', 'Website Trial', 'Tennis', 'Gold Championship', todayStr, 'Looking for private coaching and weekend court times for two people.', 'Trial Scheduled', userMap['frontdesk@championsclub.demo'], todayStr);
  insertEnquiry.run('ENQ-5002', 'Sophia Lin', '+1 555-3312', 'sophia.l@example.com', 'Website Contact', 'Badminton', 'Silver Club', null, 'Inquiring about junior weekend academy for 12yo daughter.', 'Contacted', userMap['frontdesk@championsclub.demo'], expSoonDateStr);
  insertEnquiry.run('ENQ-5003', 'Daniel Cooper', '+1 555-3313', 'daniel.c@example.com', 'Walk-in', 'Cricket', 'Gold Championship', null, 'Interested in automated bowling machine lane packages.', 'New', null, null);

  // Invoices & Expenses
  const insertInvoice = db.prepare(`
    INSERT INTO invoices (invoice_number, customer_name, customer_email, customer_phone, member_id, invoice_type, issue_date, due_date, subtotal, tax_amount, total_amount, paid_amount, status, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const inv1 = insertInvoice.run('INV-2026-8801', 'Alexander Wright', 'member@championsclub.demo', '+1 555-0201', m1.lastInsertRowid, 'membership', todayStr, todayStr, 149.0, 7.45, 156.45, 156.45, 'Paid', 'Annual renewal instalment');
  const inv2 = insertInvoice.run('INV-2026-8802', 'Apex Corporate League', 'events@apexcorp.com', '+1 555-9000', null, 'event', todayStr, expSoonDateStr, 1200.0, 60.0, 1260.0, 500.0, 'Partially Paid', 'Weekend corporate tournament deposit');

  const insertInvItem = db.prepare(`
    INSERT INTO invoice_items (invoice_id, description, quantity, unit_price, total_price)
    VALUES (?, ?, ?, ?, ?)
  `);
  insertInvItem.run(inv1.lastInsertRowid, 'Gold Championship Membership - 1 Month', 1, 149.0, 149.0);
  insertInvItem.run(inv2.lastInsertRowid, 'Court Hire (4 Courts x 4 Hours)', 16, 75.0, 1200.0);

  // Expenses
  const insertExpense = db.prepare(`
    INSERT INTO expenses (expense_number, vendor_name, category, amount, tax_amount, payment_method, date, notes, created_by_user_id)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  insertExpense.run('EXP-2026-101', 'Red Clay Surface Supplies', 'Maintenance', 450.0, 22.5, 'Bank Transfer', todayStr, 'Clay rolling and top dressing bags for Court 1', userMap['finance@championsclub.demo']);
  insertExpense.run('EXP-2026-102', 'Metro Power & Utility Co', 'Utilities', 1280.0, 64.0, 'Direct Debit', pastDateStr, 'Monthly floodlight electricity and heating', userMap['finance@championsclub.demo']);
  insertExpense.run('EXP-2026-103', 'Fresh Roast Specialty Beans', 'Food supplies', 340.0, 0.0, 'Card', todayStr, '20kg Colombian Espresso beans for cafeteria', userMap['finance@championsclub.demo']);

  // Notifications
  const insertNotification = db.prepare(`
    INSERT INTO notifications (user_id, role_target, title, message, type, is_read, link_url)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  insertNotification.run(userMap['member@championsclub.demo'], 'member', 'Court Booking Confirmed', 'Your reservation on Tennis Court 1 for today at 10:00 AM is confirmed.', 'booking', 0, '/member/bookings');
  insertNotification.run(null, 'admin', 'Low Inventory Alert', 'Wilson Pro Comfort Overgrip has only 3 units remaining (threshold: 5).', 'warning', 0, '/shop/inventory');
  insertNotification.run(null, 'frontdesk', 'New Trial Enquiry', 'James Sterling requested a Tennis trial session for today.', 'info', 0, '/frontdesk/enquiries');
  insertNotification.run(userMap['expired.member@championsclub.demo'], 'member', 'Membership Expired', 'Your Silver Club Membership expired last month. Please renew to resume court booking privileges.', 'expiry', 0, '/member/membership');

  // Audit Logs
  const insertAudit = db.prepare(`
    INSERT INTO audit_logs (user_id, user_email, role, action, entity, entity_id, metadata)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  insertAudit.run(userMap['owner@championsclub.demo'], 'owner@championsclub.demo', 'admin', 'SYSTEM_INIT', 'SYSTEM', '1', '{"message":"Fresh club operating system seeded and initialized"}');
  insertAudit.run(userMap['member@championsclub.demo'], 'member@championsclub.demo', 'member', 'BOOKING_CREATE', 'court_bookings', '1', '{"court":"Tennis Court 1","slot":"10:00"}');

  // Club Settings
  const insertSetting = db.prepare(`
    INSERT INTO club_settings (key, value, description)
    VALUES (?, ?, ?)
  `);

  insertSetting.run('club_name', 'The Champions Club', 'Official name of the sports club');
  insertSetting.run('club_tagline', 'The Club Where Champions Play', 'Public hero tagline');
  insertSetting.run('club_phone', '+1 (555) 242-6746', 'Reception contact number');
  insertSetting.run('club_email', 'concierge@championsclub.demo', 'Public inquiries email');
  insertSetting.run('club_address', '450 Champions Way, Grand Sports Enclave, CA 90210', 'Physical club address');
  insertSetting.run('operating_hours', 'Mon - Sun: 06:00 AM - 11:00 PM', 'Daily facility hours');
  insertSetting.run('cancellation_cutoff_hours', '4', 'Hours before booking start time allowed for member refund/cancellation');
  insertSetting.run('currency_symbol', '$', 'Currency symbol');
  insertSetting.run('tax_rate_pct', '5', 'Standard sales tax percent');

  console.log('Seeding completed successfully!');
}

if (require.main === module) {
  seedDatabase();
}

module.exports = { seedDatabase };
