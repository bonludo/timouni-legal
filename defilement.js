(() => {
  const root = document.documentElement;
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const sprites = [...document.querySelectorAll('.hero .silo-sprite image')];
  const frameOrder = [3, 1, 2, 1]; // Cycle exact du jeu : [3, 1, 2, 1] à 24 i/s.
  let frameTick = 0;
  let lastTime = 0;
  let visible = document.visibilityState === 'visible';
  let anySpriteVisible = true;
  function setFrame(index) {
    const frame = frameOrder[index % frameOrder.length];
    const column = frame % 2;
    const row = Math.floor(frame / 2);
    const x = column ? -617 : -4;
    const y = row ? -614 : 0;
    sprites.forEach(sprite => { sprite.setAttribute('x', x); sprite.setAttribute('y', y); });
  }
  setFrame(0);
  function animateSprites(time) {
    if (!reduceMotion.matches && !root.classList.contains('motion-paused') && visible && anySpriteVisible && time-lastTime >= 1000/24) {
      lastTime = time;
      frameTick = (frameTick + 1) % frameOrder.length;
      setFrame(frameTick);
    }
    requestAnimationFrame(animateSprites);
  }
  requestAnimationFrame(animateSprites);
  document.addEventListener('visibilitychange', () => { visible = document.visibilityState === 'visible'; });
  if ('IntersectionObserver' in window) {
    const spriteObserver = new IntersectionObserver(entries => {
      anySpriteVisible = entries.some(entry => entry.isIntersecting);
    }, { threshold: 0 });
    sprites.forEach(sprite => spriteObserver.observe(sprite.closest('.silo-sprite')));
  }

  // Un chapitre entier reste épinglé; images et textes avancent ensemble au scroll.
  const chapters = [...document.querySelectorAll('[data-scroll-chapter]')].map(section => ({
    section,
    pin: section.querySelector('.experience-pin, .living-pin'),
    visual: section.querySelector('.scroll-visual'),
    list: section.querySelector('.scroll-steps'),
    active: -1,
    pending: -1,
    revision: 0
  })).filter(chapter => chapter.pin && chapter.visual && chapter.list);
  async function activateChapter(chapter, index) {
    if (chapter.active === index || chapter.pending === index) return;
    chapter.pending = index;
    const revision = ++chapter.revision;
    const panels = [...chapter.visual.querySelectorAll('[data-scene]')];
    const steps = [...chapter.list.querySelectorAll(':scope > li, :scope > .feature-line')];
    const image = panels[index]?.querySelector('img');
    if (image && !image.complete) {
      image.loading = 'eager';
      try { await image.decode(); } catch {}
    }
    if (revision !== chapter.revision) return;
    const previous = chapter.active;
    chapter.active = index;
    chapter.pending = -1;
    panels.forEach((panel, i) => {
      const current = i === index;
      if (current) panel.hidden = false;
      panel.classList.toggle('is-active', current);
      panel.setAttribute('aria-hidden', String(!current));
      if (i === previous && !current) setTimeout(() => {
        if (!panel.classList.contains('is-active')) panel.hidden = true;
      }, 650);
      if (i !== index && i !== previous) panel.hidden = true;
    });
    steps.forEach((step, i) => {
      const current = i === index;
      step.classList.toggle('is-active', current);
      step.setAttribute('aria-hidden', String(!current));
    });
    if (chapter.section.id === 'atouts') {
      const layers = chapter.section.querySelectorAll('.living-backdrop i');
      const source = index === 0 ? 'assets/decouverte-v02/salome-aventure-v01.png' : (panels[index]?.dataset.backdrop || panels[index]?.querySelector('img')?.getAttribute('src'));
      if (layers.length && source) {
        const next = layers[index % 2];
        next.style.backgroundImage = `url("${source}")`;
        layers.forEach(layer => layer.classList.toggle('is-active', layer === next));
      }
    }
    const counter = chapter.visual.querySelector('.scene-counter');
    if (counter) counter.textContent = `${String(index + 1).padStart(2, '0')} / ${String(Math.min(panels.length, steps.length)).padStart(2, '0')}`;
    chapter.visual.dataset.activeScene = String(index);
  }
  function updateChapters() {
    chapters.forEach(chapter => {
      const steps = chapter.list.querySelectorAll(':scope > li, :scope > .feature-line');
      const count = Math.min(chapter.visual.querySelectorAll('[data-scene]').length, steps.length);
      if (!count) return;
      const rect = chapter.section.getBoundingClientRect();
      const scrollRange = Math.max(1, chapter.section.offsetHeight - chapter.pin.offsetHeight);
      const progress = Math.max(0, Math.min(0.999999, -rect.top / scrollRange));
      activateChapter(chapter, Math.min(count - 1, Math.floor(progress * count)));
    });
    root.classList.add('scroll-chapters-ready');
  }

  // Découverte sonore déclenchée seulement par l’action explicite du visiteur.
  const status = document.querySelector('.speech-status');
  function speak(text) {
    const lang = document.documentElement.lang === 'en' ? 'en-US' : 'fr-FR';
    if (!('speechSynthesis' in window)) {
      if (status) status.textContent = lang === 'fr-FR' ? 'La lecture audio n’est pas disponible sur cet appareil.' : 'Audio playback is unavailable on this device.';
      return;
    }
    speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang;
    utterance.onstart = () => { if (status) status.textContent = lang === 'fr-FR' ? 'Écoute en cours…' : 'Playing…'; };
    utterance.onend = () => { if (status) status.textContent = ''; };
    speechSynthesis.speak(utterance);
  }
  document.querySelector('.speak-word')?.addEventListener('click', () => speak('Mangrove'));
  document.querySelector('.speak-definition')?.addEventListener('click', () => {
    const definition = document.querySelector('#word-definition');
    const key = document.documentElement.lang === 'en' ? 'en' : 'fr';
    speak(definition?.dataset[key] || definition?.textContent || '');
  });

  const bookAudioButton = document.querySelector('.book-audio');
  const bookAudio = new Audio();
  bookAudioButton?.addEventListener('click', async () => {
    const en = document.documentElement.lang === 'en';
    const status = document.querySelector('.book-audio-status');
    const source = en ? 'assets/decouverte-v02/krik-kiki-en.mp3' : 'assets/decouverte-v02/krik-kiki-fr.mp3';
    if (bookAudio.dataset.source !== source) { bookAudio.src = source; bookAudio.dataset.source = source; }
    if (!bookAudio.paused) { bookAudio.pause(); if (status) status.textContent = ''; return; }
    try { await bookAudio.play(); if (status) status.textContent = en ? 'Playing…' : 'Écoute en cours…'; }
    catch { if (status) status.textContent = en ? 'Audio unavailable.' : 'Audio indisponible.'; }
  });
  bookAudio.addEventListener('ended', () => { const status = document.querySelector('.book-audio-status'); if (status) status.textContent = ''; });
  // Parallaxe du panorama et léger décalage du premier plan.
  const hero = document.querySelector('.hero');
  let scrollQueued = false;
  function parallax() {
    if (!hero || reduceMotion.matches || root.classList.contains('motion-paused')) return;
    const progress = Math.max(0, Math.min(1, scrollY / Math.max(hero.offsetHeight, 1)));
    const horizon = hero.querySelector('.horizon');
    if (horizon) horizon.style.transform = `translate3d(0, ${Math.min(scrollY, 1000) * .12}px, 0)`;
    const zoom = document.querySelector('.zoom-journey');
    if (zoom) {
      const bounds = zoom.getBoundingClientRect();
      const phase = Math.max(0, Math.min(1, -bounds.top / Math.max(1, zoom.offsetHeight - innerHeight)));
      zoom.querySelectorAll('img:not(.zoom-final)').forEach((img, i) => { img.style.transform = `scale(${1 + phase * (0.6 + i * 0.25)})`; });
      zoom.style.setProperty('--zoom-fade', Math.max(0, Math.min(1, (phase - .60) / .30)));
      zoom.nextElementSibling?.style.setProperty('--chapter-reveal', Math.max(0, Math.min(1, (phase - .91) / .09))); 
    }
    const foreground = hero.querySelector('.explorers');
    if (foreground) foreground.style.setProperty('--foreground-shift', `${-progress * 60}px`);
  }
  function updateScrollScenes() {
    if (scrollQueued) return;
    scrollQueued = true;
    requestAnimationFrame(() => {
      scrollQueued = false;
      updateChapters();
      parallax();
    });
  }
  addEventListener('scroll', updateScrollScenes, { passive: true });
  addEventListener('resize', updateScrollScenes, { passive: true });
  document.querySelector('.motion-toggle')?.addEventListener('click', () => {
    if (root.classList.contains('motion-paused')) {
      document.querySelector('.zoom-journey + .living')?.style.setProperty('--chapter-reveal', '1');
      if (hero?.querySelector('.horizon')) hero.querySelector('.horizon').style.transform = '';
    } else parallax();
  });
  reduceMotion.addEventListener('change', () => {
    if (reduceMotion.matches) {
      document.querySelector('.zoom-journey + .living')?.style.setProperty('--chapter-reveal', '1');
      if (hero?.querySelector('.horizon')) hero.querySelector('.horizon').style.transform = '';
    } else parallax();
  });
  updateChapters();
  parallax();
})();
