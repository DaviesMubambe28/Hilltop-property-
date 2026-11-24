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
