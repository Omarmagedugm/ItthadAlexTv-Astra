// One-time administrative migration. Preview first; --apply performs the authorized credit.
import admin from 'firebase-admin';
import {getFirestore,FieldValue} from 'firebase-admin/firestore';
import {readFileSync} from 'node:fs';
const config=JSON.parse(readFileSync(new URL('../firebase-applet-config.json',import.meta.url),'utf8'));
const campaign=JSON.parse(readFileSync(new URL('../config/game-member-gift.json',import.meta.url),'utf8'));
admin.initializeApp({projectId:config.projectId,credential:admin.credential.applicationDefault()});
const db=getFirestore(admin.app(),config.firestoreDatabaseId);
const apply=process.argv.includes('--apply');let eligible=0,granted=0,existing=0;
try {
 const users=await db.collection('users').get();
 for(const user of users.docs){
  if(user.createTime.toMillis()>Date.parse(campaign.cutoff))continue;
  eligible++;
  const ref=db.collection('game_gifts').doc(user.id);
  if(!apply){if((await ref.get()).exists)existing++;continue;}
  const created=await db.runTransaction(async tx=>{
   const previous=await tx.get(ref);if(previous.exists)return false;
   tx.create(ref,{campaign:campaign.id,amount:campaign.amount,seen:false,createdAt:FieldValue.serverTimestamp()});return true;
  });if(created)granted++;else existing++;
 }
 console.log(JSON.stringify({apply,eligible,granted,existing,cutoff:campaign.cutoff}));
} catch(error){console.error('Gift migration did not complete:',error.message);process.exitCode=1;}
