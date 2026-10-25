// Account integration stays on the application's origin; no identity is accepted from the game.
const frame = document.createElement('iframe');
frame.hidden = true;
frame.title = 'ربط حساب اللعبة';
frame.src = '/game-account.html';
document.body.append(frame);

let ready = false, runId = null, result = null, status = '', pending = [];
const send = message => ready ? frame.contentWindow.postMessage(message, location.origin) : pending.push(message);

// Embedded play uses the already signed-in app; direct links reuse Firebase's
// persisted session through the existing same-origin account bridge.
const accessGate = document.getElementById('member-access-gate');
window.addEventListener('message', event => {
  if (event.origin !== location.origin) return;
  const fromApp = window.parent !== window && event.source === window.parent;
  const fromAccount = event.source === frame.contentWindow;
  if (!fromApp && !fromAccount) return;
  if (event.data?.type !== 'ittihadawy:member-access') return;
  if (event.data.authorized === true) {
    if (event.data.isAdmin === true) {
      window.__ittihadawyIsAdmin = true;
      window.__ittihadawyUnlockedCharacters = ['gamal', 'adel', 'hamido', 'lazo', 'islam'];
      window.dispatchEvent(new CustomEvent('ittihadawy:lobby-coin-saved'));
    }
    accessGate?.remove();
    document.getElementById('root')?.removeAttribute('inert');
  } else if (event.data.authorized === false && accessGate) {
    // Embedded play may use an in-memory app session; only the app can revoke it.
    if (fromAccount && window.parent !== window) return;
    document.getElementById('root')?.setAttribute('inert', '');
    accessGate.querySelector('h1').textContent = 'سجّل الدخول للعب';
    accessGate.querySelector('p').textContent = 'اللعبة متاحة لأعضاء التطبيق. استخدم حسابك الحالي أو أنشئ حسابًا.';
    accessGate.querySelector('a').hidden = false;
    document.body.append(accessGate);
  }
});
if (window.parent !== window) {
  window.parent.postMessage({ type: 'ittihadawy:access-request' }, location.origin);
}

// Keep the engine's global keyboard handlers inactive while access is locked.
for (const type of ['keydown', 'keyup']) window.addEventListener(type, event => {
  if (document.getElementById('member-access-gate') && !['Tab', 'Enter'].includes(event.key)) {
    event.preventDefault();
    event.stopImmediatePropagation();
  }
}, true);

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

  // Action link to external game page
  const link = document.createElement('a');
  link.href = status === 'guest' ? '/auth' : '/game';
  link.textContent = status === 'guest' ? 'تسجيل الدخول' : 'عرض قائمة أعلى الأرقام في التطبيق ←';
  box.append(link);
}

// Live Game Stats Extractor: reads live score/distance at any moment even if not caught
function getLiveGameStats() {
  let score = 0, distance = 0, coins = 0, character = 'gamal';
  
  // 1. Read live score from active HUD
  const hudPoints = document.querySelector('.hud-points');
  if (hudPoints && hudPoints.textContent) {
    const raw = hudPoints.textContent.replace(/[٠-٩]/g, d => '٠١٢٣٤٥٦٧٨٩'.indexOf(d)).replace(/[^\d]/g, '');
    score = parseInt(raw, 10) || 0;
  }
  
  // 2. Read live distance from hud-chip
  const chips = document.querySelectorAll('.hud-chip');
  chips.forEach(chip => {
    if (chip.textContent && chip.textContent.includes('متر')) {
      const raw = chip.textContent.replace(/[٠-٩]/g, d => '٠١٢٣٤٥٦٧٨٩'.indexOf(d)).replace(/[^\d]/g, '');
      distance = parseInt(raw, 10) || 0;
    }
  });

  for (const chip of chips) if(chip.textContent?.includes('عملة')) coins=Number(chip.querySelector('b')?.textContent?.replace(/[٠-٩]/g,d=>'٠١٢٣٤٥٦٧٨٩'.indexOf(d)).replace(/[^\d]/g,''))||0;

  // 3. Read character from localStorage
  try {
    const savedChar = JSON.parse(localStorage.getItem('ittihadawy-character') || '""');
    if (savedChar && ['adel', 'gamal', 'hamido', 'lazo','islam'].includes(savedChar)) {
      character = savedChar;
    }
  } catch (_) {}

  // 4. Also check localStorage gamal-best if higher
  try {
    const best = JSON.parse(localStorage.getItem('gamal-best') || 'null');
    if (best && typeof best.score === 'number' && Math.floor(best.score) > score) {
      score = Math.floor(best.score);
      distance = Math.max(distance, Math.floor(best.distance || 0));
    }
  } catch (_) {}

  return { score: Math.floor(score), distance: Math.floor(distance), character, coins: Math.floor(coins) };
}

// Intercept back button clicks inside iframe to save live score and exit cleanly
document.addEventListener('click', (e) => {
  const target = e.target;
  const link = target && typeof target.closest === 'function' ? target.closest('.back-app-link') : null;
  if (link) {
    e.preventDefault();
    e.stopPropagation();

    // Grab current live score before exiting, even if not game over
    const current = getLiveGameStats();
    if (current.score >= 1 || current.coins >= 1) {
      send({ type: 'ittihadawy:run-end', id: runId || 'early-exit', result: current });
      if (window.parent && window.parent !== window) {
        try {
          window.parent.postMessage({
            type: 'ittihadawy:run-end',
            id: runId || 'early-exit',
            result: current
          }, '*');
        } catch (_) {}
      }
    }

    if (window.parent && window.parent !== window) {
      try { window.parent.postMessage({ type: 'ittihadawy:close' }, '*'); } catch {}
    } else {
      window.location.href = '/game';
    }
  }
}, true);

// Send periodic live score updates so parent window always has the freshest score
setInterval(() => {
  const current = getLiveGameStats();
  if (current.score >= 1 || current.coins >= 1) {
    if (window.parent && window.parent !== window) {
      try {
        window.parent.postMessage({
          type: 'ittihadawy:live-progress',
          id: runId || 'active-run',
          result: current
        }, '*');
      } catch (_) {}
    }
  }
}, 1000);

// Capture score if window or tab is closed/navigated away
window.addEventListener('beforeunload', () => {
  const current = getLiveGameStats();
  if (current.score >= 1 || current.coins >= 1) {
    send({ type: 'ittihadawy:run-end', id: runId || 'early-exit', result: current });
    if (window.parent && window.parent !== window) {
      try {
        window.parent.postMessage({
          type: 'ittihadawy:run-end',
          id: runId || 'early-exit',
          result: current
        }, '*');
      } catch (_) {}
    }
  }
});

window.addEventListener('message', event => {
  if (event.origin !== location.origin) return;
  const data = event.data;
  if (!data) return;

  if (data.type === 'ittihadawy:account') {
    if (data.status === 'ready') { ready = true; for (const message of pending) send(message); pending = []; return; }
    if (data.id && data.id !== runId) return;
    status = data.status; showStatus();
    return;
  }
});

function startNewRun() {
  runId = crypto.randomUUID();
  result = null;
  status = '';
  send({ type: 'ittihadawy:run-start', id: runId });
  if (window.parent && window.parent !== window) {
    try { window.parent.postMessage({ type: 'ittihadawy:run-start', id: runId }, '*'); } catch {}
  }
}

window.addEventListener('ittihadawy:run-start', () => {
  startNewRun();
});

window.addEventListener('ittihadawy:state', event => {
  const detail = event.detail;
  if (!detail) return;
  if ((detail.state === 'INTRO' || detail.state === 'PLAYING') && !runId) {
    startNewRun();
  }
  if (detail.state === 'GAME_OVER') {
    if (!runId) {
      startNewRun();
    }
    result = detail.result;
    status = 'waiting';
    send({ type: 'ittihadawy:run-end', id: runId, result });
    if (window.parent && window.parent !== window) {
      try { window.parent.postMessage({ type: 'ittihadawy:run-end', id: runId, result }, '*'); } catch {}
    }
    setTimeout(showStatus, 100);
    setTimeout(() => {
      if (status === 'waiting') {
        status = 'error';
        showStatus();
      }
    }, 12000);
  }
});


// Lobby requests only reach the same-origin authenticated account frame.
window.addEventListener('ittihadawy:lobby-request', event => {
 const data=event.detail;
 if(data?.type==='ittihadawy:cosmetics'||data?.type==='ittihadawy:get-leaderboard')send(data);
});
window.addEventListener('message', event => {
 if(event.origin!==location.origin||event.source!==frame.contentWindow)return;
 if(['ittihadawy:cosmetics-data','ittihadawy:leaderboard-data'].includes(event.data?.type))
  window.dispatchEvent(new CustomEvent('ittihadawy:lobby-response',{detail:event.data}));
});

window.addEventListener('message',event=>{
 if(event.origin!==location.origin||event.source!==frame.contentWindow)return;
 if(event.data?.type==='ittihadawy:coins-error')window.dispatchEvent(new CustomEvent('ittihadawy:lobby-coin-error'));
 if(event.data?.type==='ittihadawy:coins-saved')window.dispatchEvent(new CustomEvent('ittihadawy:lobby-coin-saved'));
});

let lastCoinCheckpoint=0;
setInterval(()=>{
 if(!runId||Date.now()-lastCoinCheckpoint<15000)return;
 const current=getLiveGameStats();if(current.coins<1)return;
 lastCoinCheckpoint=Date.now();
 send({type:'ittihadawy:coin-progress',id:runId,result:current});
 if(window.parent&&window.parent!==window){try{window.parent.postMessage({type:'ittihadawy:coin-progress',id:runId,result:current},'*')}catch{}}
},15000);
window.addEventListener('ittihadawy:coin-checkpoint',event=>{
 if(runId&&Number.isSafeInteger(event.detail?.coins)&&event.detail.coins>0){
  send({type:'ittihadawy:coin-progress',id:runId,result:{coins:event.detail.coins}});
  if(window.parent&&window.parent!==window){try{window.parent.postMessage({type:'ittihadawy:coin-progress',id:runId,result:{coins:event.detail.coins}},'*')}catch{}}
 }
});
