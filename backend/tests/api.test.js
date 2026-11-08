import test from 'node:test';
import assert from 'node:assert/strict';
import request from 'http';
import app from '../src/app.js';
import server from '../src/server.js';
import { db } from '../src/config/database.js';
import { ROLES, BOOKING_STATUS, PAYMENT_STATUS, SLOT_STATUS } from '../src/config/constants.js';

// Helper function to make HTTP requests against the running Express app
function apiRequest(method, path, body = null, token = null) {
  return new Promise((resolve, reject) => {
    const payload = body ? JSON.stringify(body) : null;
    const req = request.request(
      {
        host: '127.0.0.1',
        port: 5000,
        path,
        method,
        headers: {
          'Content-Type': 'application/json',
          ...(payload && { 'Content-Length': Buffer.byteLength(payload) }),
          ...(token && { Authorization: `Bearer ${token}` })
        }
      },
      (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          try {
            const parsed = data ? JSON.parse(data) : {};
            resolve({ status: res.statusCode, body: parsed });
          } catch (e) {
            resolve({ status: res.statusCode, raw: data });
          }
        });
      }
    );
    req.on('error', reject);
    if (payload) req.write(payload);
    req.end();
  });
}

test('SCRIMS Platform Complete Test Suite (Dynamic SuperAdmin Managed)', async (t) => {
  if (!server.listening) {
    await new Promise(resolve => server.listen(5000, '127.0.0.1', resolve));
  }
  let playerToken = '';
  let teamLeaderToken = '';
  let matchMasterToken = '';
  let scoreMasterToken = '';
  let adminToken = '';
  let activeTournamentId = '';
  let mmUserId = '';
  let smUserId = '';

  await t.test('1. Authentication Tests', async (t) => {
    // 1.1 Health Check
    const health = await apiRequest('GET', '/api/health');
    assert.equal(health.status, 200);
    assert.equal(health.body.status, 'ONLINE');

    // 1.2 Login with Super Admin (Kuldeep Gade) via email
    const adminLogin = await apiRequest('POST', '/api/auth/login', {
      email: 'gadekuldeep26@gmail.com',
      password: 'Password@123'
    });
    assert.equal(adminLogin.status, 200);
    assert.ok(adminLogin.body.token);
    assert.equal(adminLogin.body.user.role, ROLES.SUPER_ADMIN);
    assert.equal(adminLogin.body.user.full_name, 'Kuldeep Gade');
    adminToken = adminLogin.body.token;

    // 1.3 Login with Super Admin via Mobile Number
    const mobileLogin = await apiRequest('POST', '/api/auth/login', {
      identifier: '919309381367',
      password: 'Password@123'
    });
    assert.equal(mobileLogin.status, 200);
    assert.equal(mobileLogin.body.user.email, 'gadekuldeep26@gmail.com');

    // 1.4 Register a Player account
    const newPlayer = await apiRequest('POST', '/api/auth/register', {
      username: 'Shadow_Sniper',
      full_name: 'Karan Patel',
      email: 'player@scrims.gg',
      password: 'Password@123',
      mobile_number: '+919876543212',
      in_game_id: '5120938472',
      role: 'PLAYER'
    });
    assert.equal(newPlayer.status, 201);
    assert.equal(newPlayer.body.user.role, ROLES.PLAYER);
    playerToken = newPlayer.body.token;

    // 1.5 Register a Team Leader account
    const newTL = await apiRequest('POST', '/api/auth/register', {
      username: 'V01D_G4MER',
      full_name: 'Aditya Verma',
      email: 'igl@scrims.gg',
      password: 'Password@123',
      mobile_number: '+919876543211',
      in_game_id: '5149823419',
      role: 'TEAM_LEADER'
    });
    assert.equal(newTL.status, 201);
    teamLeaderToken = newTL.body.token;

    // 1.6 Register staff and promote via Super Admin
    const mmUser = await apiRequest('POST', '/api/auth/register', {
      username: 'Vikram_Ops',
      full_name: 'Vikram Singh',
      email: 'vikram@scrims.gg',
      password: 'Password@123',
      mobile_number: '+919876543210',
      role: 'PLAYER'
    });
    mmUserId = mmUser.body.user.id;
    await apiRequest('PUT', `/api/admin/users/${mmUserId}/role`, { role: ROLES.MATCH_MASTER }, adminToken);
    const mmLogin = await apiRequest('POST', '/api/auth/login', { email: 'vikram@scrims.gg', password: 'Password@123' });
    matchMasterToken = mmLogin.body.token;
    assert.equal(mmLogin.body.user.role, ROLES.MATCH_MASTER);

    const smUser = await apiRequest('POST', '/api/auth/register', {
      username: 'Rohan_ScoreOps',
      full_name: 'Rohan Sharma',
      email: 'rohan@scrims.gg',
      password: 'Password@123',
      mobile_number: '+919876543215',
      role: 'PLAYER'
    });
    smUserId = smUser.body.user.id;
    await apiRequest('PUT', `/api/admin/users/${smUserId}/role`, { role: ROLES.SCORE_MASTER }, adminToken);
    const smLogin = await apiRequest('POST', '/api/auth/login', { email: 'rohan@scrims.gg', password: 'Password@123' });
    scoreMasterToken = smLogin.body.token;
    assert.equal(smLogin.body.user.role, ROLES.SCORE_MASTER);

    // 1.7 Invalid credentials test
    const invalidLogin = await apiRequest('POST', '/api/auth/login', {
      email: 'player@scrims.gg',
      password: 'WrongPassword999'
    });
    assert.equal(invalidLogin.status, 401);
    assert.equal(invalidLogin.body.success, false);
  });

  await t.test('2. Authorization & Role Separation Tests', async (t) => {
    // 2.1 Player cannot access Super Admin executive stats
    const unauthorizedAdminAccess = await apiRequest('GET', '/api/admin/stats', null, playerToken);
    assert.equal(unauthorizedAdminAccess.status, 403);

    // 2.2 Super Admin creates a new tournament
    const tournRes = await apiRequest('POST', '/api/tournaments', {
      title: 'BGMI Master Championship — Series 1',
      game_id: 'bgmi',
      entry_fee: 1200,
      start_time_ist: '09:00 PM IST',
      end_time_ist: '11:00 PM IST',
      tournament_date: new Date().toISOString().split('T')[0]
    }, adminToken);
    assert.equal(tournRes.status, 201);
    assert.ok(tournRes.body.tournament.id);
    activeTournamentId = tournRes.body.tournament.id;

    // 2.3 Super Admin assigns Match Master and Score Master to the tournament
    const staffRes = await apiRequest('PUT', `/api/admin/tournaments/${activeTournamentId}/staff`, {
      match_master_id: mmUserId,
      score_master_id: smUserId
    }, adminToken);
    assert.equal(staffRes.status, 200);
  });

  await t.test('3. Slot Booking & Concurrency Tests', async (t) => {
    // 3.1 Fetch current slots for newly created tournament
    const slotsRes = await apiRequest('GET', `/api/tournaments/${activeTournamentId}/slots`);
    assert.equal(slotsRes.status, 200);
    assert.equal(slotsRes.body.slots.length, 16);

    // 3.2 Player reserves Slot #1 in tournament
    const holdRes = await apiRequest('POST', '/api/bookings', {
      tournament_id: activeTournamentId,
      slot_number: 1,
      team_name: 'Shadow Snipe Squad'
    }, playerToken);
    assert.equal(holdRes.status, 201);
    assert.ok(holdRes.body.booking.booking_reference.startsWith('SCRIM-'));

    // 3.3 Try booking already held/booked slot -> must fail
    const duplicateSlot = await apiRequest('POST', '/api/bookings', {
      tournament_id: activeTournamentId,
      slot_number: 1,
      team_name: 'Second Squad'
    }, teamLeaderToken);
    assert.ok([400, 409].includes(duplicateSlot.status));

    // 3.4 Duplicate booking in same tournament by same user should be blocked
    const duplicateUser = await apiRequest('POST', '/api/bookings', {
      tournament_id: activeTournamentId,
      slot_number: 2
    }, playerToken);
    assert.equal(duplicateUser.status, 400);
  });

  await t.test('4. Payment Verification Tests', async (t) => {
    // 4.1 Match Master checks payments
    const paymentsRes = await apiRequest('GET', '/api/payments', null, matchMasterToken);
    assert.equal(paymentsRes.status, 200);
    assert.ok(Array.isArray(paymentsRes.body.payments));

    const pending = paymentsRes.body.payments.find(p => p.verification_status === PAYMENT_STATUS.UNDER_VERIFICATION);
    if (pending) {
      // 4.2 Rejection requires reason
      const emptyReject = await apiRequest('POST', `/api/payments/${pending.id}/reject`, {
        rejection_reason: ''
      }, matchMasterToken);
      assert.equal(emptyReject.status, 400);

      // 4.3 Verify payment by Match Master
      const verifyRes = await apiRequest('POST', `/api/payments/${pending.id}/verify`, {}, matchMasterToken);
      assert.equal(verifyRes.status, 200);
      assert.equal(verifyRes.body.payment.verification_status, PAYMENT_STATUS.VERIFIED);
    }
  });

  await t.test('5. Scoring & Leaderboard Tests', async (t) => {
    // 5.1 Score Master enters score
    const scoreRes = await apiRequest('POST', `/api/scores/${activeTournamentId}/score`, {
      map_name: 'Erangel',
      slot_number: 1,
      squad_name: 'Shadow Snipe Squad',
      kills: 12,
      placement: 1,
      reason: 'Official Map 1 Drop Complete'
    }, scoreMasterToken);

    assert.equal(scoreRes.status, 200);
    assert.equal(scoreRes.body.score.kills, 12);
    assert.equal(scoreRes.body.score.placement, 1);
    assert.equal(scoreRes.body.score.total_points, 22); // 12 + 10 = 22

    // 5.2 Fetch aggregate leaderboard
    const lbRes = await apiRequest('GET', `/api/scores/${activeTournamentId}/leaderboard`);
    assert.equal(lbRes.status, 200);
    assert.ok(lbRes.body.leaderboard.length > 0);
  });

  await t.test('6. Super Admin Financial Metrics Tests', async (t) => {
    const statsRes = await apiRequest('GET', '/api/admin/stats', null, adminToken);
    assert.equal(statsRes.status, 200);
    assert.ok(statsRes.body.stats.totalUsers >= 1);
  });

  // Close server when done
  server.close();
});
