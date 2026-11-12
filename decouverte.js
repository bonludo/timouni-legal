(() => {
  let language = 'fr';
  const dialog = document.querySelector('#book-dialog');
  function translate(root = document) {
    root.querySelectorAll('[data-fr][data-en]').forEach(el => el.textContent = el.dataset[language]);
    for (const [attr, key] of [['src','src'],['alt','alt'],['aria-label','label'],['href','href']]) {
      root.querySelectorAll(`[data-${key}-fr]`).forEach(el => el.setAttribute(attr, el.dataset[key + (language === 'fr' ? 'Fr' : 'En')]));
    }
  }
  document.querySelectorAll('[data-language]').forEach(button => button.addEventListener('click', () => {
    language = button.dataset.language;
    document.documentElement.lang = language;
    document.title = language === 'fr' ? 'Timouni — L’Archipel des Souffles' : 'Timouni — The Whispering Isles';
    document.querySelectorAll('[data-language]').forEach(el => el.setAttribute('aria-pressed', String(el === button)));
    translate();
  }));
  document.querySelectorAll('[data-filter]').forEach(button => button.addEventListener('click', () => {
    document.querySelectorAll('[data-filter]').forEach(el => el.setAttribute('aria-pressed', String(el === button)));
    document.querySelectorAll('.book').forEach(el => el.hidden = button.dataset.filter !== 'all' && button.dataset.filter !== el.dataset.age);
  }));
  let opener;
  document.querySelectorAll('[data-book]').forEach(button => button.addEventListener('click', () => {
    opener = button;
    const content = dialog.querySelector('.dialog-content');
    content.replaceChildren(button.querySelector('.cover').cloneNode(true));
    const copy = document.createElement('div');
    const title = document.createElement('h2');
    title.textContent = button.querySelector('h3').textContent;
    copy.append(title, document.querySelector(`#summary-${button.dataset.book}`).content.cloneNode(true));
    const status = document.createElement('p'); status.className = 'dialog-status';
    status.textContent = language === 'fr' ? 'Aperçu de la collection · lancement prévu fin novembre–début décembre 2026.' : 'Collection preview · launch planned for late November–early December 2026.';
    copy.append(status); content.append(copy); translate(content); dialog.showModal();
  }));
  dialog.querySelector('.dialog-close').addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', event => { if(event.target === dialog) {const r=dialog.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)dialog.close();} });
  dialog.addEventListener('close', () => opener?.focus());
})();
