(function initArchivoLightbox(){
  const lightbox = document.getElementById('archivoLightbox');
  const imageEl = document.getElementById('archivoLightboxImage');
  const triggers = document.querySelectorAll('[data-archivo-lightbox]');

  if (!lightbox || !imageEl || !triggers.length) return;

  const close = () => {
    lightbox.classList.remove('is-open');
    lightbox.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('modal-open');
    imageEl.src = '';
  };

  const open = (img) => {
    imageEl.src = img.currentSrc || img.src;
    imageEl.alt = img.alt || 'Imagen ampliada del archivo cultural';
    lightbox.classList.add('is-open');
    lightbox.setAttribute('aria-hidden', 'false');
    document.body.classList.add('modal-open');
  };

  triggers.forEach((img) => {
    img.addEventListener('click', () => open(img));
  });

  lightbox.addEventListener('click', (event) => {
    if (event.target.matches('[data-close="archivo-lightbox"]')) {
      close();
    }
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && lightbox.classList.contains('is-open')) {
      close();
    }
  });
})();
