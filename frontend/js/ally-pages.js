(function () {
  const reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const revealItems = document.querySelectorAll('.ally-hero, .ally-quick-nav, .ally-page__card, .ally-page__actions, .ally-page__grid-two .ally-page__card');

  if (reduceMotion) {
    revealItems.forEach((item) => item.classList.add('is-visible'));
  } else {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        entry.target.classList.toggle('is-visible', entry.isIntersecting);
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -8% 0px' });

    revealItems.forEach((item) => {
      item.classList.add('reveal-on-scroll');
      observer.observe(item);
    });
  }

  const lightbox = document.getElementById('allyLightbox');
  if (!lightbox) return;

  const lightboxImage = document.getElementById('allyLightboxImage');
  const galleryImages = document.querySelectorAll('.ally-gallery img');

  const open = (img) => {
    lightboxImage.src = img.src;
    lightboxImage.alt = img.alt || 'Imagen ampliada';
    lightbox.classList.add('is-open');
    lightbox.setAttribute('aria-hidden', 'false');
    document.body.classList.add('modal-open');
  };

  const close = () => {
    lightbox.classList.remove('is-open');
    lightbox.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('modal-open');
  };

  galleryImages.forEach((img) => {
    img.style.cursor = 'zoom-in';
    img.addEventListener('click', () => open(img));
  });

  lightbox.addEventListener('click', (event) => {
    if (event.target.matches('[data-close="ally-lightbox"]')) close();
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && lightbox.classList.contains('is-open')) close();
  });
})();
