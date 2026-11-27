async function initializeSlideshow(stage: HTMLElement): Promise<void> {
  const editorial = stage.closest<HTMLElement>('.auth-editorial');
  if (!editorial) return;

  const controls = editorial.querySelector<HTMLElement>('.auth-slideshow-controls');
  const toggle = editorial.querySelector<HTMLButtonElement>('[data-auth-slideshow-toggle]');
  const indicators = editorial.querySelector<HTMLElement>('[data-auth-slide-indicators]');
  const desktop = window.matchMedia('(min-width: 801px)');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const sources = [...new Set(
    Array.from(stage.querySelectorAll<HTMLElement>('[data-auth-photo]'))
      .map((element) => element.dataset.src)
      .filter((source): source is string => Boolean(source)),
  )];

  const slides: HTMLImageElement[] = [];
  let current = 0;
  let timer: number | undefined;
  let manuallyPaused = false;
  let initialized = false;
  let loading = false;
  let pageActive = true;

  function renderIndicators() {
    if (!indicators) return;
    indicators.replaceChildren();
    slides.forEach((_, index) => {
      const indicator = document.createElement('span');
      indicator.className = 'auth-slide-indicator';
      indicator.classList.toggle('is-active', index === current);
      indicators.append(indicator);
    });
  }

  function stop() {
    if (timer !== undefined) {
      window.clearInterval(timer);
      timer = undefined;
    }
  }

  function advance() {
    if (slides.length < 2) return;
    slides[current]?.classList.remove('is-active');
    current = (current + 1) % slides.length;
    slides[current]?.classList.add('is-active');
    renderIndicators();
  }

  function syncPlayback() {
    stop();
    const canRotate = desktop.matches && !reducedMotion.matches && slides.length > 1;
    if (controls) controls.hidden = !canRotate;
    if (toggle) {
      toggle.textContent = manuallyPaused ? 'Play' : 'Pause';
      toggle.setAttribute('aria-label', manuallyPaused ? 'Play slideshow' : 'Pause slideshow');
    }
    if (canRotate && pageActive && !document.hidden && !manuallyPaused) {
      timer = window.setInterval(advance, 6000);
    }
  }

  async function loadSlides() {
    if (!desktop.matches || initialized || loading) return;
    loading = true;
    for (const source of sources) {
      const image = new Image();
      image.alt = '';
      image.decoding = 'async';
      image.className = 'auth-photo-slide';
      image.src = source;
      try {
        await image.decode();
        if (!slides.length) image.classList.add('is-active');
        stage.append(image);
        slides.push(image);
        renderIndicators();
      } catch {
        // Keep the navy fallback when an image cannot be loaded.
      }
    }
    initialized = true;
    loading = false;
    syncPlayback();
  }

  toggle?.addEventListener('click', () => {
    manuallyPaused = !manuallyPaused;
    syncPlayback();
  });
  desktop.addEventListener('change', () => {
    if (desktop.matches) void loadSlides();
    syncPlayback();
  });
  reducedMotion.addEventListener('change', syncPlayback);
  document.addEventListener('visibilitychange', syncPlayback);
  window.addEventListener('pagehide', () => {
    pageActive = false;
    stop();
  });
  window.addEventListener('pageshow', () => {
    pageActive = true;
    syncPlayback();
  });
  await loadSlides();
}

document.querySelectorAll<HTMLElement>('[data-auth-slideshow]').forEach((stage) => {
  void initializeSlideshow(stage);
});
