// Bouton de langue actif selon l'ancre (#fr / #en), sans rien enregistrer.
(function () {
  const liens = [...document.querySelectorAll('nav.langues a')];
  function maj() {
    const h = location.hash || '#fr';
    for (const a of liens) a.setAttribute('aria-current', String(a.getAttribute('href') === h));
  }
  addEventListener('hashchange', maj);
  if (!location.hash && /^en\b/i.test(navigator.language || '')) location.replace('#en');
  maj();
})();
