import { calculateAffordability, calculateBuyingCosts, calculateMortgage, calculateRentalYield } from './src/calculators.ts';

function activateButton(button, selector) {
  document.querySelectorAll(selector).forEach((item) => {
    item.classList.toggle('active', item === button);
    if (item.hasAttribute('role')) item.setAttribute('aria-selected', String(item === button));
  });
}

document.querySelectorAll('.search-tabs [role="tab"]').forEach((button) => {
  button.addEventListener('click', () => activateButton(button, '.search-tabs [role="tab"]'));
});

document.querySelectorAll('.filter-row button').forEach((button) => {
  button.addEventListener('click', () => activateButton(button, '.filter-row button'));
});

const toast = document.querySelector('.toast');
let toastTimer;
function showToast(message) {
  clearTimeout(toastTimer);
  toast.textContent = message;
  toast.classList.add('visible');
  toastTimer = setTimeout(() => toast.classList.remove('visible'), 2400);
}

const dialog = document.querySelector('#tool-dialog');
const dialogTitle = document.querySelector('#dialog-title');
const toolNames = { mortgage: 'Mortgage calculator', affordability: 'Affordability calculator', rental: 'Rental yield calculator', cost: 'Buying cost estimator' };
const calculatorForm = document.querySelector('#calculator-form');
const calculatorResult = document.querySelector('#calculator-result');
let activeTool = 'mortgage';
const fields = {
  mortgage: '<label>Property price (K)<input id="property-price" type="number" min="1" step="0.01" value="2500000" required /></label><label>Deposit (K)<input id="deposit" type="number" min="0" step="0.01" value="500000" required /></label><label>Annual interest rate (%)<input id="interest-rate" type="number" min="0" max="100" step="0.01" value="15" required /></label><label>Loan term (years)<input id="loan-term" type="number" min="1" max="40" step="1" value="20" required /></label>',
  affordability: '<label>Monthly income (K)<input id="monthly-income" type="number" min="1" step="0.01" required /></label><label>Existing monthly obligations (K)<input id="monthly-obligations" type="number" min="0" step="0.01" value="0" required /></label><label>Available deposit (K)<input id="available-deposit" type="number" min="0" step="0.01" value="0" required /></label><label>Annual interest rate (%)<input id="affordability-rate" type="number" min="0" max="100" step="0.01" value="15" required /></label><label>Loan term (years)<input id="affordability-term" type="number" min="1" max="40" value="20" required /></label><label>Maximum repayment-to-income ratio (%)<input id="repayment-ratio" type="number" min="10" max="60" value="30" required /></label>',
  rental: '<label>Purchase price (K)<input id="rental-price" type="number" min="1" step="0.01" required /></label><label>Monthly rental income (K)<input id="monthly-rent" type="number" min="0" step="0.01" required /></label><label>Annual expenses (K)<input id="annual-expenses" type="number" min="0" step="0.01" value="0" required /></label>',
  cost: '<label>Purchase price (K)<input id="cost-price" type="number" min="1" step="0.01" required /></label><label>Legal costs (K)<input id="legal-costs" type="number" min="0" step="0.01" value="0" required /></label><label>Taxes and statutory fees (K)<input id="tax-costs" type="number" min="0" step="0.01" value="0" required /></label><label>Transfer and registration (K)<input id="transfer-costs" type="number" min="0" step="0.01" value="0" required /></label><label>Other costs (K)<input id="other-costs" type="number" min="0" step="0.01" value="0" required /></label>',
};

function value(id) { return Number(document.querySelector(`#${id}`).value); }
function money(value) { return `K${Math.round(value).toLocaleString()}`; }

document.querySelectorAll('[data-tool]').forEach((button) => {
  button.addEventListener('click', () => {
    activeTool = button.dataset.tool;
    dialogTitle.textContent = toolNames[button.dataset.tool];
    calculatorForm.innerHTML = `${fields[activeTool]}<button class="button button-yellow" type="submit">Calculate estimate</button>`;
    calculatorResult.textContent = activeTool === 'cost' ? 'Enter costs supplied by your legal and financial advisers. No statutory rates are assumed.' : 'Enter your details for an illustrative estimate.';
    dialog.showModal();
  });
});

document.querySelector('.dialog-close').addEventListener('click', () => dialog.close());
dialog.addEventListener('click', (event) => {
  if (event.target === dialog) dialog.close();
});

document.querySelector('#calculator-form').addEventListener('submit', (event) => {
  event.preventDefault();
  const output = document.querySelector('#calculator-result');
  try {
    if (activeTool === 'mortgage') {
      const annualInterestRate = value('interest-rate');
      const result = calculateMortgage({ propertyPrice: value('property-price'), deposit: value('deposit'), annualInterestRate, termYears: value('loan-term') });
      const total = result.monthlyRepayment * value('loan-term') * 12;
      output.textContent = `Monthly repayment: ${money(result.monthlyRepayment)}. Total repayment: ${money(total)}. Total interest: ${money(total - result.principal)}. Assumes ${annualInterestRate}% annually; lender fees and insurance are excluded.`;
    } else if (activeTool === 'affordability') {
      const result = calculateAffordability({ monthlyIncome: value('monthly-income'), monthlyObligations: value('monthly-obligations'), deposit: value('available-deposit'), annualInterestRate: value('affordability-rate'), termYears: value('affordability-term'), repaymentRatio: value('repayment-ratio') / 100 });
      output.textContent = `Estimated affordable property price: ${money(result.affordablePropertyPrice)}. Maximum monthly repayment: ${money(result.maximumMonthlyRepayment)} (${(result.repaymentToIncomeRatio * 100).toFixed(1)}% of income). This is not a lending decision.`;
    } else if (activeTool === 'rental') {
      const result = calculateRentalYield({ purchasePrice: value('rental-price'), monthlyRent: value('monthly-rent'), annualExpenses: value('annual-expenses') });
      output.textContent = `Annual rental income: ${money(result.annualIncome)}. Gross yield: ${result.grossYield.toFixed(2)}%. Net yield: ${result.netYield.toFixed(2)}%. Vacancy, tax and financing are included only if entered in annual expenses.`;
    } else {
      const result = calculateBuyingCosts({ purchasePrice: value('cost-price'), legalCosts: value('legal-costs'), taxesAndStatutoryFees: value('tax-costs'), transferAndRegistration: value('transfer-costs'), otherCosts: value('other-costs') });
      output.textContent = `Additional costs entered: ${money(result.additionalCosts)}. Estimated total purchase cost: ${money(result.estimatedTotal)}. Hilltop has not assumed any statutory fee or tax rate.`;
    }
  } catch (error) {
    output.textContent = error instanceof Error ? error.message : 'Check the values and try again.';
  }
});

// Preserve existing calculator deep links after
// relocating the homepage calculator controls.
const footerCalculators = document.querySelector('details.footer-calculators#tools');
function openCalculatorMenuFromHash() {
  if (!footerCalculators || window.location.hash !== '#tools') return;
  footerCalculators.open = true;
  requestAnimationFrame(() => {
    footerCalculators.scrollIntoView({ block: 'start' });
  });
}
openCalculatorMenuFromHash();
window.addEventListener('hashchange', openCalculatorMenuFromHash);

/* ==================================================
   HILLTOP CINEMATIC HERO SLIDESHOW
   ================================================== */

async function initializeHeroSlideshow() {
  const hero = document.querySelector('#homepage-hero');
  if (!hero) return;
  const media = hero.querySelector('#hero-slides');
  const controls = hero.querySelector('#hero-slideshow-controls');
  const indicators = hero.querySelector('#hero-slide-indicators');
  const previousButton = hero.querySelector('.hero-previous');
  const nextButton = hero.querySelector('.hero-next');
  const playbackButton = hero.querySelector('.hero-playback');
  const provenance = hero.querySelector('#hero-image-provenance');
  const fallsCredit = hero.querySelector('#hero-falls-credit');
  const status = hero.querySelector('#hero-slide-status');
  const originalSlide = media?.querySelector('[data-hero-slide="villa"]');
  if (!media || !controls || !indicators || !previousButton || !nextButton || !playbackButton || !provenance || !fallsCredit || !status || !originalSlide) return;

  const slideDefinitions = [
    { id:'family-home', title:'Family residence', desktop:'/assets/hero/family-home.webp', mobile:'/assets/hero/family-home-mobile.webp' },
    { id:'apartments', title:'Contemporary apartments', desktop:'/assets/hero/apartments.webp', mobile:'/assets/hero/apartments-mobile.webp' },
    { id:'victoria-falls', title:'Victoria Falls, Zambia', desktop:'/assets/hero/victoria-falls.webp', mobile:'/assets/hero/victoria-falls-mobile.webp' },
    { id:'country-estate', title:'Country estate', desktop:'/assets/hero/country-estate.webp', mobile:'/assets/hero/country-estate-mobile.webp' }
  ];
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const slides = [];
  const delay = 7000;
  let currentIndex = 0;
  let timer = null;
  let userPaused = reducedMotion.matches;
  let pointerInside = false;
  let heroVisible = true;
  let playbackPointerState = null;

  const originalImage = originalSlide.querySelector('img');
  try {
    if (!originalImage) throw new Error('Opening image missing');
    await originalImage.decode();
    slides.push({ id:'villa', title:'Luxury residence', element:originalSlide });
  } catch {
    originalSlide.remove();
  }

  async function loadSlide(definition) {
    const picture = document.createElement('picture');
    picture.className = 'hero-media hero-slide';
    picture.dataset.heroSlide = definition.id;
    const source = document.createElement('source');
    source.media = '(max-width:720px)';
    source.srcset = definition.mobile;
    const image = document.createElement('img');
    image.alt = '';
    image.decoding = 'async';
    image.fetchPriority = 'low';
    picture.append(source, image);
    media.append(picture);
    image.src = definition.desktop;
    try {
      await image.decode();
      return { ...definition, element:picture };
    } catch {
      picture.remove();
      console.warn(`Hero photograph unavailable: ${definition.id}`);
      return null;
    }
  }

  const loadedSlides = await Promise.all(slideDefinitions.map(loadSlide));
  loadedSlides.forEach(slide => { if (slide) slides.push(slide); });
  if (!slides.length) {
    provenance.textContent = 'Hilltop Properties Zambia';
    return;
  }
  slides.forEach(slide => media.append(slide.element));

  function stopTimer() {
    if (timer !== null) {
      window.clearTimeout(timer);
      timer = null;
    }
  }

  function updatePlaybackButton() {
    playbackButton.setAttribute('aria-label', userPaused ? 'Play background slideshow' : 'Pause background slideshow');
    const span = playbackButton.querySelector('span');
    if (span) span.textContent = userPaused ? '▶' : 'Ⅱ';
  }

  function playbackAllowed() {
    return slides.length > 1 && !userPaused && !pointerInside && heroVisible && !document.hidden;
  }

  function scheduleNextSlide() {
    stopTimer();
    hero.classList.toggle('is-playing', playbackAllowed());
    hero.classList.toggle('is-paused', !playbackAllowed());
    updatePlaybackButton();
    if (!playbackAllowed()) return;
    timer = window.setTimeout(() => {
      showSlide(currentIndex + 1);
      scheduleNextSlide();
    }, delay);
  }

  function showSlide(index, announce = false) {
    currentIndex = (index + slides.length) % slides.length;
    slides.forEach((slide, position) => slide.element.classList.toggle('is-active', position === currentIndex));
    const activeSlide = slides[currentIndex];
    const isFalls = activeSlide.id === 'victoria-falls';
    provenance.textContent = isFalls ? 'Victoria Falls, Zambia' : 'Illustrative architecture · not a listed property';
    fallsCredit.hidden = !isFalls;
    indicators.querySelectorAll('.hero-slide-dot').forEach((button, position) => {
      if (position === currentIndex) button.setAttribute('aria-current', 'true');
      else button.removeAttribute('aria-current');
    });
    if (announce) status.textContent = `${activeSlide.title}, image ${currentIndex + 1} of ${slides.length}`;
  }

  function selectManually(index) {
    userPaused = true;
    showSlide(index, true);
    scheduleNextSlide();
  }

  slides.forEach((slide, index) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'hero-slide-dot';
    button.setAttribute('aria-label', `Show ${slide.title}, image ${index + 1} of ${slides.length}`);
    button.addEventListener('click', () => selectManually(index));
    indicators.append(button);
  });

  previousButton.addEventListener('click', () => selectManually(currentIndex - 1));
  nextButton.addEventListener('click', () => selectManually(currentIndex + 1));

  playbackButton.addEventListener('pointerdown', () => { playbackPointerState = userPaused; });
  playbackButton.addEventListener('pointercancel', () => { playbackPointerState = null; });
  playbackButton.addEventListener('click', event => {
    const previousState = event.detail > 0 && playbackPointerState !== null ? playbackPointerState : userPaused;
    userPaused = !previousState;
    playbackPointerState = null;
    scheduleNextSlide();
  });

  hero.addEventListener('pointerenter', event => {
    if (event.pointerType !== 'mouse') return;
    pointerInside = true;
    scheduleNextSlide();
  });
  hero.addEventListener('pointerleave', event => {
    if (event.pointerType !== 'mouse') return;
    pointerInside = false;
    scheduleNextSlide();
  });
  hero.addEventListener('focusin', event => {
    if (!event.relatedTarget || !hero.contains(event.relatedTarget)) {
      userPaused = true;
      scheduleNextSlide();
    }
  });
  document.addEventListener('visibilitychange', scheduleNextSlide);
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(entries => {
      heroVisible = entries[0]?.isIntersecting ?? false;
      scheduleNextSlide();
    }, { threshold:0.1 });
    observer.observe(hero);
  }
  reducedMotion.addEventListener('change', event => {
    if (event.matches) userPaused = true;
    scheduleNextSlide();
  });

  if (slides.length > 1) {
    controls.hidden = false;
    hero.classList.add('has-slideshow');
  }
  showSlide(0);
  scheduleNextSlide();
}

void initializeHeroSlideshow();
