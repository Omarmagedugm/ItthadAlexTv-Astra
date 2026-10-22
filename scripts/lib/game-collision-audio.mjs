import ts from 'typescript';

// Move the existing Adel clip to ball collisions, retaining its stored asset key.
export function retargetAdelAudio(code) {
  const parsed = ts.createSourceFile('game.js', code, ts.ScriptTarget.Latest, true, ts.ScriptKind.JS);
  const sound = parsed.statements.find(node => ts.isClassDeclaration(node) && node.name?.text === 'gC');
  if (sound?.members.some(member => member.name?.getText(parsed) === 'ballHit')) throw new Error('Ball collision audio already configured');
  const boost = sound?.members.find(member => member.name?.getText(parsed) === 'boost');
  if (!boost) throw new Error('Missing speed effect');
  const old = boost.getText(parsed);
  const voiceStart = old.indexOf('if(charId==="adel")');
  const synthStart = old.indexOf('const c=this.ctx.currentTime;[330,440,554,659,880,1108,1320]');
  if (voiceStart < 0 || synthStart < 0) throw new Error('Unexpected speed audio implementation');
  const guard = 'if(this.muted||!this.ctx||!this.effectsEnabled)return;';
  const replacement = `ballHit(charId){if(charId!=="adel"){this.hit(charId);return}${guard}${old.slice(voiceStart,synthStart)}}boost(){${guard}${old.slice(synthStart,-1)}}`;
  code = code.slice(0,boost.getStart(parsed)) + replacement + code.slice(boost.end);
  const swap = (from,to) => {
    if (code.split(from).length !== 2) throw new Error('Expected exactly one collision patch target: '+from.slice(0,60));
    code = code.replace(from,to);
  };
  swap('this.sound.hit(this.characterId)', '(g.type==="ball"?this.sound.ballHit(this.characterId):this.sound.hit(this.characterId))');
  swap('this.sound.boost(this.characterId)', 'this.sound.boost()');
  swap('this.cb.toast(this.characterId==="adel"?"يا واد يا زعيم! هتعورنا يا زعيم! ⚡":"انطلاقة البرق! سرعة وحماية لمدة ٣ ثواني")', 'this.cb.toast("انطلاقة البرق! سرعة وحماية لمدة ٣ ثواني")');
  swap('this.cb.toast(this.characterId==="adel"?"بطني بتتحرق!":"حاسب يا اتحاداوي! الشرطة قربت")', 'this.cb.toast(this.characterId==="adel"?(g.type==="ball"?"يا واد يا زعيم!":"بطني بتتحرق!"):"حاسب يا اتحاداوي! الشرطة قربت")');
  return code;
}
