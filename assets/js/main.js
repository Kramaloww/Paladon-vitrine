// Site vitrine Paladon : thème, animations au défilement, onglets (démonstration et
// fonctionnalités), panneau du copilote, menu actif et formulaire de contact.
// Aucun framework, aucune dépendance, aucun appel réseau.
;(function () {
  'use strict'

  var root = document.documentElement
  // Langue de la page (fr ou en) : formats de nombres et petits textes générés par le script
  var isEnglish = (root.getAttribute('lang') || 'fr').slice(0, 2) === 'en'
  var LOCALE = isEnglish ? 'en-US' : 'fr-FR'
  var T = isEnglish
    ? { switchTo: 'Switch to ', light: 'light theme', dark: 'dark theme', lightShort: 'Light', darkShort: 'Dark', needMessage: 'Please write your message.', copied: 'Message copied. Paste it into an email to contact@paladon.net.', copyFailed: 'Copy failed: please select the text of your message manually.', to: 'To', subject: 'Subject' }
    : { switchTo: 'Passer au thème ', light: 'clair', dark: 'sombre', lightShort: 'Clair', darkShort: 'Sombre', needMessage: 'Merci d’écrire votre message.', copied: 'Message copié. Collez-le dans un e-mail à contact@paladon.net.', copyFailed: 'La copie a échoué : sélectionnez le texte de votre message à la main.', to: 'À', subject: 'Sujet' }
  var THEME_KEY = 'paladon-vitrine-theme'
  var reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)')
  var systemLight = window.matchMedia('(prefers-color-scheme: light)')

  function motionAllowed() {
    return !reducedMotion.matches
  }

  // ---------------------------------------------------------------------------------------
  // 1. Thème sombre / clair
  //    Tant que rien n'est choisi, on suit le système. Un clic mémorise le choix.
  // ---------------------------------------------------------------------------------------
  var toggle = document.querySelector('.theme-toggle')
  var toggleText = document.querySelector('.theme-toggle-text')

  function savedTheme() {
    try {
      return localStorage.getItem(THEME_KEY)
    } catch (e) {
      return null
    }
  }

  function applyTheme(theme) {
    root.setAttribute('data-theme', theme)
    var toLight = theme === 'dark'
    toggle.setAttribute('aria-label', T.switchTo + (toLight ? T.light : T.dark))
    toggleText.textContent = toLight ? T.lightShort : T.darkShort
  }

  applyTheme(root.getAttribute('data-theme') === 'light' ? 'light' : 'dark')

  toggle.addEventListener('click', function () {
    var theme = root.getAttribute('data-theme') === 'light' ? 'dark' : 'light'
    applyTheme(theme)
    try {
      localStorage.setItem(THEME_KEY, theme)
    } catch (e) {}
  })

  systemLight.addEventListener('change', function (event) {
    var saved = savedTheme()
    if (saved !== 'light' && saved !== 'dark') applyTheme(event.matches ? 'light' : 'dark')
  })

  // ---------------------------------------------------------------------------------------
  // 2. Chiffres qui défilent jusqu'à leur valeur (format français : 48 312,40 €)
  //    Le HTML contient déjà la valeur finale : sans JavaScript ou sans animation, rien ne change.
  // ---------------------------------------------------------------------------------------
  function formatNumber(value, decimals) {
    return new Intl.NumberFormat(LOCALE, {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(value)
  }

  function countUp(el) {
    if (!motionAllowed()) return
    var target = parseFloat(el.getAttribute('data-count'))
    var decimals = parseInt(el.getAttribute('data-decimals') || '0', 10)
    var suffix = (el.getAttribute('data-suffix') || '').replace(' ', ' ')
    var prefix = el.getAttribute('data-prefix') || '' // « € » avant le nombre en anglais
    var duration = 1100
    var start = null
    var token = {}
    el._countToken = token // un nouveau décompte annule le précédent

    function frame(now) {
      if (el._countToken !== token) return
      if (start === null) start = now
      var progress = Math.min((now - start) / duration, 1)
      var eased = 1 - Math.pow(1 - progress, 3) // ralentit en fin de course
      el.textContent = prefix + formatNumber(target * eased, decimals) + suffix
      if (progress < 1) requestAnimationFrame(frame)
    }
    requestAnimationFrame(frame)
    // Sécurité : la valeur finale est toujours affichée à la fin (onglet en arrière-plan, etc.)
    setTimeout(function () {
      if (el._countToken === token) el.textContent = prefix + formatNumber(target, decimals) + suffix
    }, duration + 100)
  }

  // Fait défiler une barre horizontale pour centrer l'élément choisi (onglets, menu sur téléphone)
  function centerInScroller(scroller, item) {
    if (scroller.scrollWidth <= scroller.clientWidth) return
    var delta = item.getBoundingClientRect().left - scroller.getBoundingClientRect().left
    scroller.scrollTo({
      left: scroller.scrollLeft + delta - (scroller.clientWidth - item.offsetWidth) / 2,
      behavior: motionAllowed() ? 'smooth' : 'auto',
    })
  }

  // Rejoue une animation CSS d'entrée sur un élément (classe « is-entering »)
  function playEnter(el) {
    if (!motionAllowed()) return
    el.classList.remove('is-entering')
    void el.offsetWidth // force le navigateur à repartir de zéro
    el.classList.add('is-entering')
  }

  // ---------------------------------------------------------------------------------------
  // 3. Apparition des sections au défilement (IntersectionObserver)
  //    La classe « motion-ok » active les styles d'animation (voir style.css).
  // ---------------------------------------------------------------------------------------
  var revealed = document.querySelectorAll('.reveal')
  var canAnimate = motionAllowed() && 'IntersectionObserver' in window

  function show(el) {
    el.classList.add('is-visible')
  }

  if (canAnimate) {
    root.classList.add('motion-ok')
    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return
          show(entry.target)
          // Seuls les chiffres visibles défilent (pas ceux des onglets cachés)
          entry.target.querySelectorAll('[data-count]').forEach(function (el) {
            if (!el.closest('[hidden]')) countUp(el)
          })
          observer.unobserve(entry.target)
        })
      },
      { threshold: 0.15, rootMargin: '0px 0px -40px 0px' },
    )
    revealed.forEach(function (el) {
      observer.observe(el)
    })
  } else {
    revealed.forEach(show)
  }

  // Si l'utilisateur coupe les animations pendant la visite : tout s'affiche immédiatement.
  reducedMotion.addEventListener('change', function (event) {
    if (event.matches) {
      root.classList.remove('motion-ok')
      revealed.forEach(show)
    }
  })

  // ---------------------------------------------------------------------------------------
  // 4. Onglets accessibles (démonstration, thèmes des fonctionnalités)
  //    Souris : clic. Clavier : flèches, Début, Fin (motif « tabs » de l'ARIA).
  // ---------------------------------------------------------------------------------------
  var windowTitle = document.querySelector('[data-window-title]')

  function initTabs(tablist) {
    var tabs = Array.prototype.slice.call(tablist.querySelectorAll('[role="tab"]'))
    var isWindow = tablist.hasAttribute('data-window-tabs')

    function select(tab, moveFocus) {
      tabs.forEach(function (t) {
        var selected = t === tab
        t.setAttribute('aria-selected', selected ? 'true' : 'false')
        t.tabIndex = selected ? 0 : -1
        document.getElementById(t.getAttribute('aria-controls')).hidden = !selected
      })
      var panel = document.getElementById(tab.getAttribute('aria-controls'))
      playEnter(panel)
      panel.querySelectorAll('[data-count]').forEach(countUp)
      if (moveFocus) tab.focus()
      // Garde l'onglet actif visible quand la barre défile (téléphone)
      centerInScroller(tablist, tab)
      if (isWindow && windowTitle) windowTitle.textContent = tab.textContent.trim()
    }

    tabs.forEach(function (tab, index) {
      tab.addEventListener('click', function () {
        if (tab.getAttribute('aria-selected') !== 'true') select(tab, false)
      })
      tab.addEventListener('keydown', function (event) {
        var next = null
        if (event.key === 'ArrowDown' || event.key === 'ArrowRight') next = tabs[(index + 1) % tabs.length]
        if (event.key === 'ArrowUp' || event.key === 'ArrowLeft') next = tabs[(index - 1 + tabs.length) % tabs.length]
        if (event.key === 'Home') next = tabs[0]
        if (event.key === 'End') next = tabs[tabs.length - 1]
        if (next) {
          event.preventDefault()
          select(next, true)
        }
      })
    })
  }

  document.querySelectorAll('[data-tabs]').forEach(initTabs)

  // ---------------------------------------------------------------------------------------
  // 5. Panneau du copilote dans la démonstration (bouton rond en bas à droite)
  // ---------------------------------------------------------------------------------------
  var fab = document.querySelector('.mock-fab')
  var copilot = document.getElementById('demo-copilot')
  var closeCopilot = copilot && copilot.querySelector('[data-copilot-close]')

  function setCopilot(open) {
    copilot.hidden = !open
    fab.setAttribute('aria-expanded', open ? 'true' : 'false')
    if (open) {
      playEnter(copilot)
      closeCopilot.focus()
    } else {
      fab.focus()
    }
  }

  if (fab && copilot) {
    fab.addEventListener('click', function () {
      setCopilot(copilot.hidden)
    })
    closeCopilot.addEventListener('click', function () {
      setCopilot(false)
    })
    copilot.addEventListener('keydown', function (event) {
      if (event.key === 'Escape') setCopilot(false)
    })
  }

  // ---------------------------------------------------------------------------------------
  // 5 bis. Bouton de langue : garde la section affichée (#ancre) en changeant de langue,
  //        et mémorise le choix dans le navigateur (rien n'est envoyé)
  // ---------------------------------------------------------------------------------------
  document.querySelectorAll('[data-lang-switch]').forEach(function (link) {
    link.addEventListener('click', function () {
      try {
        localStorage.setItem('paladon-vitrine-lang', link.getAttribute('data-lang-switch'))
      } catch (e) {}
      if (location.hash) link.setAttribute('href', link.getAttribute('href').split('#')[0] + location.hash)
    })
  })

  // ---------------------------------------------------------------------------------------
  // 6. Menu : la rubrique de la section affichée est mise en avant (pilule active)
  // ---------------------------------------------------------------------------------------
  var navLinks = document.querySelectorAll('.site-nav a')
  var navScroller = document.querySelector('.site-nav')
  var sections = []
  navLinks.forEach(function (link) {
    var href = link.getAttribute('href')
    var target = href.charAt(0) === '#' ? document.querySelector(href) : null
    if (target) sections.push({ link: link, target: target })
  })

  var activeLink
  function updateActive() {
    if (!sections.length) return
    var line = window.innerHeight * 0.35
    var current = null
    sections.forEach(function (s) {
      if (s.target.getBoundingClientRect().top <= line) current = s.link
    })
    // Tout en bas de la page, la dernière rubrique est active
    if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4) {
      current = sections[sections.length - 1].link
    }
    if (current === activeLink) return
    activeLink = current
    navLinks.forEach(function (l) {
      if (l === current) l.setAttribute('aria-current', 'true')
      else l.removeAttribute('aria-current')
    })
    // Sur téléphone, le menu défile pour garder la rubrique active visible
    if (current) centerInScroller(navScroller, current)
  }

  var ticking = false
  window.addEventListener(
    'scroll',
    function () {
      if (ticking) return
      ticking = true
      requestAnimationFrame(function () {
        updateActive()
        ticking = false
      })
    },
    { passive: true },
  )
  updateActive()

  // ---------------------------------------------------------------------------------------
  // 7. Formulaire de contact : ouvre la messagerie (mailto:), aucun serveur
  // ---------------------------------------------------------------------------------------
  var form = document.getElementById('contact-form')
  var error = document.getElementById('cf-error')
  var CONTACT_EMAIL = 'contact@paladon.net'
  var fallback = document.getElementById('cf-fallback')
  var copyStatus = document.getElementById('cf-copy-status')
  var copyText = ''

  // « Copier le message » : presse-papiers du navigateur (rien n'est envoyé)
  var copyButton = document.getElementById('cf-copy')
  if (copyButton) copyButton.addEventListener('click', function () {
    function done(ok) { copyStatus.textContent = ok ? T.copied : T.copyFailed }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(copyText).then(function () { done(true) }, function () { done(false) })
    } else {
      done(false)
    }
  })

  if (form) form.addEventListener('submit', function (event) {
    event.preventDefault()
    var name = form.elements.name.value.trim()
    var subject = form.elements.subject.value.trim()
    var message = form.elements.message
    var topicInput = form.querySelector('input[name="topic"]:checked')
    var topic = topicInput ? topicInput.value : 'Message'

    // Seul le message est obligatoire
    var empty = message.value.trim() === ''
    message.setAttribute('aria-invalid', empty ? 'true' : 'false')
    if (empty) {
      error.textContent = T.needMessage
      message.focus()
      return
    }
    error.textContent = ''

    // Sujet du courriel : [Paladon] + objet choisi (+ précision éventuelle), pour trier facilement
    var mailSubject = '[Paladon] ' + topic + (subject ? ' : ' + subject : '')
    var body = message.value.trim() + (name ? '\n\n' + name : '')

    // Solutions de secours, affichées sous le bouton : si aucun logiciel de mail n'est associé
    // aux liens mailto: (fréquent avec un webmail), le clic ne fait rien. On propose alors
    // Gmail, Outlook.com ou la copie du message. Ces sites ne sont contactés que si on clique.
    var enc = encodeURIComponent
    document.getElementById('cf-gmail').href =
      'https://mail.google.com/mail/?view=cm&fs=1&to=' + enc(CONTACT_EMAIL) + '&su=' + enc(mailSubject) + '&body=' + enc(body)
    document.getElementById('cf-outlook').href =
      'https://outlook.live.com/mail/0/deeplink/compose?to=' + enc(CONTACT_EMAIL) + '&subject=' + enc(mailSubject) + '&body=' + enc(body)
    copyText = T.to + ' : ' + CONTACT_EMAIL + '\n' + T.subject + ' : ' + mailSubject + '\n\n' + body
    copyStatus.textContent = ''
    fallback.hidden = false

    window.location.href =
      'mailto:' +
      CONTACT_EMAIL +
      '?subject=' +
      encodeURIComponent(mailSubject) +
      '&body=' +
      encodeURIComponent(body)
  })
})()
