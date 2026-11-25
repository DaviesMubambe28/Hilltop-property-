import { describe, expect, it } from 'vitest';
import { calculateAffordability, calculateBuyingCosts, calculateMortgage, calculateRentalYield } from '../src/calculators';

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
    { propertyPrice: Number.POSITIVE_INFINITY, deposit: 0, annualInterestRate: 15, termYears: 20 },
    { propertyPrice: 100, deposit: 0, annualInterestRate: 101, termYears: 20 },
    { propertyPrice: 100, deposit: 0, annualInterestRate: 15, termYears: 41 },
  ])('rejects invalid inputs: %o', (input) => {
    expect(() => calculateMortgage(input)).toThrow();
  });
});

describe('affordability calculator', () => {
  it('derives an affordable property value from a configurable repayment ratio', () => {
    const result = calculateAffordability({ monthlyIncome: 30_000, monthlyObligations: 3_000, deposit: 200_000, annualInterestRate: 15, termYears: 20, repaymentRatio: 0.3 });
    expect(result.maximumMonthlyRepayment).toBe(6_000);
    expect(result.affordablePropertyPrice).toBeGreaterThan(650_000);
    expect(result.repaymentToIncomeRatio).toBeCloseTo(0.2);
  });

  it('rejects obligations that consume the configured repayment capacity', () => {
    expect(() => calculateAffordability({ monthlyIncome: 10_000, monthlyObligations: 4_000, deposit: 0, annualInterestRate: 15, termYears: 20, repaymentRatio: 0.3 })).toThrow('obligations');
  });

  it('supports a zero-interest affordability estimate', () => {
    const result = calculateAffordability({ monthlyIncome: 10_000, monthlyObligations: 0, deposit: 50_000, annualInterestRate: 0, termYears: 10, repaymentRatio: 0.3 });
    expect(result.maximumMonthlyRepayment).toBe(3_000);
    expect(result.affordablePropertyPrice).toBe(410_000);
  });

  it('rejects repayment ratios outside the documented 10% to 60% range', () => {
    expect(() => calculateAffordability({ monthlyIncome: 10_000, monthlyObligations: 0, deposit: 0, annualInterestRate: 15, termYears: 20, repaymentRatio: 0.61 })).toThrow();
  });
});

describe('rental yield calculator', () => {
  it('calculates annual income, gross yield and net yield', () => {
    expect(calculateRentalYield({ purchasePrice: 1_200_000, monthlyRent: 12_000, annualExpenses: 24_000 })).toEqual({ annualIncome: 144_000, grossYield: 12, netYield: 10 });
  });

  it('rejects expenses greater than annual rental income', () => {
    expect(() => calculateRentalYield({ purchasePrice: 1_000_000, monthlyRent: 5_000, annualExpenses: 60_001 })).toThrow('expenses');
  });

  it('returns zero yields when no rent is expected', () => {
    expect(calculateRentalYield({ purchasePrice: 1_000_000, monthlyRent: 0, annualExpenses: 0 })).toEqual({ annualIncome: 0, grossYield: 0, netYield: 0 });
  });
});

describe('buying cost estimator', () => {
  it('totals only the costs supplied by the customer', () => {
    expect(calculateBuyingCosts({ purchasePrice: 1_000_000, legalCosts: 20_000, taxesAndStatutoryFees: 15_000, transferAndRegistration: 10_000, otherCosts: 5_000 })).toEqual({ additionalCosts: 50_000, estimatedTotal: 1_050_000 });
  });

  it('rejects negative cost inputs', () => {
    expect(() => calculateBuyingCosts({ purchasePrice: 1_000_000, legalCosts: -1, taxesAndStatutoryFees: 0, transferAndRegistration: 0, otherCosts: 0 })).toThrow();
  });
});
