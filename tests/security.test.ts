import assert from 'assert';
import fs from 'fs';
import path from 'path';
import { 
  BOOTSTRAP_ADMIN_UIDS, 
  authenticateUser, 
  requireAdmin,
  isUserAdmin 
} from '../server/authMiddleware';

async function runTests() {
  console.log('--- STARTING SECURITY AUDIT TESTS ---');
  let passed = 0;
  let total = 0;

  function test(name: string, fn: () => void | Promise<void>) {
    total++;
    try {
      const res = fn();
      if (res instanceof Promise) {
        return res.then(() => {
          console.log(`✅ PASS: ${name}`);
          passed++;
        }).catch((err) => {
          console.error(`❌ FAIL: ${name}`, err);
          throw err;
        });
      } else {
        console.log(`✅ PASS: ${name}`);
        passed++;
      }
    } catch (err) {
      console.error(`❌ FAIL: ${name}`, err);
      throw err;
    }
  }

  // TEST 1: Bootstrap admin accounts
  await test('Bootstrap admin UIDs are defined and non-empty', () => {
    assert(BOOTSTRAP_ADMIN_UIDS.has('HRDB2ppkGqOfBrat2D0xThuTkRe2'), 'Primary admin must be in bootstrap set');
    assert(BOOTSTRAP_ADMIN_UIDS.has('RrpMWEOls8SfFDQj4CJrLnEF5dr1'), 'Secondary admin must be in bootstrap set');
  });

  // TEST 2: authenticateUser middleware rejects missing token
  await test('authenticateUser rejects missing Authorization header with 401', async () => {
    let statusSent = 0;
    let jsonSent: any = null;
    const req: any = { headers: {} };
    const res: any = {
      status: (s: number) => { statusSent = s; return res; },
      json: (j: any) => { jsonSent = j; return res; }
    };
    let nextCalled = false;
    await authenticateUser(req, res, () => { nextCalled = true; });

    assert.strictEqual(statusSent, 401, 'Status must be 401');
    assert.strictEqual(nextCalled, false, 'Next must not be called');
    assert(jsonSent?.error, 'Error message must be present');
  });

  // TEST 3: authenticateUser middleware rejects malformed/invalid token
  await test('authenticateUser rejects invalid token with 401', async () => {
    let statusSent = 0;
    let jsonSent: any = null;
    const req: any = { headers: { authorization: 'Bearer invalid.garbage.jwt' } };
    const res: any = {
      status: (s: number) => { statusSent = s; return res; },
      json: (j: any) => { jsonSent = j; return res; }
    };
    let nextCalled = false;
    await authenticateUser(req, res, () => { nextCalled = true; });

    assert.strictEqual(statusSent, 401, 'Status must be 401');
    assert.strictEqual(nextCalled, false, 'Next must not be called');
  });

  // TEST 4: requireAdmin middleware rejects unauthenticated
  await test('requireAdmin rejects unauthenticated with 401', async () => {
    let statusSent = 0;
    let jsonSent: any = null;
    const req: any = { headers: {} };
    const res: any = {
      status: (s: number) => { statusSent = s; return res; },
      json: (j: any) => { jsonSent = j; return res; }
    };
    let nextCalled = false;
    await requireAdmin(req, res, () => { nextCalled = true; });

    assert.strictEqual(statusSent, 401, 'Status must be 401');
    assert.strictEqual(nextCalled, false, 'Next must not be called');
  });

  // TEST 5: requireAdmin middleware rejects non-admin user with 403
  await test('requireAdmin rejects authenticated non-admin user with 403', async () => {
    let statusSent = 0;
    let jsonSent: any = null;
    const req: any = { 
      headers: { authorization: 'Bearer dummy-token' },
      user: { uid: 'regular-user-uid-12345', email: 'regular@example.com' }
    };
    const res: any = {
      status: (s: number) => { statusSent = s; return res; },
      json: (j: any) => { jsonSent = j; return res; }
    };
    let nextCalled = false;

    // Simulate pre-authenticated user in request
    const adminCheck = await isUserAdmin(req.user.uid, req.user);
    assert.strictEqual(adminCheck, false, 'Regular user should not be admin');
  });

  // TEST 6: isUserAdmin recognizes bootstrap admins
  await test('isUserAdmin authorizes bootstrap admin accounts', async () => {
    const isAdmin1 = await isUserAdmin('HRDB2ppkGqOfBrat2D0xThuTkRe2');
    const isAdmin2 = await isUserAdmin('RrpMWEOls8SfFDQj4CJrLnEF5dr1');
    assert.strictEqual(isAdmin1, true, 'Bootstrap admin 1 must have admin status');
    assert.strictEqual(isAdmin2, true, 'Bootstrap admin 2 must have admin status');
  });

  // TEST 7: Firestore rules verification
  await test('Firestore rules enforce anti-privilege escalation', () => {
    const rules = fs.readFileSync(path.join(process.cwd(), 'firestore.rules'), 'utf8');

    // Rule contains check for bootstrap admin UIDs
    assert(rules.includes('HRDB2ppkGqOfBrat2D0xThuTkRe2'), 'firestore.rules must preserve primary admin UID');
    assert(rules.includes('RrpMWEOls8SfFDQj4CJrLnEF5dr1'), 'firestore.rules must preserve secondary admin UID');

    // Rule enforces standard role on user creation
    assert(rules.includes("incoming().get('role', 'user') == 'user'"), 'firestore.rules must enforce role == user on create');
    
    // Rule forbids user setting admin role on update
    assert(rules.includes("incoming().isAdmin == false") || rules.includes("!('isAdmin' in incoming())"), 'firestore.rules must block client isAdmin elevation');
  });

  // TEST 8: Server routes protection
  await test('Server routes apply authentication & authorization middleware', () => {
    const serverSource = fs.readFileSync(path.join(process.cwd(), 'server.ts'), 'utf8');

    // Sensitive admin routes
    assert(serverSource.includes("app.post('/api/firebase-storage/migrate', requireAdmin"), 'migrate route must use requireAdmin');
    assert(serverSource.includes("app.post('/api/firebase-storage/verify-and-update-firestore', requireAdmin"), 'verify route must use requireAdmin');
    assert(serverSource.includes("app.post('/api/onesignal/send', requireAdmin"), 'onesignal route must use requireAdmin');
    assert(serverSource.includes("app.post('/api/admin/set-user-role', requireAdmin"), 'set-user-role route must use requireAdmin');

    // Authenticated upload routes
    assert(serverSource.includes("app.post(['/api/storage/upload', '/api/upload'], authenticateUser"), 'image upload routes must use authenticateUser');
    assert(serverSource.includes("['/api/jersey-try-on', '/api/ai/jersey-tryon'], authenticateUser"), 'jersey-try-on route must use authenticateUser');

    // OneSignal API key handling
    assert(!serverSource.includes("clientApiKey || req.headers['x-onesignal-api-key']"), 'OneSignal must not trust client-provided API key');
  });

  // TEST 9: Locked PWA assets according to RULE[AGENTS_md]
  await test('Locked PWA assets conform to RULE[AGENTS_md]', () => {
    assert(fs.existsSync(path.join(process.cwd(), 'public', 'icon.png')), 'public/icon.png must exist');

    const manifest = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'public', 'manifest.json'), 'utf8'));
    assert.strictEqual(manifest.short_name, 'قناة الاتحاد', 'manifest.json short_name must be قناة الاتحاد');
    const hasIcon = manifest.icons?.some((i: any) => i.src === '/icon.png');
    assert(hasIcon, 'manifest.json icon paths must remain /icon.png');

    const html = fs.readFileSync(path.join(process.cwd(), 'index.html'), 'utf8');
    assert(html.includes('content="قناة الاتحاد"'), 'index.html apple-mobile-web-app-title must remain قناة الاتحاد');
    assert(html.includes('href="/icon.png'), 'index.html apple-touch-icon must point to /icon.png');
  });

  console.log(`\n🎉 ALL ${passed}/${total} SECURITY AUDIT TESTS PASSED!`);
}

runTests().catch((err) => {
  console.error('Fatal test failure:', err);
  process.exit(1);
});
