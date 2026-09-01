import { useMemo, useState } from "react";
import { Calculator } from "lucide-react";

const naira = (n: number) => `₦${Math.round(n).toLocaleString("en-NG")}`;

export function MortgageCalculator({ price }: { price: number }) {
  const [downPaymentPct, setDownPaymentPct] = useState(20);
  const [interestRate, setInterestRate] = useState(22);
  const [tenureYears, setTenureYears] = useState(10);

  const result = useMemo(() => {
    const downPayment = price * (downPaymentPct / 100);
    const principal = Math.max(price - downPayment, 0);
    const monthlyRate = interestRate / 100 / 12;
    const numPayments = tenureYears * 12;

    const monthlyPayment =
      monthlyRate === 0
        ? principal / numPayments
        : (principal * monthlyRate * Math.pow(1 + monthlyRate, numPayments)) /
          (Math.pow(1 + monthlyRate, numPayments) - 1);

    const totalRepayment = monthlyPayment * numPayments;
    const totalInterest = totalRepayment - principal;

    return { downPayment, principal, monthlyPayment, totalRepayment, totalInterest };
  }, [price, downPaymentPct, interestRate, tenureYears]);

  return (
    <div className="rounded-xl border border-border bg-surface/60 p-5">
      <div className="flex items-center gap-2 text-sm font-semibold">
        <Calculator className="h-4 w-4 text-gold" /> Mortgage calculator
      </div>
      <p className="mt-1 text-xs text-muted-foreground">
        Estimate only — actual rates and terms depend on your lender.
      </p>

      <div className="mt-5 space-y-5">
        <div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Down payment</span>
            <span className="font-medium">
              {downPaymentPct}% · {naira(result.downPayment)}
            </span>
          </div>
          <input
            type="range"
            min={10}
            max={70}
            step={5}
            value={downPaymentPct}
            onChange={(e) => setDownPaymentPct(Number(e.target.value))}
            className="mt-2 w-full accent-gold"
          />
        </div>

        <div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Interest rate (annual)</span>
            <span className="font-medium">{interestRate}%</span>
          </div>
          <input
            type="range"
            min={6}
            max={30}
            step={0.5}
            value={interestRate}
            onChange={(e) => setInterestRate(Number(e.target.value))}
            className="mt-2 w-full accent-gold"
          />
        </div>

        <div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Loan tenure</span>
            <span className="font-medium">
              {tenureYears} yr{tenureYears === 1 ? "" : "s"}
            </span>
          </div>
          <input
            type="range"
            min={1}
            max={20}
            step={1}
            value={tenureYears}
            onChange={(e) => setTenureYears(Number(e.target.value))}
            className="mt-2 w-full accent-gold"
          />
        </div>
      </div>

      <div className="mt-6 rounded-lg border border-gold/30 bg-gold/5 p-4">
        <div className="text-xs uppercase tracking-wider text-muted-foreground">
          Estimated monthly payment
        </div>
        <div className="mt-1 text-2xl font-bold text-gradient-gold">
          {naira(result.monthlyPayment)}
          <span className="text-sm text-muted-foreground">/mo</span>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-3 text-xs">
          <div>
            <div className="text-muted-foreground">Loan principal</div>
            <div className="mt-0.5 font-medium">{naira(result.principal)}</div>
          </div>
          <div>
            <div className="text-muted-foreground">Total interest</div>
            <div className="mt-0.5 font-medium">{naira(result.totalInterest)}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
