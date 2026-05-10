const reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function initHeaderScrollEffect() {
  const header = document.querySelector('.home-header');
  if (!header) return;

  const toggleHeaderState = () => {
    header.classList.toggle('is-scrolled', window.scrollY > 12);
  };

  toggleHeaderState();
  window.addEventListener('scroll', toggleHeaderState, { passive: true });
}

initHeaderScrollEffect();

const menuBtn = document.getElementById('homeMenuBtn');
const nav = document.getElementById('homeNav');

if (menuBtn && nav) {
  const closeMobileMenu = () => {
    nav.classList.remove('is-open');
    menuBtn.setAttribute('aria-expanded', 'false');
  };

  const isMobileViewport = () => window.matchMedia('(max-width: 900px)').matches;

  menuBtn.addEventListener('click', (event) => {
    event.stopPropagation();
    const willOpen = !nav.classList.contains('is-open');
    nav.classList.toggle('is-open', willOpen);
    menuBtn.setAttribute('aria-expanded', willOpen ? 'true' : 'false');
  });

  nav.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', closeMobileMenu);
  });

  document.addEventListener('click', (event) => {
    if (!isMobileViewport() || !nav.classList.contains('is-open')) return;
    if (nav.contains(event.target) || menuBtn.contains(event.target)) return;
    closeMobileMenu();
  });

  window.addEventListener('scroll', () => {
    if (!isMobileViewport()) return;
    closeMobileMenu();
  }, { passive: true });

  window.addEventListener('resize', () => {
    if (!isMobileViewport()) {
      closeMobileMenu();
    }
  });
}

function setupSessionState() {
  const sessionLink = document.getElementById('homeSessionLink');
  const logoutBtn = document.getElementById('homeLogoutBtn');

  if (!sessionLink && !logoutBtn) return;

  const token = localStorage.getItem('token');
  let user = null;
  try {
    user = JSON.parse(localStorage.getItem('user') || 'null');
  } catch (_error) {
    user = null;
  }

  if (token && sessionLink) {
    sessionLink.textContent = user?.role === 'admin' ? 'Aprobaciones' : 'Mi cuenta';
    sessionLink.href = user?.role === 'admin' ? 'admin-users.html' : 'perfil.html';
  }

  if (token && logoutBtn) {
    logoutBtn.style.display = 'inline-flex';
  }

  logoutBtn?.addEventListener('click', () => {
    const confirmar = window.confirm('¿Cerrar sesión?');
    if (!confirmar) return;

    localStorage.removeItem('token');
    localStorage.removeItem('usuarioEmail');
    localStorage.removeItem('user');
    localStorage.removeItem('recordarSesion');
    window.location.href = 'login.html';
  });
}

setupSessionState();

function setupNotifications(buttonId, panelId, countId) {
  const btn = document.getElementById(buttonId);
  const panel = document.getElementById(panelId);
  const count = document.getElementById(countId);
  if (!btn || !panel) return;

  const storageKey = `notif-read-${buttonId}`;
  const isRead = localStorage.getItem(storageKey) === '1';
  if (isRead && count) {
    count.textContent = '0';
  }

  btn.addEventListener('click', (event) => {
    event.stopPropagation();
    const willOpen = !panel.classList.contains('is-open');
    panel.classList.toggle('is-open', willOpen);
    btn.setAttribute('aria-expanded', willOpen ? 'true' : 'false');

    if (willOpen && count) {
      count.textContent = '0';
      localStorage.setItem(storageKey, '1');
    }
  });

  document.addEventListener('click', (event) => {
    if (!panel.contains(event.target) && !btn.contains(event.target)) {
      panel.classList.remove('is-open');
      btn.setAttribute('aria-expanded', 'false');
    }
  });
}

setupNotifications('homeNotifBtn', 'homeNotifPanel', 'homeNotifCount');

const revealSelector = '.home-section, .home-banner__caption--hero, .home-mosaic__item, .home-impact__card, .home-events-strip__grid article, .home-testimonials__grid article, .home-allies__grid article, .home-ally-card, .home-map-wrap, .home-map-info, .home-final-cta__card, .fade-in, [data-reveal]';

if (reduceMotion) {
  document.querySelectorAll(revealSelector).forEach((el) => el.classList.add('is-visible'));
} else {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      entry.target.classList.toggle('is-visible', entry.isIntersecting);
    });
  }, { threshold: 0.14, rootMargin: '0px 0px -8% 0px' });

  document.querySelectorAll(revealSelector).forEach((el) => {
    el.classList.add('reveal-on-scroll');
    observer.observe(el);
  });
}

document.querySelectorAll('[data-reveal-stagger]').forEach((el, index) => {
  if (el.style.getPropertyValue('--reveal-delay')) return;
  el.style.setProperty('--reveal-delay', `${Math.min(index * 70, 350)}ms`);
});

function setupCarousel(carousel) {
  const dotsWrap = carousel.querySelector('.home-banner__dots');
  const prevBtn = carousel.querySelector('.home-banner__control--prev');
  const nextBtn = carousel.querySelector('.home-banner__control--next');
  const slides = Array.from(carousel.querySelectorAll('.home-banner__item'));

  if (!dotsWrap || slides.length < 2) return;

  let current = slides.findIndex((slide) => slide.classList.contains('is-active'));
  if (current < 0) current = 0;

  let timerId;
  const autoplayMs = Number(carousel.dataset.autoplay || 4000);

  function render(index) {
    slides.forEach((slide, i) => {
      const isActive = i === index;
      slide.classList.toggle('is-active', isActive);
      slide.setAttribute('aria-hidden', isActive ? 'false' : 'true');
    });

    dotsWrap.querySelectorAll('button').forEach((dot, i) => {
      dot.classList.toggle('is-active', i === index);
      dot.setAttribute('aria-label', `Mostrar slide ${i + 1}`);
    });
  }

  function startAutoplay() {
    clearInterval(timerId);
    timerId = setInterval(() => {
      current = (current + 1) % slides.length;
      render(current);
    }, autoplayMs);
  }

  function stopAutoplay() {
    clearInterval(timerId);
  }

  slides.forEach((_, i) => {
    const dot = document.createElement('button');
    dot.type = 'button';
    dot.addEventListener('click', () => {
      current = i;
      render(current);
      startAutoplay();
    });
    dotsWrap.appendChild(dot);
  });

  if (prevBtn) {
    prevBtn.addEventListener('click', () => {
      current = (current - 1 + slides.length) % slides.length;
      render(current);
      startAutoplay();
    });
  }

  if (nextBtn) {
    nextBtn.addEventListener('click', () => {
      current = (current + 1) % slides.length;
      render(current);
      startAutoplay();
    });
  }

  carousel.addEventListener('mouseenter', stopAutoplay);
  carousel.addEventListener('mouseleave', startAutoplay);
  carousel.addEventListener('focusin', stopAutoplay);
  carousel.addEventListener('focusout', (event) => {
    if (!carousel.contains(event.relatedTarget)) {
      startAutoplay();
    }
  });

  render(current);
  startAutoplay();
}

document.querySelectorAll('.home-banner').forEach((carousel) => {
  setupCarousel(carousel);
});

function setupMediaLightbox() {
  const lightbox = document.getElementById('mediaLightbox');
  const carousel = document.getElementById('homeMediaBanner');
  if (!lightbox || !carousel) return;

  const imageEl = document.getElementById('mediaLightboxImage');
  const titleEl = document.getElementById('mediaLightboxTitle');
  const textEl = document.getElementById('mediaLightboxText');

  const openLightbox = (slide) => {
    const img = slide.querySelector('img');
    if (!img) return;
    imageEl.src = img.src;
    imageEl.alt = img.alt || 'Imagen ampliada de galería';
    titleEl.textContent = slide.dataset.title || 'Galería afrocrece';
    textEl.textContent = slide.dataset.description || '';
    lightbox.classList.add('is-open');
    lightbox.setAttribute('aria-hidden', 'false');
    document.body.classList.add('modal-open');
  };

  const closeLightbox = () => {
    lightbox.classList.remove('is-open');
    lightbox.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('modal-open');
  };

  carousel.addEventListener('click', (event) => {
    if (event.target.closest('.home-banner__control') || event.target.closest('.home-banner__dots')) return;
    const activeSlide = carousel.querySelector('.home-banner__item.is-active');
    if (!activeSlide) return;
    openLightbox(activeSlide);
  });

  lightbox.addEventListener('click', (event) => {
    if (event.target.matches('[data-close="lightbox"]')) {
      closeLightbox();
    }
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && lightbox.classList.contains('is-open')) {
      closeLightbox();
    }
  });
}

setupMediaLightbox();

function setupCompactGalleryLightbox() {
  const lightbox = document.getElementById('mediaLightbox');
  if (!lightbox) return;

  const imageEl = document.getElementById('mediaLightboxImage');
  const titleEl = document.getElementById('mediaLightboxTitle');
  const textEl = document.getElementById('mediaLightboxText');
  const items = document.querySelectorAll('[data-lightbox-image]');

  const openLightbox = (img) => {
    imageEl.src = img.src;
    imageEl.alt = img.alt || 'Imagen ampliada de galería';
    titleEl.textContent = img.alt || 'Galería compacta';
    textEl.textContent = 'Registro visual del territorio cultural de Veracruz.';
    lightbox.classList.add('is-open');
    lightbox.setAttribute('aria-hidden', 'false');
    document.body.classList.add('modal-open');
  };

  items.forEach((img) => {
    img.addEventListener('click', () => openLightbox(img));
  });
}

setupCompactGalleryLightbox();

const counterEl = document.querySelector('[data-count]');

if (counterEl) {
  const target = Number(counterEl.dataset.count || 0);
  const counterObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;

      let current = 0;
      const step = Math.max(1, Math.ceil(target / 40));
      const timer = setInterval(() => {
        current = Math.min(target, current + step);
        counterEl.textContent = `+${current}`;
        if (current >= target) {
          clearInterval(timer);
        }
      }, 32);

      counterObserver.disconnect();
    });
  }, { threshold: 0.4 });

  counterObserver.observe(counterEl);
}

/* =========================
FADE-IN PARA INFO PAGES
========================= */

document.querySelectorAll('.fade-in').forEach((el) => {
  el.classList.add('reveal-on-scroll');
  if (reduceMotion) {
    el.classList.add('is-visible');
    return;
  }

  const fadeObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      entry.target.classList.toggle('is-visible', entry.isIntersecting);
    });
  }, { threshold: 0.14, rootMargin: '0px 0px -8% 0px' });

  fadeObserver.observe(el);
});

function scrollCarousel(direction) {
  const container = document.getElementById('videoTrack');
  const scrollAmount = 300;

  container.scrollBy({
    left: direction * scrollAmount,
    behavior: 'smooth'
  });
}

function setupTestimonialModal() {
  const modal = document.getElementById('testimonialModal');
  const grid = document.getElementById('testimonialGrid');
  if (!modal || !grid) return;

  const modalImage = document.getElementById('testimonialModalImage');
  const modalTitle = document.getElementById('testimonialModalTitle');
  const modalText = document.getElementById('testimonialModalText');

  const openModal = (card) => {
    modalImage.src = card.dataset.image || '';
    modalTitle.textContent = card.dataset.name || 'Testimonio';
    modalText.textContent = card.dataset.text || '';
    modal.classList.add('is-open');
    modal.setAttribute('aria-hidden', 'false');
    document.body.classList.add('modal-open');
  };

  const closeModal = () => {
    modal.classList.remove('is-open');
    modal.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('modal-open');
  };

  grid.addEventListener('click', (event) => {
    const card = event.target.closest('.testimonial-card');
    if (!card) return;
    openModal(card);
  });

  grid.addEventListener('keydown', (event) => {
    const card = event.target.closest('.testimonial-card');
    if (!card) return;
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      openModal(card);
    }
  });

  modal.addEventListener('click', (event) => {
    if (event.target.matches('[data-close="modal"]')) {
      closeModal();
    }
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && modal.classList.contains('is-open')) {
      closeModal();
    }
  });
}

setupTestimonialModal();

function setupActiveNavBySection() {
  const navLinks = Array.from(document.querySelectorAll('#homeNav a[href^="#"]'));
  if (!navLinks.length) return;

  const sections = navLinks
    .map((link) => document.querySelector(link.getAttribute('href')))
    .filter(Boolean);

  if (!sections.length) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      navLinks.forEach((link) => link.removeAttribute('data-active'));
      const activeLink = navLinks.find((link) => link.getAttribute('href') === `#${entry.target.id}`);
      if (activeLink) activeLink.setAttribute('data-active', 'true');
    });
  }, { threshold: 0.45 });

  sections.forEach((section) => observer.observe(section));
}

setupActiveNavBySection();
