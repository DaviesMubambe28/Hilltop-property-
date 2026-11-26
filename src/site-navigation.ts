const header = document.querySelector<HTMLElement>('.hilltop-header');

if (header) {
  const menuButton = header.querySelector<HTMLButtonElement>('.menu-button');
  const mobileMenu = header.querySelector<HTMLElement>('#mobile-menu');
  const desktopBreakpoint = window.matchMedia('(min-width: 1101px)');
  const dropdowns = Array.from(header.querySelectorAll<HTMLDetailsElement>('.hilltop-nav-dropdown'));

  function closeDropdowns(exception?: HTMLDetailsElement): void {
    dropdowns.forEach(dropdown => {
      if (dropdown !== exception) dropdown.open = false;
    });
  }

  function setMobileMenu(open: boolean, restoreFocus = false): void {
    if (!menuButton || !mobileMenu) return;
    if (open && desktopBreakpoint.matches) return;
    menuButton.setAttribute('aria-expanded', String(open));
    menuButton.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    mobileMenu.hidden = !open;
    document.body.classList.toggle('menu-open', open);
    if (open) {
      closeDropdowns();
      mobileMenu.querySelector<HTMLElement>('a[href]')?.focus();
    } else if (restoreFocus) {
      menuButton.focus();
    }
  }

  menuButton?.addEventListener('click', () => {
    const isOpen = menuButton.getAttribute('aria-expanded') === 'true';
    setMobileMenu(!isOpen, isOpen);
  });

  mobileMenu?.querySelectorAll<HTMLAnchorElement>('a[href]').forEach(link => {
    link.addEventListener('click', () => setMobileMenu(false, true));
  });

  dropdowns.forEach(dropdown => {
    const summary = dropdown.querySelector('summary');
    dropdown.addEventListener('toggle', () => {
      if (dropdown.open) closeDropdowns(dropdown);
    });
    dropdown.addEventListener('focusout', event => {
      if (event.relatedTarget instanceof Node && !dropdown.contains(event.relatedTarget)) dropdown.open = false;
    });
    dropdown.addEventListener('keydown', event => {
      if (event.key === 'Escape' && dropdown.open) {
        event.preventDefault();
        dropdown.open = false;
        summary?.focus();
      }
    });
    dropdown.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => { dropdown.open = false; });
    });
  });

  document.addEventListener('click', event => {
    if (!(event.target instanceof Element)) return;
    if (!event.target.closest('.hilltop-nav-dropdown')) closeDropdowns();
    if (mobileMenu && !mobileMenu.hidden && !header.contains(event.target)) setMobileMenu(false, true);
  });

  desktopBreakpoint.addEventListener('change', event => {
    closeDropdowns();
    if (event.matches) setMobileMenu(false);
  });

  document.addEventListener('keydown', event => {
    if (!menuButton || !mobileMenu || mobileMenu.hidden) return;
    if (event.key === 'Escape') {
      event.preventDefault();
      setMobileMenu(false, true);
      return;
    }
    if (event.key !== 'Tab') return;
    const focusable = [menuButton, ...mobileMenu.querySelectorAll<HTMLElement>('a[href], button:not([disabled])')];
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    const active = document.activeElement;
    if (!focusable.some(element => element === active)) {
      event.preventDefault();
      (event.shiftKey ? last : first)?.focus();
      return;
    }
    if (event.shiftKey && active === first) {
      event.preventDefault();
      last?.focus();
    } else if (!event.shiftKey && active === last) {
      event.preventDefault();
      first?.focus();
    }
  });

  function updateActiveNavigation(): void {
    const path = location.pathname === '/index.html' ? '/' : location.pathname;
    const params = new URLSearchParams(location.search);
    const primaryLinks = Array.from(header!.querySelectorAll<HTMLAnchorElement>('.hilltop-desktop-nav a, #mobile-menu a'));
    primaryLinks.forEach(link => {
      link.removeAttribute('aria-current');
      const url = new URL(link.href, location.origin);
      if (url.origin !== location.origin || url.hash || url.pathname !== path) return;
      if (path === '/properties.html') {
        const listing = params.get('listing');
        const query = params.get('q');
        if (listing) {
          if (url.searchParams.get('listing') === listing) link.setAttribute('aria-current', 'page');
          return;
        }
        if (query === 'land') {
          if (url.searchParams.get('q') === 'land') link.setAttribute('aria-current', 'page');
          return;
        }
        if (!url.search) link.setAttribute('aria-current', 'page');
        return;
      }
      if (!url.search) link.setAttribute('aria-current', 'page');
    });
    dropdowns.forEach(dropdown => {
      dropdown.classList.toggle('is-current', Boolean(dropdown.querySelector('[aria-current="page"]')));
    });
    if (path === '/properties.html' || path === '/property.html' || path.startsWith('/property/') || path === '/compare.html') {
      dropdowns[0]?.classList.add('is-current');
    }
  }

  updateActiveNavigation();
  window.addEventListener('popstate', updateActiveNavigation);
  window.addEventListener('hilltop:navigation-change', updateActiveNavigation);
}
