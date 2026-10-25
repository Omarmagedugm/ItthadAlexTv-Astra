import ts from 'typescript';import {readFileSync,writeFileSync,unlinkSync} from 'node:fs';import {createHash} from 'node:crypto';
const root=new URL('../public/games/ittihadawy/',import.meta.url);let html=readFileSync(new URL('index.html',root),'utf8'),old=html.match(/assets\/index-[^" ]+\.js/)[0],code=readFileSync(new URL(old,root),'utf8');
code=code.replace('function characterUnlocked(id,score){return true}','function characterUnlocked(id,score){return id==="gamal"||(typeof window!=="undefined"&&window.__ittihadawyUnlockedCharacters?.includes(id)===true)}');
code=code.replace('score:Math.floor(this.run?.points||0),distance:', 'score:Math.floor(this.run?.points||0),coins:Math.floor(this.run?.coins||0),distance:');
code=code.replace('if(t==="menu"){this.reset()', 'if(t==="menu"){window.dispatchEvent(new CustomEvent("ittihadawy:coin-checkpoint",{detail:{coins:Math.floor(this.run?.coins||0)}}));this.reset()');
if(ts.createSourceFile('g.js',code,99,true).parseDiagnostics.length)throw Error('Invalid coin integration');
const file='assets/index-'+createHash('sha256').update(code).digest('hex').slice(0,8)+'.js';writeFileSync(new URL(file,root),code);writeFileSync(new URL('index.html',root),html.replace(old,file));if(old!==file)unlinkSync(new URL(old,root));console.log(file);
