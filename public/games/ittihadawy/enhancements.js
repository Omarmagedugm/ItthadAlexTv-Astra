// Account integration stays on the application's origin; no identity is accepted from the game.
const frame = document.createElement('iframe');
frame.hidden = true;
frame.title = 'ربط حساب اللعبة';
frame.src = '/game-account.html';
document.body.append(frame);
let ready = false, runId = null, result = null, status = '', pending = [];
const send = message => ready ? frame.contentWindow.postMessage(message, location.origin) : pending.push(message);
function showStatus() {
  const dialog = document.querySelector('main.game_over .dialog');
  if (!dialog) return;
  let box = dialog.querySelector('.game-account-status');
  if (!box) { box = document.createElement('div'); box.className = 'game-account-status'; box.setAttribute('role', 'status'); dialog.append(box); }
  box.replaceChildren();
  const text = document.createElement('p');
  text.textContent = ({waiting:'جاري الاتصال بحسابك…',saving:'جاري حفظ نتيجتك…',saved:'اتحفظ أعلى سكور ليك على حسابك ✓',guest:'سجّل دخولك قبل الجولة عشان تنافس باسمك.',error:'تعذّر حفظ النتيجة. تأكد من اتصالك وحاول تاني.'})[status] || '';
  box.append(text);
  if (status === 'error') {
    const retry = document.createElement('button'); retry.textContent = 'إعادة حفظ النتيجة';
    retry.onclick = () => { status='saving'; showStatus(); send({type:'ittihadawy:run-end',id:runId,result}); }; box.append(retry);
  }
  const link = document.createElement('a'); link.href = status === 'guest' ? '/auth' : '/game'; link.textContent = status === 'guest' ? 'تسجيل الدخول' : 'ترتيب الأعضاء ←'; box.append(link);
}
window.addEventListener('message', event => {
  if (event.origin !== location.origin || event.source !== frame.contentWindow || event.data?.type !== 'ittihadawy:account') return;
  if (event.data.status === 'ready') { ready = true; for (const message of pending) send(message); pending = []; return; }
  if (event.data.id !== runId) return;
  status = event.data.status; showStatus();
});
window.addEventListener('ittihadawy:state', event => {
  const detail = event.detail;
  if (detail.state === 'GAME_OVER' && runId) {
    result = detail.result; status='waiting'; send({type:'ittihadawy:run-end',id:runId,result});
    setTimeout(showStatus, 100);
    setTimeout(() => { if (status==='waiting') { status='error'; showStatus(); } }, 12000);
  }
});

window.addEventListener('ittihadawy:run-start', () => {
  runId = crypto.randomUUID(); result = null; status = '';
  send({type:'ittihadawy:run-start',id:runId});
});
