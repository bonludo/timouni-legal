// Anciennes adresses GitHub Pages (bonludo.github.io/timouni-legal/...) -> https://timouni.com/...
if (location.hostname.endsWith('github.io')) {
  location.replace('https://timouni.com/' + location.pathname.replace(/^\/timouni-legal\/?/, '') + location.hash);
}
