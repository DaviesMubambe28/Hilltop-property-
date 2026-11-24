import { describe, expect, it } from 'vitest';
import { calculateMortgage } from '../src/calculators';

describe('mortgage calculator', () => {
  it('calculates an amortised monthly repayment', () => {
    const result = calculateMortgage({ propertyPrice: 2_500_000, deposit: 500_000, annualInterestRate: 15, termYears: 20 });
    expect(result.monthlyRepayment).toBeCloseTo(26_335.79, 2);
    expect(result.principal).toBe(2_000_000);
  });

  it('supports a zero-interest loan', () => {
    expect(calculateMortgage({ propertyPrice: 120_000, deposit: 20_000, annualInterestRate: 0, termYears: 10 }).monthlyRepayment).toBeCloseTo(833.33, 2);
  });

  it.each([
    { propertyPrice: 0, deposit: 0, annualInterestRate: 15, termYears: 20 },
    { propertyPrice: 100, deposit: 101, annualInterestRate: 15, termYears: 20 },
    { propertyPrice: 100, deposit: 0, annualInterestRate: -1, termYears: 20 },
    { propertyPrice: 100, deposit: 0, annualInterestRate: 15, termYears: 0 },
  ])('rejects invalid inputs: %o', (input) => {
    expect(() => calculateMortgage(input)).toThrow();
  });
});
