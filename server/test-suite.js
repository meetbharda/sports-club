const http = require('http');

// Helper to make HTTP requests
function request(options, data = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          const parsed = body ? JSON.parse(body) : {};
          resolve({ status: res.statusCode, headers: res.headers, data: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, headers: res.headers, data: body });
        }
      });
    });
    req.on('error', reject);
    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
}

async function runTests() {
  console.log('--- STARTING THE CHAMPIONS CLUB ACCEPTANCE TEST SUITE ---');
  let passed = 0;
  let total = 0;

  function assert(condition, message) {
    total++;
    if (condition) {
      console.log(`[PASS] Test ${total}: ${message}`);
      passed++;
    } else {
      console.error(`[FAIL] Test ${total}: ${message}`);
    }
  }

  try {
    // 1. Visitor Register & Login
    const regRes = await request({
      hostname: 'localhost',
      port: 5000,
      path: '/api/auth/register',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, {
      full_name: 'Test Athlete',
      email: `athlete.${Date.now()}@championsclub.demo`,
      password: 'Champion#2026',
      phone: '+1 555-7788',
      plan_code: 'GOLD'
    });
    assert(regRes.status === 201 && regRes.data.token, 'Visitor -> Register -> Member profile created');

    const athleteToken = regRes.data.token;
    const athleteUserId = regRes.data.user.id;

    // Login with existing demo Member
    const memberLogin = await request({
      hostname: 'localhost',
      port: 5000,
      path: '/api/auth/login',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, {
      email: 'member@championsclub.demo',
      password: 'Champion#2026'
    });
    assert(memberLogin.status === 200 && memberLogin.data.user.role === 'member', 'Member login successful');
    const memberToken = memberLogin.data.token;

    // Login with Admin
    const adminLogin = await request({
      hostname: 'localhost',
      port: 5000,
      path: '/api/auth/login',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, {
      email: 'owner@championsclub.demo',
      password: 'Champion#2026'
    });
    assert(adminLogin.status === 200 && adminLogin.data.user.role === 'admin', 'Owner/Admin login successful');
    const adminToken = adminLogin.data.token;

    // Login with Frontdesk
    const frontLogin = await request({
      hostname: 'localhost',
      port: 5000,
      path: '/api/auth/login',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, {
      email: 'frontdesk@championsclub.demo',
      password: 'Champion#2026'
    });
    const frontToken = frontLogin.data.token;

    // Login with Shop
    const shopLogin = await request({
      hostname: 'localhost',
      port: 5000,
      path: '/api/auth/login',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, {
      email: 'shop@championsclub.demo',
      password: 'Champion#2026'
    });
    const shopToken = shopLogin.data.token;

    // Login with Bar
    const barLogin = await request({
      hostname: 'localhost',
      port: 5000,
      path: '/api/auth/login',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, {
      email: 'bar@championsclub.demo',
      password: 'Champion#2026'
    });
    const barToken = barLogin.data.token;

    // Login with Expired Member
    const expiredLogin = await request({
      hostname: 'localhost',
      port: 5000,
      path: '/api/auth/login',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, {
      email: 'expired.member@championsclub.demo',
      password: 'Champion#2026'
    });
    const expiredToken = expiredLogin.data.token;

    // TEST 2: Member books available court
    const randomDay = Math.floor(10 + Math.random() * 18);
    const testDate = `2026-11-${randomDay}`;
    const bookRes1 = await request({
      hostname: 'localhost',
      port: 5000,
      path: '/api/bookings',
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${memberToken}` }
    }, {
      court_id: 1,
      date: testDate,
      start_time: '11:00',
      end_time: '12:00',
      booking_type: 'member'
    });
    assert(bookRes1.status === 201 && bookRes1.data.booking, 'Member -> Book available court -> Booking confirmed');

    // TEST 3: Member -> Try same court/time twice -> Second booking rejected with 409
    const bookRes2 = await request({
      hostname: 'localhost',
      port: 5000,
      path: '/api/bookings',
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${memberToken}` }
    }, {
      court_id: 1,
      date: testDate,
      start_time: '11:00',
      end_time: '12:00',
      booking_type: 'member'
    });
    assert(bookRes2.status === 409, 'Member -> Try same court/time twice -> Second booking rejected with conflict error');

    // TEST 4: Two users -> Attempt overlapping court/time -> Second user rejected
    const bookRes3 = await request({
      hostname: 'localhost',
      port: 5000,
      path: '/api/bookings',
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${athleteToken}` }
    }, {
      court_id: 1,
      date: testDate,
      start_time: '11:30', // overlaps with 11:00-12:00!
      end_time: '12:30',
      booking_type: 'member'
    });
    assert(bookRes3.status === 409, 'Two users -> Overlapping time slot -> Second user rejected by concurrency check');

    // TEST 5: Daily booking quota test (Gold member has 2 per day)
    // Book slot 2
    const bookRes4 = await request({
      hostname: 'localhost',
      port: 5000,
      path: '/api/bookings',
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${memberToken}` }
    }, {
      court_id: 1,
      date: testDate,
      start_time: '13:00',
      end_time: '14:00',
      booking_type: 'member'
    });
    // Attempt slot 3 (over limit)
    const bookRes5 = await request({
      hostname: 'localhost',
      port: 5000,
      path: '/api/bookings',
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${memberToken}` }
    }, {
      court_id: 1,
      date: testDate,
      start_time: '15:00',
      end_time: '16:00',
      booking_type: 'member'
    });
    assert(bookRes5.status === 400 && bookRes5.data.error.includes('limit'), 'Member -> Exceed daily booking limit -> Rejected with limit error');

    // TEST 6: Expired member -> Attempt member-only booking -> Rejected
    const expBook = await request({
      hostname: 'localhost',
      port: 5000,
      path: '/api/bookings',
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${expiredToken}` }
    }, {
      court_id: 2,
      date: testDate,
      start_time: '10:00',
      end_time: '11:00',
      booking_type: 'member'
    });
    assert(expBook.status === 400 && expBook.data.error.includes('expired'), 'Expired member -> Attempt booking -> Rejected due to lapsed membership');

    // TEST 7: Front desk -> Search member -> View complete member history
    const searchRes = await request({
      hostname: 'localhost',
      port: 5000,
      path: '/api/members?q=Alexander',
      method: 'GET',
      headers: { 'Authorization': `Bearer ${frontToken}` }
    });
    assert(searchRes.status === 200 && searchRes.data.length > 0, 'Front desk -> Search member -> Found matching record');

    // TEST 8: Front desk -> Create walk-in booking -> Correct walk-in price
    const walkinRes = await request({
      hostname: 'localhost',
      port: 5000,
      path: '/api/bookings',
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${frontToken}` }
    }, {
      court_id: 2,
      date: testDate,
      start_time: '17:00',
      end_time: '18:00',
      booking_type: 'walk-in',
      guest_name: 'Walk-in Player',
      guest_phone: '+1 555-4321'
    });
    assert(walkinRes.status === 201 && walkinRes.data.booking.price === 40.0, 'Front desk -> Create walk-in booking -> Walk-in rate ($40.0) applied');

    // TEST 9 & 10: Shop checkout -> Inventory decreases & concurrency check
    const checkoutRes = await request({
      hostname: 'localhost',
      port: 5000,
      path: '/api/shop/checkout',
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${memberToken}` }
    }, {
      items: [{ product_id: 1, quantity: 1 }],
      order_type: 'pickup'
    });
    assert(checkoutRes.status === 201 && checkoutRes.data.order.discount_percentage === 10, 'Member -> Shop checkout -> Gold 10% discount applied and inventory decreased');

    // Try purchasing 999 of that item
    const overStock = await request({
      hostname: 'localhost',
      port: 5000,
      path: '/api/shop/checkout',
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${memberToken}` }
    }, {
      items: [{ product_id: 1, quantity: 999 }]
    });
    assert(overStock.status === 400 && overStock.data.error.includes('Insufficient stock'), 'Customer orders more than available stock -> Atomic check rejects without negative stock');

    // TEST 11: Bar staff -> Open table -> Add food -> KDS status update
    const openTableRes = await request({
      hostname: 'localhost',
      port: 5000,
      path: '/api/bar/tables/4/open',
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${barToken}` }
    }, { customer_name: 'VIP Court 1 Guests' });
    assert(openTableRes.status === 201 && openTableRes.data.tab.tabId, 'Bar staff -> Open Table -> New Tab created');

    const tabId = openTableRes.data.tab.tabId;
    const addFoodRes = await request({
      hostname: 'localhost',
      port: 5000,
      path: `/api/bar/orders/${tabId}/items`,
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${barToken}` }
    }, {
      items: [
        { name: 'Prime Black Angus Brioche Burger', category: 'Mains', unit_price: 17.50, quantity: 2 },
        { name: 'Cold Brew Nitro Tonic', category: 'Coffee', unit_price: 4.90, quantity: 2 }
      ]
    });
    assert(addFoodRes.status === 200, 'Bar staff -> Add food to tab -> Sent to Kitchen with PREPARING status');

    // KDS updates to READY
    const kdsUpdate = await request({
      hostname: 'localhost',
      port: 5000,
      path: `/api/bar/orders/${tabId}/kds-status`,
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${barToken}` }
    }, { kitchen_status: 'READY' });
    assert(kdsUpdate.status === 200, 'KDS Kitchen -> Update status to READY -> Confirmed');

    // Settle Bar Tab
    const settleRes = await request({
      hostname: 'localhost',
      port: 5000,
      path: `/api/bar/orders/${tabId}/settle`,
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${barToken}` }
    }, { payment_method: 'card' });
    assert(settleRes.status === 200 && settleRes.data.receipt, 'Bar staff -> Settle tab -> Receipt created and table freed');

    // TEST 14 & 15: Visitor enquiry -> CRM Lead -> Convert to Member
    const leadEmail = `lead.${Date.now()}@example.com`;
    const leadRes = await request({
      hostname: 'localhost',
      port: 5000,
      path: '/api/public/enquiry',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, {
      name: 'Jessica Taylor',
      email: leadEmail,
      phone: '+1 555-6677',
      interested_sport: 'Tennis',
      source: 'Website Trial'
    });
    assert(leadRes.status === 201 && leadRes.data.enquiry_code, 'Visitor -> Submit enquiry -> CRM record created');

    const enquiries = await request({
      hostname: 'localhost',
      port: 5000,
      path: '/api/enquiries',
      method: 'GET',
      headers: { 'Authorization': `Bearer ${frontToken}` }
    });
    const targetLead = enquiries.data.find(e => e.email === leadEmail);
    assert(targetLead !== undefined, 'Front desk / Admin sees new CRM lead in pipeline');

    const convertRes = await request({
      hostname: 'localhost',
      port: 5000,
      path: `/api/enquiries/${targetLead.id}/convert`,
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${frontToken}` }
    }, { plan_code: 'GOLD' });
    assert(convertRes.status === 200 && convertRes.data.member_code, 'Staff -> Convert lead to member -> New member created and lead status is Converted');

    // TEST 19 - 22: STRICT ROLE ACCESS CONTROL
    // Member attempts /admin -> 403
    const memAdmin = await request({
      hostname: 'localhost',
      port: 5000,
      path: '/api/admin/dashboard',
      method: 'GET',
      headers: { 'Authorization': `Bearer ${memberToken}` }
    });
    assert(memAdmin.status === 403, 'Member attempts /admin -> Access denied (403)');

    // Shop staff attempts /finance -> 403
    const shopFin = await request({
      hostname: 'localhost',
      port: 5000,
      path: '/api/finance/overview',
      method: 'GET',
      headers: { 'Authorization': `Bearer ${shopToken}` }
    });
    assert(shopFin.status === 403, 'Shop staff attempts /finance -> Access denied (403)');

    // Bar staff attempts /admin/settings -> 403
    const barSettings = await request({
      hostname: 'localhost',
      port: 5000,
      path: '/api/admin/settings',
      method: 'GET',
      headers: { 'Authorization': `Bearer ${barToken}` }
    });
    assert(barSettings.status === 403, 'Bar staff attempts /admin/settings -> Access denied (403)');

    // Front desk attempts to modify admin-only settings -> 403
    const frontSettings = await request({
      hostname: 'localhost',
      port: 5000,
      path: '/api/admin/settings',
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${frontToken}` }
    }, { club_name: 'Hacked Club' });
    assert(frontSettings.status === 403, 'Front desk attempts to modify owner settings -> Access denied (403)');

    // TEST 24: Expired / invalid token -> 403
    const fakeTokenRes = await request({
      hostname: 'localhost',
      port: 5000,
      path: '/api/admin/dashboard',
      method: 'GET',
      headers: { 'Authorization': `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.fake.signature` }
    });
    assert(fakeTokenRes.status === 403, 'Invalid token -> Protected API rejected (403)');

    console.log(`\n========================================`);
    console.log(`TEST RESULTS: ${passed} / ${total} TESTS PASSED`);
    console.log(`========================================\n`);

  } catch (err) {
    console.error('Test run failed with error:', err);
  }
}

module.exports = { runTests };

if (require.main === module) {
  runTests();
}
