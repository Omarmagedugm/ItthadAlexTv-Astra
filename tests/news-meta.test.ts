import assert from 'assert';
import handler, { fetchNewsMetadata, injectNewsMetaTags } from '../api/news-meta.js';

async function runNewsMetaTests() {
  console.log('--- STARTING VERCEL NEWS-META SERVERLESS FUNCTION TESTS ---');

  // TEST 1: Fetch metadata for the failing production URL
  console.log('Testing Firestore fetch for article RLcnf0SYOuddvqYDY8KC...');
  const result = await fetchNewsMetadata('RLcnf0SYOuddvqYDY8KC');
  assert.strictEqual(result.status, 'found', 'Article RLcnf0SYOuddvqYDY8KC must be found in Firestore');
  if (result.status === 'found') {
    assert(result.meta.title.includes('مواليد 2017'), 'Article title must match');
    console.log('✅ PASS: Found article title:', result.meta.title);
  }

  // TEST 2: Simulate Vercel invocation with URL path /news/RLcnf0SYOuddvqYDY8KC
  console.log('Testing handler with req.url = /news/RLcnf0SYOuddvqYDY8KC...');
  let responseStatus = 0;
  let responseHeaders: Record<string, string> = {};
  let responseBody = '';

  const mockRes = {
    setHeader: (k: string, v: string) => { responseHeaders[k] = v; },
    status: (s: number) => {
      responseStatus = s;
      return {
        send: (b: string) => { responseBody = b; },
        end: () => {}
      };
    }
  };

  const mockReq = {
    url: '/news/RLcnf0SYOuddvqYDY8KC',
    headers: {}
  };

  await handler(mockReq, mockRes);

  assert.strictEqual(responseStatus, 200, 'Response status must be 200');
  assert(responseHeaders['Content-Type']?.includes('text/html'), 'Content-Type must be text/html');
  assert(responseBody.includes('مواليد 2017 يفوزون على ط. الأسطول'), 'Response HTML must contain the article headline');
  assert(responseBody.includes('<meta property="og:title"'), 'Response HTML must contain Open Graph title');
  assert(responseBody.includes('rel="canonical"'), 'Response HTML must contain canonical link');
  assert(responseBody.includes('https://itthadalextv.com/news/RLcnf0SYOuddvqYDY8KC'), 'Canonical URL must be accurate');
  assert(responseBody.includes('"@type": "NewsArticle"'), 'Response HTML must contain NewsArticle schema');
  assert(responseBody.includes('<div id="root">'), 'Response HTML must preserve client SPA root element');
  console.log('✅ PASS: Handler successfully rendered news meta without __dirname error!');

  // TEST 3: Simulate Vercel invocation with query parameter req.query = { id: 'RLcnf0SYOuddvqYDY8KC' }
  console.log('Testing handler with req.query.id...');
  responseStatus = 0;
  responseHeaders = {};
  responseBody = '';

  const mockReqQuery = {
    url: '/api/news-meta?id=RLcnf0SYOuddvqYDY8KC',
    query: { id: 'RLcnf0SYOuddvqYDY8KC' },
    headers: {}
  };

  await handler(mockReqQuery, mockRes);
  assert.strictEqual(responseStatus, 200, 'Response status must be 200 with req.query.id');
  assert(responseBody.includes('مواليد 2017 يفوزون على ط. الأسطول'), 'HTML must contain headline');
  console.log('✅ PASS: Handler successfully rendered using req.query.id!');

  // TEST 4: Simulate 301 canonical redirect for slug or trailing slash
  console.log('Testing 301 redirect for /news/RLcnf0SYOuddvqYDY8KC/extra-slug...');
  let redirectedLocation = '';
  let redirectedStatus = 0;

  const mockReqRedirect = {
    url: '/news/RLcnf0SYOuddvqYDY8KC/extra-slug',
    headers: {}
  };

  const mockResRedirect = {
    setHeader: (k: string, v: string) => {
      if (k === 'Location') redirectedLocation = v;
    },
    status: (s: number) => {
      redirectedStatus = s;
      return {
        end: () => {}
      };
    }
  };

  await handler(mockReqRedirect, mockResRedirect);
  assert.strictEqual(redirectedStatus, 301, 'Should return 301 redirect for non-canonical slug');
  assert.strictEqual(redirectedLocation, '/news/RLcnf0SYOuddvqYDY8KC', 'Should redirect to canonical path');
  console.log('✅ PASS: 301 Canonical redirect verified!');

  // TEST 5: Simulate 404 for non-existent news ID
  console.log('Testing 404 for non-existent news article...');
  responseStatus = 0;
  responseBody = '';

  const mockReqNotFound = {
    url: '/news/NON_EXISTENT_ID_999999',
    headers: {}
  };

  await handler(mockReqNotFound, mockRes);
  assert.strictEqual(responseStatus, 404, 'Non-existent article must return 404');
  assert(responseBody.includes('الخبر غير موجود'), 'Must include not found title');
  assert(responseBody.includes('noindex, nofollow'), 'Must include noindex robots tag');
  console.log('✅ PASS: 404 response and noindex tags verified!');

  console.log('\n🎉 ALL VERCEL NEWS-META TESTS PASSED SUCCESSFULLY!');
}

runNewsMetaTests().catch((err) => {
  console.error('Test failed:', err);
  process.exit(1);
});
