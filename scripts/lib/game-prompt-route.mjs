import ts from 'typescript';

const route = [
  ['stadium','استاد الإسكندرية','stadium',false],
  ['komeldikka','كوم الدكة','market',false],
  ['misrstation','محطة مصر','station',false],
  ['moharrambek','محرم بك','historic',false],
  ['karmouz','كرموز','market',false],
  ['bahary','بحري','harbor',true],
  ['mansheya','المنشية','historic',true],
  ['mahatetraml','محطة الرمل','historic',true],
  ['azareeta','الأزاريطة','urban',true],
  ['shatby','الشاطبي','urban',true],
  ['hadra','الحضرة','market',false],
  ['smouha','سموحة','modern',false],
  ['zahreya','الظاهرية','urban',false],
  ['bakous','باكوس','market',false],
  ['ghabriel','غبريال','urban',false],
  ['victoria','فيكتوريا','urban',false],
  ['sidiBishr','سيدي بشر','beach',true],
  ['miami','ميامي','beach',true],
  ['asafra','العصافرة','market',true],
  ['mandara','المندرة','beach',true],
  ['montaza','المنتزه','gardens',true],
  ['maamoura','المعمورة','gardens',true],
  ['abouqir','أبو قير','harbor',true],
  ['minabasal','مينا البصل','industrial',false],
  ['mex','المكس','harbor',true],
  ['dekheila','الدخيلة','industrial',false],
  ['agamy','العجمي','beach',true],
  ['borgelarab','برج العرب','stadium',false]
];

export const requiredRegions = Object.freeze(route.map(([id,name,theme,sea],index)=>({
  id,name,theme,end:420+index*600,sea
})));

export function applyPromptRoute(code) {
  const source=ts.createSourceFile('game.js',code,ts.ScriptTarget.Latest,true,ts.ScriptKind.JS);
  const routeLiteral='['+requiredRegions.map(r=>`{id:${JSON.stringify(r.id)},name:${JSON.stringify(r.name)},theme:${JSON.stringify(r.theme)},end:${r.end},sea:${r.sea}}`).join(',')+']';
  const variables=source.statements.flatMap(s=>ts.isVariableStatement(s)?[...s.declarationList.declarations]:[]);
  const targets=['_0','Mr'].map(name=>variables.find(d=>d.name.getText(source)===name));
  if(targets.some(variable=>!variable?.initializer))throw new Error('Could not locate game region data and route');
  for(const variable of targets.sort((a,b)=>b.initializer.getStart(source)-a.initializer.getStart(source))) {
    const start=variable.initializer.getStart(source),end=variable.initializer.end;
    code=code.slice(0,start)+routeLiteral+code.slice(end);
  }
  return code;
}

export function applyHamidoOpening(code) {
  const source=ts.createSourceFile('game.js',code,ts.ScriptTarget.Latest,true,ts.ScriptKind.JS);
  const sound=source.statements.find(n=>ts.isClassDeclaration(n)&&n.name?.text==='gC');
  const method=sound?.members.find(m=>m.name?.getText(source)==='playOpening');
  if(!method)throw new Error('Could not locate character intro voice method');
  const replacement='playOpening(t="gamal"){this.openingWasPlaying=false;this.opening?.pause();if(this.muted||!["gamal","adel","hamido","lazo"].includes(t))return;try{const key=t==="adel"?"adelOpeningAudio":t==="hamido"?"hamidoOpeningAudio":t==="lazo"?"lazoOpeningAudio":"gamalOpeningAudio",url=t==="adel"?"/games/ittihadawy/audio/adel-opening.mp3":t==="hamido"?"/games/ittihadawy/audio/hamido-opening.mp3":t==="lazo"?"/games/ittihadawy/audio/lazo-opening.mp3":"/games/ittihadawy/audio/alexandria-opening.mp3";if(!this[key])this[key]=this.createVoice(url);this.opening=this[key];this.opening.preload="auto";this.opening.currentTime=0;this.routeAudio(this.opening,"sfx");this.opening.muted=this.muted;this.opening.play()?.catch(()=>{})}catch{}}';
  return code.slice(0,method.getStart(source))+replacement+code.slice(method.end);
}
