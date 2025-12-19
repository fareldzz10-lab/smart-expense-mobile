
import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calculator, TrendingUp, DollarSign, Percent, Clock, ChevronRight, PieChart as PieChartIcon } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { formatCurrency } from '../utils/formatters';

type ToolType = 'compound' | 'loan';

const Tools: React.FC = () => {
  const [activeTool, setActiveTool] = useState<ToolType>('compound');

  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      exit={{ opacity: 0 }}
      className="p-5 pb-24 min-h-full flex flex-col"
    >
      {/* Header */}
      <div className="mb-6 relative">
        <div className="absolute top-0 right-0 w-20 h-20 bg-primary/20 rounded-full blur-2xl -mr-4 -mt-4 pointer-events-none" />
        <h1 className="text-2xl font-bold text-white flex items-center gap-2 relative z-10">
          <Calculator className="text-primary" />
          Financial Tools
        </h1>
        <p className="text-slate-400 text-xs mt-1 relative z-10">
          Simulate your financial future.
        </p>
      </div>

      {/* Tool Switcher - Segmented Control */}
      <div className="flex p-1.5 bg-surface/50 backdrop-blur-md border border-white/10 rounded-2xl mb-8 relative">
        <motion.div 
            layoutId="activeTab"
            className={`absolute top-1.5 bottom-1.5 rounded-xl bg-primary shadow-lg shadow-primary/20 z-0`}
            initial={false}
            animate={{ 
                left: activeTool === 'compound' ? '6px' : '50%', 
                width: 'calc(50% - 6px)',
                x: activeTool === 'loan' ? '0%' : '0%'
            }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
        />
        <button
          onClick={() => setActiveTool('compound')}
          className={`flex-1 py-3 text-sm font-semibold rounded-xl relative z-10 transition-colors ${
            activeTool === 'compound' ? 'text-white' : 'text-slate-400 hover:text-white'
          }`}
        >
          Investment
        </button>
        <button
          onClick={() => setActiveTool('loan')}
          className={`flex-1 py-3 text-sm font-semibold rounded-xl relative z-10 transition-colors ${
            activeTool === 'loan' ? 'text-white' : 'text-slate-400 hover:text-white'
          }`}
        >
          Loan
        </button>
      </div>

      {/* Content */}
      <AnimatePresence mode="wait">
        {activeTool === 'compound' ? (
          <CompoundInterestCalculator key="compound" />
        ) : (
          <LoanCalculator key="loan" />
        )}
      </AnimatePresence>
    </motion.div>
  );
};

// --- Compound Interest Calculator ---

const CompoundInterestCalculator: React.FC = () => {
  const [initial, setInitial] = useState(1000000);
  const [monthly, setMonthly] = useState(500000);
  const [rate, setRate] = useState(7);
  const [years, setYears] = useState(10);

  const result = useMemo(() => {
    const r = rate / 100 / 12;
    const n = years * 12;
    const fvInitial = initial * Math.pow(1 + r, n);
    const fvMonthly = monthly * ((Math.pow(1 + r, n) - 1) / r);
    const total = fvInitial + fvMonthly;
    const totalInvested = initial + (monthly * n);
    const interestEarned = total - totalInvested;

    return { total, totalInvested, interestEarned };
  }, [initial, monthly, rate, years]);

  const chartData = [
    { name: 'Invested', value: Math.round(result.totalInvested) },
    { name: 'Interest', value: Math.round(result.interestEarned) },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="space-y-6"
    >
      {/* Result Card */}
      <div className="bg-surface/60 backdrop-blur-xl rounded-[24px] p-6 border border-white/10 shadow-xl relative overflow-hidden">
        <div className="flex justify-between items-start">
            <div>
                <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider mb-1">Projected Total</p>
                <h2 className="text-3xl font-bold text-white tracking-tight">
                    {formatCurrency(result.total)}
                </h2>
                <div className="mt-2 flex items-center gap-2 text-xs">
                     <span className="text-emerald-400 font-bold">+{formatCurrency(result.interestEarned)}</span>
                     <span className="text-slate-500">Interest Earned</span>
                </div>
            </div>
            {/* Donut Chart */}
            <div className="w-20 h-20 -mt-2 -mr-2 min-w-[80px] min-h-[80px]">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={chartData}
                            innerRadius={25}
                            outerRadius={38}
                            paddingAngle={5}
                            dataKey="value"
                            stroke="none"
                        >
                            <Cell key="invested" fill="#3b82f6" /> {/* Blue */}
                            <Cell key="interest" fill="#10b981" /> {/* Emerald */}
                        </Pie>
                    </PieChart>
                </ResponsiveContainer>
            </div>
        </div>
        
        {/* Progress Bars */}
        <div className="mt-6 space-y-3">
             <div className="space-y-1">
                 <div className="flex justify-between text-[10px] text-slate-400 uppercase font-bold tracking-wider">
                     <span>Principal</span>
                     <span>{((result.totalInvested / result.total) * 100).toFixed(0)}%</span>
                 </div>
                 <div className="h-1.5 w-full bg-background/50 rounded-full overflow-hidden">
                     <motion.div 
                        initial={{ width: 0 }} 
                        animate={{ width: `${(result.totalInvested / result.total) * 100}%` }}
                        className="h-full bg-blue-500 rounded-full" 
                     />
                 </div>
             </div>
             <div className="space-y-1">
                 <div className="flex justify-between text-[10px] text-slate-400 uppercase font-bold tracking-wider">
                     <span>Interest</span>
                     <span>{((result.interestEarned / result.total) * 100).toFixed(0)}%</span>
                 </div>
                 <div className="h-1.5 w-full bg-background/50 rounded-full overflow-hidden">
                     <motion.div 
                        initial={{ width: 0 }} 
                        animate={{ width: `${(result.interestEarned / result.total) * 100}%` }}
                        className="h-full bg-emerald-500 rounded-full" 
                     />
                 </div>
             </div>
        </div>
      </div>

      {/* Inputs */}
      <div className="space-y-5 px-1">
        <InputGroup 
          label="Initial Investment" 
          value={initial} 
          onChange={setInitial} 
          icon={DollarSign}
        />
        <InputGroup 
          label="Monthly Contribution" 
          value={monthly} 
          onChange={setMonthly} 
          icon={TrendingUp}
        />
        
        <SliderGroup 
            label="Annual Interest Rate"
            value={rate}
            onChange={setRate}
            min={1}
            max={20}
            step={0.5}
            unit="%"
            color="emerald"
        />

        <SliderGroup 
            label="Time Period"
            value={years}
            onChange={setYears}
            min={1}
            max={40}
            step={1}
            unit=" Years"
            color="blue"
        />
      </div>
    </motion.div>
  );
};

// --- Loan Calculator ---

const LoanCalculator: React.FC = () => {
  const [amount, setAmount] = useState(50000000);
  const [rate, setRate] = useState(8); 
  const [years, setYears] = useState(3);

  const result = useMemo(() => {
    const r = rate / 100 / 12; 
    const n = years * 12; 
    let monthlyPayment = 0;
    if (rate > 0) {
      monthlyPayment = amount * (r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
    } else {
      monthlyPayment = amount / n;
    }
    const totalRepayment = monthlyPayment * n;
    const totalInterest = totalRepayment - amount;
    return { monthlyPayment, totalRepayment, totalInterest };
  }, [amount, rate, years]);

  const chartData = [
    { name: 'Principal', value: Math.round(amount) },
    { name: 'Interest', value: Math.round(result.totalInterest) },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="space-y-6"
    >
      {/* Result Card */}
      <div className="bg-surface/60 backdrop-blur-xl rounded-[24px] p-6 border border-white/10 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/10 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none" />
        
        <div className="flex justify-between items-start relative z-10">
            <div>
                <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider mb-1">Monthly Payment</p>
                <h2 className="text-3xl font-bold text-white tracking-tight">
                    {formatCurrency(result.monthlyPayment)}
                </h2>
                <div className="mt-2 flex items-center gap-2 text-xs">
                     <span className="text-slate-300">Total Payback:</span>
                     <span className="text-white font-semibold">{formatCurrency(result.totalRepayment)}</span>
                </div>
            </div>
            {/* Donut Chart */}
            <div className="w-20 h-20 -mt-2 -mr-2 min-w-[80px] min-h-[80px]">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={chartData}
                            innerRadius={25}
                            outerRadius={38}
                            paddingAngle={5}
                            dataKey="value"
                            stroke="none"
                        >
                            <Cell key="principal" fill="#3b82f6" /> {/* Blue */}
                            <Cell key="interest" fill="#ef4444" /> {/* Red */}
                        </Pie>
                    </PieChart>
                </ResponsiveContainer>
            </div>
        </div>

        {/* Breakdown Stats */}
        <div className="mt-6 flex gap-4">
             <div className="flex-1 bg-background/40 rounded-xl p-3 border border-white/5">
                 <p className="text-[10px] text-slate-400 mb-1">Total Interest</p>
                 <p className="text-sm font-bold text-red-400">{formatCurrency(result.totalInterest)}</p>
             </div>
             <div className="flex-1 bg-background/40 rounded-xl p-3 border border-white/5">
                 <p className="text-[10px] text-slate-400 mb-1">Loan Amount</p>
                 <p className="text-sm font-bold text-blue-400">{formatCurrency(amount)}</p>
             </div>
        </div>
      </div>

      {/* Inputs */}
      <div className="space-y-5 px-1">
        <InputGroup 
          label="Loan Amount" 
          value={amount} 
          onChange={setAmount} 
          icon={DollarSign}
        />
        
        <SliderGroup 
            label="Interest Rate"
            value={rate}
            onChange={setRate}
            min={1}
            max={30}
            step={0.1}
            unit="%"
            color="red"
        />

        <SliderGroup 
            label="Loan Term"
            value={years}
            onChange={setYears}
            min={1}
            max={30}
            step={1}
            unit=" Years"
            color="blue"
        />
      </div>
    </motion.div>
  );
};

// --- Reusable Input Components ---

const InputGroup: React.FC<{ 
  label: string; 
  value: number; 
  onChange: (val: number) => void;
  icon: any;
}> = ({ label, value, onChange, icon: Icon }) => (
  <div>
    <label className="text-xs text-slate-400 mb-2 block font-medium ml-1">{label}</label>
    <div className="relative group">
      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-primary transition-colors">
        <Icon size={18} />
      </div>
      <input
        type="number"
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full bg-surface border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white font-bold text-lg focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/50 transition-all shadow-sm"
      />
    </div>
  </div>
);

const SliderGroup: React.FC<{
    label: string;
    value: number;
    onChange: (val: number) => void;
    min: number;
    max: number;
    step: number;
    unit: string;
    color: 'emerald' | 'blue' | 'red';
}> = ({ label, value, onChange, min, max, step, unit, color }) => {
    
    const percentage = ((value - min) / (max - min)) * 100;
    const colorClass = color === 'emerald' ? 'bg-emerald-500' : color === 'red' ? 'bg-red-500' : 'bg-blue-500';

    return (
        <div>
            <div className="flex justify-between items-end mb-3 px-1">
                <label className="text-xs text-slate-400 font-medium">{label}</label>
                <div className="text-sm font-bold text-white bg-white/5 px-2 py-1 rounded-lg border border-white/5 min-w-[60px] text-center">
                    {value}{unit}
                </div>
            </div>
            <div className="relative w-full h-6 flex items-center">
                <input 
                    type="range" 
                    min={min} 
                    max={max} 
                    step={step}
                    value={value} 
                    onChange={(e) => onChange(Number(e.target.value))}
                    className="absolute w-full h-2 bg-white/10 rounded-full appearance-none cursor-pointer z-10 opacity-0"
                />
                {/* Custom Track */}
                <div className="w-full h-2 bg-surface rounded-full overflow-hidden relative border border-white/5">
                    <div 
                        className={`h-full ${colorClass} transition-all duration-150`} 
                        style={{ width: `${percentage}%` }}
                    />
                </div>
                {/* Custom Thumb */}
                <div 
                    className="absolute h-5 w-5 bg-white rounded-full shadow-lg pointer-events-none transition-all duration-150"
                    style={{ left: `calc(${percentage}% - 10px)` }}
                />
            </div>
            <div className="flex justify-between text-[10px] text-slate-600 mt-1 px-1">
                <span>{min}{unit}</span>
                <span>{max}{unit}</span>
            </div>
        </div>
    );
}

export default Tools;
