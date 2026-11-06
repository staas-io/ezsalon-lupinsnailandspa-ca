/* Site behaviour that the original (Nuxt/Vue) site did in JavaScript. Plain JS, no framework. */
(function () {
  'use strict';

  function ready(fn) {
    if (document.readyState !== 'loading') fn();
    else document.addEventListener('DOMContentLoaded', fn);
  }

  // Click or Enter/Space on non-button elements that act as buttons
  function onActivate(el, handler) {
    el.addEventListener('click', handler);
    el.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        handler(e);
      }
    });
  }

  /* ---------------------------------------------------------- mobile menu */
  function initMobileMenu() {
    const toggle = document.getElementById('navToggle');
    const menu = document.getElementById('navMenu');
    if (!toggle || !menu) return;

    function setOpen(open) {
      toggle.classList.toggle('active', open);
      toggle.setAttribute('aria-expanded', String(open));
      menu.style.height = open ? menu.scrollHeight + 'px' : '0px';
    }
    toggle.addEventListener('click', function () {
      setOpen(!toggle.classList.contains('active'));
    });
    window.addEventListener('resize', function () {
      if (toggle.classList.contains('active')) menu.style.height = menu.scrollHeight + 'px';
    });
  }

  /* ---------------------------------------------------------- accordions */
  function setAccordion(acc, open) {
    const head = acc.firstElementChild && acc.querySelector(':scope > div:not(.span__transition)');
    const panel = acc.querySelector('.span__transition');
    const arrow = acc.querySelector('.rotate__span');
    if (!panel) return;
    acc.classList.toggle('is-open', open);
    panel.style.height = open ? panel.scrollHeight + 'px' : '0px';
    if (arrow) arrow.classList.toggle('active', open);
    if (head) head.setAttribute('aria-expanded', String(open));
  }

  function initAccordions() {
    const accordions = document.querySelectorAll('.accordion');
    accordions.forEach(function (acc) {
      const head = acc.querySelector(':scope > div:not(.span__transition)');
      if (!head) return;
      head.setAttribute('role', 'button');
      head.setAttribute('tabindex', '0');
      head.setAttribute('aria-expanded', 'false');
      onActivate(head, function () {
        setAccordion(acc, !acc.classList.contains('is-open'));
      });
    });

    // "Menu" bar shown on small screens: expand / collapse every category
    const all = document.querySelector('[data-accordion-all]');
    if (all) {
      all.addEventListener('click', function () {
        const open = all.getAttribute('aria-expanded') !== 'true';
        all.setAttribute('aria-expanded', String(open));
        accordions.forEach(function (acc) { setAccordion(acc, open); });
      });
    }
  }

  /* ---------------------------------------------------------- sliders */
  function autoplay(fn, ms, root) {
    let timer = null;
    function start() { stop(); timer = setInterval(fn, ms); }
    function stop() { if (timer) clearInterval(timer); timer = null; }
    if (root) {
      root.addEventListener('mouseenter', stop);
      root.addEventListener('mouseleave', start);
    }
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return { start: stop, stop: stop };
    start();
    return { start: start, stop: stop };
  }

  function initHero() {
    const hero = document.querySelector('[data-hero-slider]');
    if (!hero) return;
    const slides = hero.querySelectorAll('.swiper-slide');
    const dots = hero.querySelectorAll('.pagin > div > div');
    const next = hero.querySelector('.custom-next');
    const prev = hero.querySelector('.custom-prev');
    if (slides.length < 2) { if (slides[0]) slides[0].classList.add('is-active'); return; }
    let index = 0;

    function show(i) {
      index = (i + slides.length) % slides.length;
      slides.forEach(function (s, n) { s.classList.toggle('is-active', n === index); });
      dots.forEach(function (d, n) { d.classList.toggle('!bg-[#555]', n === index); });
    }
    const timer = autoplay(function () { show(index + 1); }, 5000, hero);
    if (next) next.addEventListener('click', function () { show(index + 1); timer.start(); });
    if (prev) prev.addEventListener('click', function () { show(index - 1); timer.start(); });
    dots.forEach(function (d, n) { d.addEventListener('click', function () { show(n); timer.start(); }); });
    show(0);
  }

  function initTestimonials() {
    const root = document.querySelector('.swiper:not(.swiper-fade)');
    if (!root) return;
    root.setAttribute('data-testimonials', '');
    const wrapper = root.querySelector('.swiper-wrapper');
    const slides = root.querySelectorAll('.swiper-slide');
    const arrows = root.parentElement.querySelectorAll('.arrow__slider img');
    if (!wrapper || slides.length < 2) return;
    let index = 0;
    function show(i) {
      index = (i + slides.length) % slides.length;
      wrapper.style.transform = 'translateX(' + (-100 * index) + '%)';
    }
    const timer = autoplay(function () { show(index + 1); }, 6000, root.parentElement);
    if (arrows[0]) arrows[0].addEventListener('click', function () { show(index - 1); timer.start(); });
    if (arrows[1]) arrows[1].addEventListener('click', function () { show(index + 1); timer.start(); });
    arrows.forEach(function (a, n) {
      a.setAttribute('role', 'button');
      a.setAttribute('tabindex', '0');
      a.setAttribute('aria-label', n === 0 ? 'Previous testimonial' : 'Next testimonial');
      a.addEventListener('keydown', function (e) { if (e.key === 'Enter') a.click(); });
    });
  }

  /* ---------------------------------------------------------- announcement popup */
  function initPopup() {
    const popup = document.getElementById('announcement-popup');
    if (!popup) return;
    const slides = popup.querySelectorAll('.mySlides');
    let index = slides.length - 1; // newest poster first
    function show(i) {
      index = (i + slides.length) % slides.length;
      slides.forEach(function (s, n) { s.style.display = n === index ? 'block' : 'none'; });
    }
    function close() { popup.style.display = 'none'; }
    show(index);
    const prev = popup.querySelector('.prev');
    const next = popup.querySelector('.next');
    if (prev) onActivate(prev, function () { show(index - 1); });
    if (next) onActivate(next, function () { show(index + 1); });
    const x = popup.querySelector('.close-btn');
    if (x) x.addEventListener('click', close);
    const overlay = popup.querySelector('.overlay-click');
    if (overlay) overlay.addEventListener('click', close);
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') close(); });
    popup.style.display = 'block';
  }

  /* ---------------------------------------------------------- back to top */
  function initScrollTop() {
    const btn = document.getElementById('scroll-top');
    if (!btn) return;
    function update() {
      const show = window.scrollY > 300;
      btn.style.opacity = show ? '1' : '0';
      btn.style.visibility = show ? 'visible' : 'hidden';
    }
    window.addEventListener('scroll', update, { passive: true });
    onActivate(btn, function () { window.scrollTo({ top: 0, behavior: 'smooth' }); });
    update();
  }

  /* ---------------------------------------------------------- gallery */
  // Class strings copied from the original (Nuxt UI) pagination buttons
  const PAGE_BTN_PREV = 'focus:outline-none focus-visible:outline-0 disabled:cursor-not-allowed disabled:opacity-75 aria-disabled:cursor-not-allowed aria-disabled:opacity-75 flex-shrink-0 font-medium text-sm gap-x-2.5 p-2.5 shadow-sm ring-1 ring-inset ring-gray-300 dark:ring-gray-700 text-gray-900 dark:text-white bg-white hover:bg-gray-50 disabled:bg-white aria-disabled:bg-white dark:bg-gray-900 dark:hover:bg-gray-800/50 dark:disabled:bg-gray-900 dark:aria-disabled:bg-gray-900 focus-visible:ring-2 focus-visible:ring-primary-500 dark:focus-visible:ring-primary-400 inline-flex items-center first:rounded-s-md last:rounded-e-md rtl:[&_span:first-child]:rotate-180';
  const PAGE_BTN_CURRENT = 'focus:outline-none disabled:cursor-not-allowed disabled:opacity-75 aria-disabled:cursor-not-allowed aria-disabled:opacity-75 flex-shrink-0 font-medium text-sm gap-x-2.5 px-3.5 py-2.5 shadow-sm text-white dark:text-gray-900 bg-primary-500 hover:bg-primary-600 disabled:bg-primary-500 aria-disabled:bg-primary-500 dark:bg-primary-400 dark:hover:bg-primary-500 dark:disabled:bg-primary-400 dark:aria-disabled:bg-primary-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500 dark:focus-visible:outline-primary-400 inline-flex items-center z-[1] first:rounded-s-md last:rounded-e-md';
  const PAGE_BTN_IDLE = 'focus:outline-none focus-visible:outline-0 disabled:cursor-not-allowed disabled:opacity-75 aria-disabled:cursor-not-allowed aria-disabled:opacity-75 flex-shrink-0 font-medium text-sm gap-x-2.5 px-3.5 py-2.5 shadow-sm ring-1 ring-inset ring-gray-300 dark:ring-gray-700 text-gray-900 dark:text-white bg-white hover:bg-gray-50 disabled:bg-white aria-disabled:bg-white dark:bg-gray-900 dark:hover:bg-gray-800/50 dark:disabled:bg-gray-900 dark:aria-disabled:bg-gray-900 focus-visible:ring-2 focus-visible:ring-primary-500 dark:focus-visible:ring-primary-400 inline-flex items-center first:rounded-s-md last:rounded-e-md';
  const PAGE_BTN_NEXT = 'focus:outline-none focus-visible:outline-0 disabled:cursor-not-allowed disabled:opacity-75 aria-disabled:cursor-not-allowed aria-disabled:opacity-75 flex-shrink-0 font-medium text-sm gap-x-2.5 p-2.5 shadow-sm ring-1 ring-inset ring-gray-300 dark:ring-gray-700 text-gray-900 dark:text-white bg-white hover:bg-gray-50 disabled:bg-white aria-disabled:bg-white dark:bg-gray-900 dark:hover:bg-gray-800/50 dark:disabled:bg-gray-900 dark:aria-disabled:bg-gray-900 focus-visible:ring-2 focus-visible:ring-primary-500 dark:focus-visible:ring-primary-400 inline-flex items-center first:rounded-s-md last:rounded-e-md rtl:[&_span:last-child]:rotate-180';
  const PER_PAGE = 9;

  function initGallery() {
    const grid = document.getElementById('gallery-grid');
    const pager = document.getElementById('gallery-pagination');
    if (!grid || !pager) return;
    const items = Array.prototype.slice.call(grid.querySelectorAll('[data-gallery-item]'));
    const tabs = document.querySelectorAll('[data-gallery-tab]');
    // The original lists every picture under "All" and "Nail Design"; "Nail Salon" has none.
    const tabHasItems = { 'all': true, 'nail-design': true, 'nail-salon': false };
    let tab = 'all';
    let page = 1;

    function render() {
      const visible = tabHasItems[tab] ? items : [];
      const pages = Math.max(1, Math.ceil(visible.length / PER_PAGE));
      page = Math.min(page, pages);
      items.forEach(function (el) { el.style.display = 'none'; });
      visible.slice((page - 1) * PER_PAGE, page * PER_PAGE).forEach(function (el) { el.style.display = ''; });

      let html = '<div class="flex items-center -space-x-px">';
      html += '<button type="button" class="' + PAGE_BTN_PREV + '" aria-label="Prev" data-page="' + (page - 1) + '"' + (page === 1 ? ' disabled' : '') + '><span class="iconify i-heroicons:chevron-left-20-solid flex-shrink-0 h-5 w-5" aria-hidden="true"></span></button>';
      for (let p = 1; p <= pages; p++) {
        html += '<button type="button" class="' + (p === page ? PAGE_BTN_CURRENT : PAGE_BTN_IDLE) + '" data-page="' + p + '"' + (p === page ? ' aria-current="page"' : '') + '><span>' + p + '</span></button>';
      }
      html += '<button type="button" class="' + PAGE_BTN_NEXT + '" aria-label="Next" data-page="' + (page + 1) + '"' + (page === pages ? ' disabled' : '') + '><span class="iconify i-heroicons:chevron-right-20-solid flex-shrink-0 h-5 w-5" aria-hidden="true"></span></button></div>';
      pager.innerHTML = pages > 1 ? html : '';
    }

    pager.addEventListener('click', function (e) {
      const btn = e.target.closest('button[data-page]');
      if (!btn || btn.disabled) return;
      page = parseInt(btn.dataset.page, 10);
      render();
      grid.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
    tabs.forEach(function (t) {
      onActivate(t, function () {
        tab = t.dataset.galleryTab;
        page = 1;
        tabs.forEach(function (o) { o.classList.toggle('active', o === t); });
        render();
      });
    });
    render();
  }

  /* ---------------------------------------------------------- contact form */
  function initContactForm() {
    const form = document.getElementById('contact-form');
    if (!form) return;
    const status = document.createElement('p');
    status.className = 'form-status';
    status.setAttribute('role', 'status');
    form.appendChild(status);

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!form.checkValidity()) {
        form.reportValidity();
        return;
      }
      // No form backend exists for this static site: hand the message to the visitor's mail app.
      const mail = document.getElementById('footer-email');
      const to = mail ? mail.textContent.trim() : 'Lupinspeiholding@gmail.com';
      const data = new FormData(form);
      const body = data.get('message') + '\n\n' + data.get('name') + ' <' + data.get('email') + '>';
      window.location.href = 'mailto:' + to + '?subject=' + encodeURIComponent(data.get('subject')) + '&body=' + encodeURIComponent(body);
      status.textContent = 'Opening your email app. You can also call us at ' + (document.getElementById('footer-phone') || { textContent: '' }).textContent + '.';
    });
  }

  ready(function () {
    initMobileMenu();
    initAccordions();
    initHero();
    initTestimonials();
    initPopup();
    initScrollTop();
    initGallery();
    initContactForm();
  });
})();
