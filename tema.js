// Tema (claro u oscuro) y bloqueo, antes de que se dibuje la página: así no hay un destello del tema equivocado
// ni se llegan a ver los números antes de pedir el PIN. Lo demás está en app.js.
(function () {
  var d = document.documentElement, t = "auto", mq = window.matchMedia && matchMedia("(prefers-color-scheme: dark)");
  try { t = localStorage.getItem("panel-tema") || "auto"; } catch (e) {}
  function poner() { d.classList.toggle("oscuro", t === "oscuro" || (t === "auto" && !!mq && mq.matches)); }
  poner();
  if (mq && mq.addEventListener) mq.addEventListener("change", poner); else if (mq && mq.addListener) mq.addListener(poner);
  window.petacaTema = function (n) { t = n; try { localStorage.setItem("panel-tema", n); } catch (e) {} poner(); };
  window.petacaTemaActual = function () { return t; };
  // Con PIN y con una sesión guardada, el panel arranca tapado hasta que lo desbloquees.
  try {
    var ses = false;
    for (var i = 0; i < localStorage.length; i++) if (/^sb-.*-auth-token$/.test(localStorage.key(i) || "")) ses = true;
    if (ses && localStorage.getItem("panel-pin")) d.classList.add("bloqueado");
  } catch (e) {}
})();
