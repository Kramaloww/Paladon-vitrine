// Appliqué dans le <head>, avant l'affichage de la page, pour éviter un flash du mauvais thème.
// Thème choisi (mémorisé) en priorité ; sinon la préférence du système ; sombre par défaut.
// Fichier séparé (et non en ligne) : compatible avec une politique de sécurité stricte (CSP).
;(function () {
  var saved = null
  try {
    saved = localStorage.getItem('paladon-vitrine-theme')
  } catch (e) {}
  var theme =
    saved === 'light' || saved === 'dark'
      ? saved
      : window.matchMedia('(prefers-color-scheme: light)').matches
        ? 'light'
        : 'dark'
  document.documentElement.setAttribute('data-theme', theme)
  document.documentElement.classList.add('js')
})()
