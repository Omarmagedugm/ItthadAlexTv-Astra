import assert from 'node:assert/strict';
import { BOOTSTRAP_ADMIN_UIDS, canAccessAdmin, isSuperAdminProfile } from '../src/lib/adminAccess';
for (const uid of BOOTSTRAP_ADMIN_UIDS) {
  const profile = { uid, role: 'user' as const, roles: [] };
  assert.equal(canAccessAdmin(profile), true);
  assert.equal(isSuperAdminProfile(profile), true);
}
for (const role of ['admin', 'superadmin', 'moderator', 'writer', 'news_editor', 'media_editor', 'matches_editor', 'store_editor', 'layout_editor', 'user_manager', 'members_editor'] as const) {
  assert.equal(canAccessAdmin({ uid: 'staff', role, roles: [] }), true);
  assert.equal(canAccessAdmin({ uid: 'staff', role: 'user', roles: [role] }), true);
}
assert.equal(canAccessAdmin({ uid: 'viewer', role: 'user', roles: [] }), false);
assert.equal(canAccessAdmin({ role: 'admin', roles: ['superadmin'] }), false);
assert.equal(isSuperAdminProfile({ uid: 'editor', role: 'news_editor', roles: [] }), false);
assert.equal(canAccessAdmin({ uid: 'viewer', role: 'user', roles: ['unexpected' as any] }), false);
console.log('Admin access regression checks passed');

// Navigation and deep links use the same section policy.
const { ADMIN_SECTIONS, canOpenAdminSection } = await import('../src/lib/adminSections');
const admin = { uid: 'HRDB2ppkGqOfBrat2D0xThuTkRe2', role: 'user', roles: [] } as any;
for (const section of ADMIN_SECTIONS) assert.equal(canOpenAdminSection(admin, section.id), true);
const layoutEditor = { uid: 'layout', role: 'layout_editor', roles: [] } as any;
assert.equal(canOpenAdminSection(layoutEditor, 'sections-control'), true);
assert.equal(canOpenAdminSection(layoutEditor, 'public-services'), true);
assert.equal(canOpenAdminSection(layoutEditor, 'users'), false);
assert.equal(canOpenAdminSection(layoutEditor, 'settings'), false);
assert.equal(canOpenAdminSection(layoutEditor, 'missing-tab'), false);
assert.equal(canOpenAdminSection({ uid: 'viewer', role: 'user', roles: [] } as any, 'overview'), false);
assert.equal(canOpenAdminSection({ uid: 'editor', role: 'news_editor', roles: [] } as any, 'analytics'), true);
assert.equal(new Set(ADMIN_SECTIONS.map(s => s.id)).size, ADMIN_SECTIONS.length);
console.log(`Section navigation checks passed (${ADMIN_SECTIONS.length} sections)`);

const ts = await import('typescript');
const fs = await import('node:fs');
const sourceText = fs.readFileSync('src/pages/Admin.tsx','utf8');
const sourceFile = ts.createSourceFile('Admin.tsx',sourceText,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);
const adminFunction = sourceFile.statements.find(node => ts.isFunctionDeclaration(node) && node.name?.text === 'Admin') as import('typescript').FunctionDeclaration;
assert(adminFunction?.body);
const statements = [...adminFunction.body.statements];
function contains(node: import('typescript').Node, predicate: (node: import('typescript').Node) => boolean): boolean {
 if (predicate(node)) return true;
 if (ts.isFunctionLike(node)) return false;
 return Boolean(ts.forEachChild(node, child => contains(child,predicate) || undefined));
}
const lastHook = statements.reduce((last,node,index) => contains(node,n => ts.isCallExpression(n) && ts.isIdentifier(n.expression) && /^use[A-Z]/.test(n.expression.text)) ? index : last,-1);
for (const node of statements.slice(0,lastHook)) assert.equal(contains(node,n => ts.isReturnStatement(n)),false,'Admin must not return before its final hook');
for (const section of ADMIN_SECTIONS) assert(sourceText.includes(`activeTab === '${section.id}'`),`${section.id} must have a content panel`);
console.log('Hook order and all section panels verified');
