/* Confia.ing, propuesta 3: the three behaviours the brief asks for beyond the kit.
   1. the journey's panels wait hidden until system.js has set the tabs (no flash; all five stay in the HTML)
   2. the enquiry form is a visual mock: checked here, nothing is sent
   3. the ES/EN switch */
(function () {
  'use strict';

  // 1. journey: system.js sets [hidden] on the panels of unselected tabs; then the CSS guard can go. Home and End too.
  var list = document.querySelector('#recorrido [role="tablist"]');
  function release() { document.querySelectorAll('.stage-panel[data-wait]').forEach(function (p) { if (p.hidden || p.id === 'etapa-1') p.removeAttribute('data-wait'); }); }
  function settle() {
    var panels = document.querySelectorAll('.stage-panel');
    var anyHidden = Array.prototype.some.call(panels, function (p) { return p.hidden; });
    if (!anyHidden) panels.forEach(function (p, i) { p.hidden = i !== 0; });   // system.js did not run: do its job
    release();
  }
  window.addEventListener('load', function () { setTimeout(settle, 0); });
  if (list) {
    list.addEventListener('keydown', function (e) {
      if (e.key !== 'Home' && e.key !== 'End') return;
      var tabs = list.querySelectorAll('[role="tab"]');
      e.preventDefault();
      var t = tabs[e.key === 'Home' ? 0 : tabs.length - 1];
      t.click(); t.focus();
    });
  }

  // 2. the form: a mock. Capture phase, so the kit's own handler never tries to send it.
  var form = document.getElementById('consulta-form');
  if (form) {
    var status = form.querySelector('[data-form-status]');
    var f = function (id) { return document.getElementById(id); };
    var mark = function (el, bad) {
      var err = f(el.id + '-err');
      if (bad) el.setAttribute('aria-invalid', 'true'); else el.removeAttribute('aria-invalid');
      if (err) err.hidden = !bad;
    };
    var mailOk = function (v) { return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v); };
    var telOk = function (v) { return v.replace(/\D/g, '').length >= 7 && /^[\d\s()+.-]+$/.test(v); };
    document.addEventListener('submit', function (e) {
      if (e.target !== form) return;
      e.preventDefault(); e.stopImmediatePropagation();
      var bad = [];
      var nombre = f('f-nombre'), empresa = f('f-empresa'), correo = f('f-correo'), tel = f('f-telefono'), donde = f('f-donde'), acepto = f('f-acepto');
      [nombre, empresa, donde].forEach(function (el) { var b = !el.value.trim(); mark(el, b); if (b) bad.push(el); });
      var c = correo.value.trim(), t = tel.value.trim();
      var cBad = c ? !mailOk(c) : !t;            // an empty email is fine when a phone is given
      var tBad = t ? !telOk(t) : false;          // an empty phone is fine; the email line names the choice
      if (!c && t && !tBad) cBad = false;
      mark(correo, cBad); mark(tel, tBad);
      if (cBad) bad.push(correo);
      if (tBad) bad.push(tel);
      var aBad = !acepto.checked; mark(acepto, aBad); if (aBad) bad.push(acepto);
      bad.sort(function (a, b) { return a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1; });
      if (bad.length) {
        status.dataset.state = 'bad';
        status.textContent = bad.length === 1 ? 'Hay 1 campo por corregir.' : 'Hay ' + bad.length + ' campos por corregir.';
        bad[0].focus();
        return;
      }
      form.reset();
      status.dataset.state = 'ok';
      status.textContent = 'Recibimos tu consulta. Te contactaremos pronto.';
    }, true);
    form.addEventListener('input', function (e) {
      var el = e.target;
      if (el.getAttribute && el.getAttribute('aria-invalid') === 'true') mark(el, false);
      if (el.id === 'f-telefono' || el.id === 'f-correo') { mark(f('f-correo'), false); mark(f('f-telefono'), false); }
      if (status.dataset.state === 'ok') { status.textContent = ''; delete status.dataset.state; }
    });
  }

  // 3. ES / EN: the English copy is written in a later phase, so EN only says so and ES stays chosen.
  var say = document.getElementById('lang-status');
  document.querySelectorAll('.lang button').forEach(function (b) {
    b.addEventListener('click', function () {
      if (!say) return;
      say.textContent = '';
      say.textContent = b.dataset.lang === 'en' ? 'The English version is being written. The page stays in Spanish.' : 'La página está en español.';
    });
  });
})();
