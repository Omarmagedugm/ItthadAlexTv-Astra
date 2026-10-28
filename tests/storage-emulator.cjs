const { createRequire } = require('node:module');
const dependencies=process.env.FIREBASE_TEST_PACKAGE_JSON?createRequire(process.env.FIREBASE_TEST_PACKAGE_JSON):require;
const {initializeTestEnvironment,assertSucceeds,assertFails}=dependencies('@firebase/rules-unit-testing');
const {ref,uploadBytes,deleteObject,getMetadata}=dependencies('firebase/storage');
(async()=>{
 const env=await initializeTestEnvironment({projectId:'demo-audit',storage:{host:'127.0.0.1',port:9199,rules:require('node:fs').readFileSync('storage.rules','utf8')}});
 try {
 await env.clearStorage();
 const alice=env.authenticatedContext('alice').storage(),bob=env.authenticatedContext('bob').storage(),guest=env.unauthenticatedContext().storage();
 const path='uploads/alice/images/test.png'; const data=new Uint8Array([1,2,3]); const meta={contentType:'image/png'};
 await assertSucceeds(uploadBytes(ref(alice,path),data,meta));
 await assertSucceeds(getMetadata(ref(guest,path)));
 await assertFails(uploadBytes(ref(bob,path),data,meta));
 await assertFails(deleteObject(ref(bob,path)));
 await assertFails(uploadBytes(ref(guest,'uploads/alice/images/guest.png'),data,meta));
 await assertFails(uploadBytes(ref(alice,'images/legacy.png'),data,meta));
 await assertFails(uploadBytes(ref(alice,'uploads/alice/images/empty.png'),new Uint8Array(),meta));
 await assertFails(uploadBytes(ref(alice,'uploads/alice/images/test.svg'),data,{contentType:'image/svg+xml'}));
 await assertFails(uploadBytes(ref(alice,'uploads/alice/images/test.html'),data,{contentType:'text/html'}));
 await assertSucceeds(deleteObject(ref(alice,path)));
 console.log('Storage ownership regressions passed');
 } finally {await env.cleanup()}
})().catch(e=>{console.error(e);process.exitCode=1});
