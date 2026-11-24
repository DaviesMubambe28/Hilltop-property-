import { z } from 'zod';

const mortgageInput = z.object({
  propertyPrice: z.number().finite().positive('Property price must be greater than zero.'),
  deposit: z.number().finite().nonnegative('Deposit cannot be negative.'),
  annualInterestRate: z.number().finite().min(0, 'Interest rate cannot be negative.').max(100, 'Interest rate must not exceed 100%.'),
  termYears: z.number().finite().int().min(1, 'Loan term must be at least one year.').max(40, 'Loan term must not exceed 40 years.'),
}).refine(({ deposit, propertyPrice }) => deposit < propertyPrice, {
  message: 'Deposit must be less than the property price.',
  path: ['deposit'],
});

export interface MortgageResult {
  principal: number;
  monthlyRepayment: number;
}

export function calculateMortgage(input: z.input<typeof mortgageInput>): MortgageResult {
  const parsed = mortgageInput.safeParse(input);
  if (!parsed.success) throw new Error(parsed.error.issues[0]?.message ?? 'Check the mortgage values.');
  const values = parsed.data;
  const principal = values.propertyPrice - values.deposit;
  const payments = values.termYears * 12;
  const monthlyRate = values.annualInterestRate / 100 / 12;
  const monthlyRepayment = monthlyRate === 0
    ? principal / payments
    : principal * monthlyRate * (1 + monthlyRate) ** payments / ((1 + monthlyRate) ** payments - 1);

  return { principal, monthlyRepayment };
}

const affordabilityInput = z.object({
  monthlyIncome: z.number().finite().positive('Monthly income must be greater than zero.'),
  monthlyObligations: z.number().finite().nonnegative('Monthly obligations cannot be negative.'),
  deposit: z.number().finite().nonnegative('Deposit cannot be negative.'),
  annualInterestRate: z.number().finite().min(0).max(100),
  termYears: z.number().finite().int().min(1).max(40),
  repaymentRatio: z.number().finite().min(0.1).max(0.6),
});

export function calculateAffordability(input: z.input<typeof affordabilityInput>) {
  const parsed = affordabilityInput.safeParse(input);
  if (!parsed.success) throw new Error(parsed.error.issues[0]?.message ?? 'Check the affordability values.');
  const values = parsed.data;
  const maximumMonthlyRepayment = values.monthlyIncome * values.repaymentRatio - values.monthlyObligations;
  if (maximumMonthlyRepayment <= 0) throw new Error('Existing obligations consume the configured repayment capacity.');
  const payments = values.termYears * 12;
  const monthlyRate = values.annualInterestRate / 100 / 12;
  const affordableLoan = monthlyRate === 0
    ? maximumMonthlyRepayment * payments
    : maximumMonthlyRepayment * ((1 + monthlyRate) ** payments - 1) / (monthlyRate * (1 + monthlyRate) ** payments);
  return {
    maximumMonthlyRepayment,
    affordablePropertyPrice: affordableLoan + values.deposit,
    repaymentToIncomeRatio: maximumMonthlyRepayment / values.monthlyIncome,
  };
}

const rentalYieldInput = z.object({
  purchasePrice: z.number().finite().positive('Purchase price must be greater than zero.'),
  monthlyRent: z.number().finite().nonnegative('Monthly rent cannot be negative.'),
  annualExpenses: z.number().finite().nonnegative('Annual expenses cannot be negative.'),
});

export function calculateRentalYield(input: z.input<typeof rentalYieldInput>) {
  const parsed = rentalYieldInput.safeParse(input);
  if (!parsed.success) throw new Error(parsed.error.issues[0]?.message ?? 'Check the rental yield values.');
  const annualIncome = parsed.data.monthlyRent * 12;
  if (parsed.data.annualExpenses > annualIncome) throw new Error('Annual expenses cannot exceed annual rental income.');
  return {
    annualIncome,
    grossYield: annualIncome / parsed.data.purchasePrice * 100,
    netYield: (annualIncome - parsed.data.annualExpenses) / parsed.data.purchasePrice * 100,
  };
}

const buyingCostInput = z.object({
  purchasePrice: z.number().finite().positive('Purchase price must be greater than zero.'),
  legalCosts: z.number().finite().nonnegative(),
  taxesAndStatutoryFees: z.number().finite().nonnegative(),
  transferAndRegistration: z.number().finite().nonnegative(),
  otherCosts: z.number().finite().nonnegative(),
});

export function calculateBuyingCosts(input: z.input<typeof buyingCostInput>) {
  const parsed = buyingCostInput.safeParse(input);
  if (!parsed.success) throw new Error(parsed.error.issues[0]?.message ?? 'Check the buying cost values.');
  const additionalCosts = parsed.data.legalCosts + parsed.data.taxesAndStatutoryFees + parsed.data.transferAndRegistration + parsed.data.otherCosts;
  return { additionalCosts, estimatedTotal: parsed.data.purchasePrice + additionalCosts };
}
