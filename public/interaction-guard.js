/* Keep long presses and browser gestures from covering the application/game. */
(() => {
  if (window.__ittihadInteractionGuard) return;
  window.__ittihadInteractionGuard = true;
  const editable = target => target instanceof Element && !!target.closest('input, textarea, [contenteditable="true"], [contenteditable=""]');
  const cancel = event => event.preventDefault();
  const cancelOutsideFields = event => { if (!editable(event.target)) event.preventDefault(); };
  const style = document.createElement('style');
  style.textContent = `
    html, body { touch-action: manipulation; }
    *, *::before, *::after { -webkit-user-select: none !important; user-select: none !important; -webkit-touch-callout: none !important; }
    img, a, canvas { -webkit-user-drag: none; }
    input, textarea, [contenteditable="true"], [contenteditable=""], [contenteditable="true"] *, [contenteditable=""] * { -webkit-user-select: text !important; user-select: text !important; }
  `;
  document.head.appendChild(style);
  for (const type of ['selectstart', 'copy', 'cut', 'contextmenu', 'dragstart']) document.addEventListener(type, cancelOutsideFields, true);
  document.addEventListener('selectionchange', () => {
    const selection = window.getSelection();
    if (selection && !selection.isCollapsed && !editable(document.activeElement) && !editable(selection.anchorNode?.parentElement)) selection.removeAllRanges();
  });
  for (const type of ['gesturestart', 'gesturechange', 'gestureend']) document.addEventListener(type, cancel, { capture: true, passive: false });
  for (const type of ['touchstart', 'touchmove']) document.addEventListener(type, event => {
    if (event.touches.length > 1) event.preventDefault();
  }, { capture: true, passive: false });
  document.addEventListener('wheel', event => { if (event.ctrlKey || event.metaKey) event.preventDefault(); }, { capture: true, passive: false });
  document.addEventListener('keydown', event => {
    if (!(event.ctrlKey || event.metaKey)) return;
    if (['+', '-', '=', '0'].includes(event.key) || (!editable(event.target) && ['a', 'c', 'x'].includes(event.key.toLowerCase()))) event.preventDefault();
  }, true);
})();
