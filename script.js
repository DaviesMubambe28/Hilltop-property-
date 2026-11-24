import { calculateMortgage } from './src/calculators.ts';

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
const toolNames = { mortgage: 'Mortgage calculator' };

document.querySelectorAll('[data-tool]').forEach((button) => {
  button.addEventListener('click', () => {
    dialogTitle.textContent = toolNames[button.dataset.tool];
    dialog.showModal();
  });
});

document.querySelector('.dialog-close').addEventListener('click', () => dialog.close());
dialog.addEventListener('click', (event) => {
  if (event.target === dialog) dialog.close();
});

document.querySelector('#calculator-form').addEventListener('submit', (event) => {
  event.preventDefault();
  const price = Number(document.querySelector('#property-price').value);
  const deposit = Number(document.querySelector('#deposit').value);
  const annualInterestRate = Number(document.querySelector('#interest-rate').value);
  const years = Number(document.querySelector('#loan-term').value);
  const output = document.querySelector('#calculator-result');
  try {
    const result = calculateMortgage({ propertyPrice: price, deposit, annualInterestRate, termYears: years });
    output.textContent = `Estimated monthly repayment: K${Math.round(result.monthlyRepayment).toLocaleString()}. This illustration assumes a ${annualInterestRate}% annual interest rate; lender fees and insurance are excluded.`;
  } catch (error) {
    output.textContent = error instanceof Error ? error.message : 'Check the values and try again.';
  }
});
