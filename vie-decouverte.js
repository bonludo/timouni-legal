(() => {
  const root = document.documentElement;
  const toggle = document.querySelector('.motion-toggle');
  const preference = matchMedia('(prefers-reduced-motion: reduce)');
  let paused = preference.matches;
  function syncMotion() {
    root.classList.toggle('motion-paused', paused);
    toggle.setAttribute('aria-pressed', String(paused));
    const label = toggle.querySelector('span');
    label.dataset.fr = paused ? 'Reprendre les animations' : 'Mettre les animations en pause';
    label.dataset.en = paused ? 'Resume animations' : 'Pause animations';
    label.textContent = label.dataset[root.lang === 'en' ? 'en' : 'fr'];
  }
  toggle.addEventListener('click', () => {paused = !paused;syncMotion();});
  preference.addEventListener('change', () => {paused = preference.matches;syncMotion();});
  syncMotion();
  const word = document.querySelector('.word-demo');
  const definition = document.querySelector('#word-definition');
  word.addEventListener('click', () => {
    definition.hidden = !definition.hidden;
    word.setAttribute('aria-expanded', String(!definition.hidden));
    word.lastElementChild.textContent = definition.hidden ? '＋' : '−';
  });
  if ('IntersectionObserver' in window) {
    const reveals = new IntersectionObserver(entries => {
      entries.forEach(({target,isIntersecting}) => {if(isIntersecting){target.classList.add('is-visible');reveals.unobserve(target);}});
    }, {threshold:.1});
    document.querySelectorAll('.section-top,.age-panels article,.living-heading').forEach(el => {
      if(el.getBoundingClientRect().top > innerHeight) {el.classList.add('reveal-ready');reveals.observe(el);}
    });
    const activity = new IntersectionObserver(entries => entries.forEach(({target,isIntersecting}) => {
      target.style.animationPlayState = isIntersecting && !document.hidden ? 'running' : 'paused';
    }));
    document.querySelectorAll('.flying-guide,.stage-silo,.stage-krik,.sound-ribbon b,.sea-sparkles i').forEach(el => activity.observe(el));
    document.addEventListener('visibilitychange', () => {root.classList.toggle('page-hidden',document.hidden);});
  }
})();


// Écoute explicite des deux personnages présentés dans l’univers.
(() => {
  const status = document.querySelector('.character-status');
  const phrases = {
    fr: { silo: 'Silo, le colibri messager.', krik: 'Krik, le petit crabe de la mangrove.' },
    en: { silo: 'Silo, the hummingbird messenger.', krik: 'Krik, the little mangrove crab.' }
  };
  document.querySelectorAll('.character-audio').forEach(button => {
    button.addEventListener('click', () => {
      const lang = document.documentElement.lang === 'en' ? 'en' : 'fr';
      if (!('speechSynthesis' in window)) {
        if (status) status.textContent = lang === 'fr' ? 'La lecture audio n’est pas disponible sur cet appareil.' : 'Audio playback is unavailable on this device.';
        return;
      }
      speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(phrases[lang][button.dataset.character]);
      utterance.lang = lang === 'fr' ? 'fr-FR' : 'en-US';
      if (status) status.textContent = lang === 'fr' ? 'Écoute en cours…' : 'Playing…';
      utterance.onend = () => { if (status) status.textContent = ''; };
      speechSynthesis.speak(utterance);
    });
  });
})();
