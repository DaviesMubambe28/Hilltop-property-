import { calculateAffordability, calculateBuyingCosts, calculateMortgage, calculateRentalYield } from './src/calculators.ts';

const menuButton = document.querySelector('.menu-button');
const mobileMenu = document.querySelector('#mobile-menu');

menuButton.addEventListener('click', () => {
  const isOpen = menuButton.getAttribute('aria-expanded') === 'true';
  menuButton.setAttribute('aria-expanded', String(!isOpen));
  menuButton.setAttribute('aria-label', isOpen ? 'Open menu' : 'Close menu');
  mobileMenu.hidden = isOpen;
  document.body.classList.toggle('menu-open', !isOpen);
});
mobileMenu.querySelectorAll('a').forEach((link) => {
  link.addEventListener('click', () => {
    menuButton.setAttribute('aria-expanded', 'false');
    menuButton.setAttribute('aria-label', 'Open menu');
    mobileMenu.hidden = true;
    document.body.classList.remove('menu-open');
  });
});

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

const savedCount = document.querySelector('.icon-button span');
document.querySelectorAll('.property-image button').forEach((button) => {
  button.addEventListener('click', () => {
    const saved = button.classList.toggle('saved');
    button.textContent = saved ? '♥' : '♡';
    savedCount.textContent = String(document.querySelectorAll('.property-image button.saved').length);
    showToast(saved ? 'Property saved' : 'Property removed');
  });
});

const toast = document.querySelector('.toast');
let toastTimer;
function showToast(message) {
  clearTimeout(toastTimer);
  toast.textContent = message;
  toast.classList.add('visible');
  toastTimer = setTimeout(() => toast.classList.remove('visible'), 2400);
}

document.querySelector('#property-search').addEventListener('submit', (event) => {
  event.preventDefault();
  document.querySelector('#properties').scrollIntoView();
  showToast('Showing properties that match your search');
});

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
