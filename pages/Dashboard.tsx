
import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLiveQuery } from 'dexie-react-hooks';
import { 
  TrendingUp, TrendingDown, Wallet, Activity, PieChart as PieChartIcon, 
  ArrowRight, CreditCard, ArrowUpRight, ArrowDownLeft, FileText, Save, 
  Download, Sparkles, Eye, EyeOff, MoreHorizontal, Calendar, Bell
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, Legend
} from 'recharts';
import { 
  db, 
  getMonthlyStats, 
  getLast30DaysChartData, 
  getCategoryBreakdown,
  getRecentTransactions,
  getBudgetsWithStats,
  getSavingsGoals,
  getUpcomingBills
} from '../services/storageService';
import { formatCurrency, formatDate } from '../utils/formatters';
import { generatePDFReport, generateBackup, generateCSVExport } from '../utils/exportHelpers';
import { UserProfile, Transaction, Budget, SavingsGoal, RecurringTransaction } from '../types';
import { HealthScoreModal } from '../components/mobile/HealthScoreModal';
import { useToast } from '../context/ToastContext';

const COLORS = ['#8b5cf6', '#d946ef', '#3b82f6', '#10b981', '#f59e0b', '#ef4444'];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
};

const Skeleton: React.FC<{ className: string }> = ({ className }) => (
  <div className={`bg-white/5 animate-pulse rounded-xl ${className}`} />
);

const AnimatedNumber: React.FC<{ value: number }> = ({ value }) => {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    let start = 0;
    const duration = 1000; 
    const startTime = performance.now();
    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const ease = 1 - Math.pow(1 - progress, 3);
      setDisplayValue(Math.floor(start + (value - start) * ease));
      if (progress < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }, [value]);

  return <>{formatCurrency(displayValue)}</>;
};

interface DashboardProps {
  user: UserProfile;
}

const Dashboard: React.FC<DashboardProps> = ({ user }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({ income: 0, expense: 0, savingsRate: 0 });
  const [chartData, setChartData] = useState<any[]>([]);
  const [recentTxs, setRecentTxs] = useState<Transaction[]>([]);
  const [categoryData, setCategoryData] = useState<any[]>([]);
  const [upcomingBills, setUpcomingBills] = useState<RecurringTransaction[]>([]);
  
  // Extra data for Health Score calculation
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [savings, setSavings] = useState<SavingsGoal[]>([]);

  const [showBalance, setShowBalance] = useState(true);
  const [greeting, setGreeting] = useState('Welcome back');
  const [isHealthModalOpen, setIsHealthModalOpen] = useState(false);
  
  const { showToast } = useToast();

  // Trigger re-render when transactions for THIS user change
  const transactionsTrigger = useLiveQuery(() => 
    db.transactions.where('userId').equals(user.email).toArray()
  );

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting('Good Morning');
    else if (hour < 18) setGreeting('Good Afternoon');
    else setGreeting('Good Evening');
  }, []);

  useEffect(() => {
    const loadDashboardData = async () => {
      const startLoad = Date.now();
      
      const s = await getMonthlyStats();
      const cData = await getLast30DaysChartData();
      const recent = await getRecentTransactions(5);
      const b = await getBudgetsWithStats();
      const sv = await getSavingsGoals();
      const catData = await getCategoryBreakdown('expense');
      const bills = await getUpcomingBills();
      
      setStats(s);
      setChartData(cData);
      setRecentTxs(recent);
      setBudgets(b);
      setSavings(sv);
      setCategoryData(catData.slice(0, 5)); // Top 5 categories
      setUpcomingBills(bills);

      const elapsed = Date.now() - startLoad;
      if (elapsed < 500) {
        setTimeout(() => setIsLoading(false), 500 - elapsed);
      } else {
        setIsLoading(false);
      }
    };

    loadDashboardData();
  }, [transactionsTrigger]);

  const totalBalance = (stats.income - stats.expense);
  const cashflowPercentage = stats.income > 0 ? (stats.expense / stats.income) * 100 : 0;
  
  // --- Health Score Calculation (Simplified for Dashboard speed) ---
  const savingsRate = stats.income > 0 ? ((stats.income - stats.expense) / stats.income) * 100 : 0;
  const cashflowScore = Math.max(0, Math.min(50, (savingsRate / 20) * 50));
  
  let budgetAdherenceRatio = 0;
  let budgetScore = 0;
  if (budgets.length > 0) {
      const successfulBudgets = budgets.filter(b => b.spent <= b.limit).length;
      budgetAdherenceRatio = successfulBudgets / budgets.length;
      budgetScore = Math.round(budgetAdherenceRatio * 30);
  } else {
      budgetAdherenceRatio = savingsRate > 0 ? 0.8 : 0.4;
      budgetScore = savingsRate > 0 ? 20 : 0;
  }
  const totalSavings = savings.reduce((acc, curr) => acc + curr.currentAmount, 0);
  const assetScore = totalSavings > 0 ? 20 : 0;
  const financialHealthScore = Math.round(cashflowScore + budgetScore + assetScore);

  const getHealthLabel = (score: number) => {
    if (score >= 80) return { label: 'Excellent', color: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20' };
    if (score >= 60) return { label: 'Healthy', color: 'text-blue-400 bg-blue-400/10 border-blue-400/20' };
    if (score >= 40) return { label: 'Fair', color: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20' };
    return { label: 'Attention', color: 'text-red-400 bg-red-400/10 border-red-400/20' };
  };

  const health = getHealthLabel(financialHealthScore);

  const handlePDFExport = async () => {
    const success = await generatePDFReport(user);
    if (success) showToast('PDF Report generated successfully');
    else showToast('Failed to generate PDF', 'error');
  };

  const handleBackup = async () => {
    const success = await generateBackup(user);
    if (success) showToast('Backup file downloaded');
    else showToast('Backup failed', 'error');
  };

  const handleCSVExport = async () => {
    const success = await generateCSVExport();
    if (success) showToast('CSV Exported');
    else showToast('CSV Export failed', 'error');
  };

  return (
    <motion.div 
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="p-5 space-y-5"
    >
      {/* 1. Header */}
      <motion.div variants={itemVariants} className="flex justify-between items-end relative z-10">
        <div>
          <h2 className="text-slate-400 text-xs font-medium mb-0.5 flex items-center gap-1">
             {greeting}, <Sparkles size={10} className="text-yellow-400" />
          </h2>
          {isLoading ? (
            <Skeleton className="h-8 w-48 mt-1" />
          ) : (
            <h1 className="text-xl font-bold text-white bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400 truncate max-w-[200px]">
              {user.name}
            </h1>
          )}
        </div>
        
        {isLoading ? (
            <Skeleton className="h-10 w-24 rounded-lg" />
        ) : (
            <button 
                onClick={() => setIsHealthModalOpen(true)}
                className={`flex flex-col items-end px-2.5 py-1 rounded-lg border backdrop-blur-md transition-transform active:scale-95 ${health.color}`}
            >
              <span className="text-[10px] font-bold uppercase tracking-wider opacity-70">Health Score</span>
              <div className="flex items-center gap-1.5">
                  <Activity size={12} />
                  <span className="font-bold text-xs">{financialHealthScore}/100</span>
              </div>
            </button>
        )}
      </motion.div>

      {/* 2. ULTIMATE BALANCE CARD */}
      <motion.div variants={itemVariants} className="relative group perspective-1000">
        <div className="absolute -inset-0.5 bg-gradient-to-r from-violet-600 via-fuchsia-600 to-indigo-600 rounded-[26px] blur opacity-20 group-hover:opacity-40 transition-opacity duration-700" />
        <div className="relative overflow-hidden rounded-[24px] bg-[#0f172a] border border-white/10 shadow-2xl p-4 min-h-[180px]">
          {isLoading ? (
             <div className="space-y-4">
                 <div className="flex justify-between">
                     <Skeleton className="h-6 w-24 rounded-full" />
                     <Skeleton className="h-8 w-16 rounded-full" />
                 </div>
                 <Skeleton className="h-12 w-2/3 my-2" />
                 <div className="grid grid-cols-2 gap-2">
                     <Skeleton className="h-14 w-full rounded-xl" />
                     <Skeleton className="h-14 w-full rounded-xl" />
                 </div>
             </div>
          ) : (
             <>
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 via-purple-500/5 to-transparent" />
              <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-[80px] -mr-20 -mt-20 pointer-events-none" />
              <div className="absolute bottom-0 left-0 w-48 h-48 bg-accent/5 rounded-full blur-[60px] -ml-10 -mb-10 pointer-events-none" />
              
              <div className="relative z-10 flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-white/5 border border-white/5 backdrop-blur-md">
                    <Wallet size={12} className="text-indigo-300" />
                    <span className="text-[10px] font-bold text-indigo-100 tracking-wider uppercase">Total Balance</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button 
                      onClick={() => setShowBalance(!showBalance)}
                      className="p-1.5 rounded-full bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-all active:scale-95"
                    >
                        {showBalance ? <Eye size={14} /> : <EyeOff size={14} />}
                    </button>
                    <div className="p-1.5 rounded-full bg-white/5 text-slate-400">
                        <Sparkles size={14} className="text-yellow-400 opacity-80" />
                    </div>
                  </div>
                </div>
                
                <div className="-mt-1">
                  <div className="flex items-baseline gap-1.5 overflow-hidden">
                    <h2 className="text-3xl font-extrabold text-white tracking-tight drop-shadow-md">
                      {showBalance ? (
                          <AnimatedNumber value={totalBalance} />
                      ) : (
                          <span className="tracking-widest text-white/50">••••••••</span>
                      )}
                    </h2>
                    <span className="text-xs font-semibold text-slate-400">IDR</span>
                  </div>
                  
                  {showBalance && (
                      <div className="mt-0.5 flex items-center gap-2 text-[10px]">
                          <div className={`flex items-center px-1.5 py-0.5 rounded ${savingsRate > 0 ? 'text-emerald-400 bg-emerald-400/10' : 'text-red-400 bg-red-400/10'}`}>
                            {savingsRate > 0 ? <TrendingUp size={10} className="mr-1" /> : <TrendingDown size={10} className="mr-1" />}
                            <span className="font-bold">{Math.abs(savingsRate).toFixed(1)}%</span>
                          </div>
                          <span className="text-slate-500">Savings Rate</span>
                      </div>
                  )}
                </div>

                <div className="space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                      <div className="group/item relative bg-white/5 hover:bg-white/10 rounded-xl p-2 border border-white/5 transition-all">
                          <div className="flex items-center gap-1.5 mb-0.5">
                              <div className="p-1 rounded-full bg-emerald-500/20 text-emerald-400">
                                  <ArrowDownLeft size={12} />
                              </div>
                              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Income</span>
                          </div>
                          <p className="text-sm font-bold text-white pl-0.5">
                            {showBalance ? formatCurrency(stats.income) : '••••'}
                          </p>
                      </div>

                      <div className="group/item relative bg-white/5 hover:bg-white/10 rounded-xl p-2 border border-white/5 transition-all">
                          <div className="flex items-center gap-1.5 mb-0.5">
                              <div className="p-1 rounded-full bg-red-500/20 text-red-400">
                                  <ArrowUpRight size={12} />
                              </div>
                              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Expense</span>
                          </div>
                          <p className="text-sm font-bold text-white pl-0.5">
                            {showBalance ? formatCurrency(stats.expense) : '••••'}
                          </p>
                      </div>
                  </div>

                  <div className="bg-black/20 rounded-lg p-2 border border-white/5 backdrop-blur-sm flex flex-col gap-1">
                      <div className="flex justify-between items-center text-[10px]">
                        <span className="text-slate-400 font-medium">Cashflow</span>
                        <span className={`font-bold ${cashflowPercentage > 80 ? 'text-red-400' : 'text-emerald-400'}`}>
                            {cashflowPercentage.toFixed(0)}% Used
                        </span>
                      </div>
                      <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${Math.min(100, cashflowPercentage)}%` }}
                          transition={{ duration: 1.5, ease: "easeOut" }}
                          className={`h-full rounded-full shadow-[0_0_10px_rgba(0,0,0,0.5)] ${
                              cashflowPercentage > 90 ? 'bg-red-500' : 
                              cashflowPercentage > 70 ? 'bg-amber-500' : 
                              'bg-gradient-to-r from-emerald-500 to-teal-400'
                          }`}
                        />
                      </div>
                  </div>
                </div>
              </div>
             </>
          )}
        </div>
      </motion.div>

      {/* 3. Quick Actions */}
      <motion.div variants={itemVariants}>
        <div className="grid grid-cols-3 gap-3">
            {[
                { label: 'PDF Report', icon: FileText, color: 'pink', action: handlePDFExport },
                { label: 'Backup JSON', icon: Save, color: 'indigo', action: handleBackup },
                { label: 'Export CSV', icon: Download, color: 'blue', action: handleCSVExport },
            ].map((btn, idx) => (
                <button 
                  key={idx}
                  onClick={btn.action}
                  className={`
                    relative group overflow-hidden rounded-2xl p-3 border border-white/5 
                    bg-surface/50 hover:bg-surface/80 transition-all active:scale-95
                  `}
                >
                  <div className={`absolute inset-0 bg-${btn.color}-500/5 group-hover:bg-${btn.color}-500/10 transition-colors`} />
                  <div className="relative flex flex-col items-center gap-1.5">
                    <div className={`p-2 rounded-xl bg-${btn.color}-500/10 text-${btn.color}-400 group-hover:scale-110 transition-transform`}>
                        <btn.icon size={18} />
                    </div>
                    <span className="text-[10px] font-semibold text-slate-300">{btn.label}</span>
                  </div>
                </button>
            ))}
        </div>
      </motion.div>

      {/* 4. Functional Analytics Section */}
      <div className="grid grid-cols-1 gap-5">
          {/* Spending Breakdown Pie Chart */}
          <motion.div variants={itemVariants} className="bg-surface/40 backdrop-blur-md rounded-[24px] border border-white/5 p-5 shadow-xl">
             <div className="flex items-center justify-between mb-4">
               <h3 className="font-bold text-white text-sm flex items-center gap-2">
                 <PieChartIcon size={16} className="text-accent" />
                 Monthly Spending
               </h3>
               <span className="text-[10px] font-medium text-slate-500 bg-white/5 px-2 py-0.5 rounded-full">Top 5</span>
             </div>
             
             {isLoading ? (
                <Skeleton className="h-40 w-full" />
             ) : categoryData.length > 0 ? (
                <div className="flex items-center">
                    <div className="w-[120px] h-[120px] relative">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={categoryData}
                                    innerRadius={35}
                                    outerRadius={55}
                                    paddingAngle={5}
                                    dataKey="value"
                                    stroke="none"
                                >
                                    {categoryData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="flex-1 pl-4 space-y-2">
                        {categoryData.slice(0, 3).map((item, index) => (
                            <div key={index} className="flex justify-between items-center text-xs">
                                <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                                    <span className="text-slate-300 truncate max-w-[80px]">{item.name}</span>
                                </div>
                                <span className="font-bold text-white">{formatCurrency(item.value)}</span>
                            </div>
                        ))}
                        {categoryData.length > 3 && (
                            <p className="text-[10px] text-slate-500 text-right mt-1">+ {categoryData.length - 3} more</p>
                        )}
                    </div>
                </div>
             ) : (
                <div className="h-32 flex items-center justify-center text-xs text-slate-500">
                    No expense data this month.
                </div>
             )}
          </motion.div>

          {/* Upcoming Bills Widget */}
          <motion.div variants={itemVariants} className="bg-surface/40 backdrop-blur-md rounded-[24px] border border-white/5 p-5 shadow-xl">
              <div className="flex items-center justify-between mb-3">
                  <h3 className="font-bold text-white text-sm flex items-center gap-2">
                      <Bell size={16} className="text-yellow-400" />
                      Upcoming Bills
                  </h3>
              </div>
              {isLoading ? (
                  <Skeleton className="h-20 w-full" />
              ) : upcomingBills.length > 0 ? (
                  <div className="space-y-3">
                      {upcomingBills.map(bill => (
                          <div key={bill.id} className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/5">
                              <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 rounded-lg bg-surface flex flex-col items-center justify-center border border-white/10">
                                      <span className="text-[9px] text-red-400 font-bold uppercase">{new Date(bill.nextDueDate).toLocaleString('default', { month: 'short' })}</span>
                                      <span className="text-lg font-bold text-white leading-none">{new Date(bill.nextDueDate).getDate()}</span>
                                  </div>
                                  <div>
                                      <h4 className="text-sm font-bold text-slate-200">{bill.title}</h4>
                                      <p className="text-[10px] text-slate-500 capitalize">{bill.frequency}</p>
                                  </div>
                              </div>
                              <span className="font-bold text-white text-sm">{formatCurrency(bill.amount)}</span>
                          </div>
                      ))}
                  </div>
              ) : (
                  <div className="p-4 text-center border border-dashed border-white/10 rounded-xl">
                      <p className="text-xs text-slate-500">No upcoming bills found.</p>
                  </div>
              )}
          </motion.div>
      </div>

      {/* 5. Chart Section (Existing) */}
      <motion.div variants={itemVariants} className="bg-surface/40 backdrop-blur-md rounded-[24px] border border-white/5 p-5 shadow-xl min-h-[250px]">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-white text-sm flex items-center gap-2">
            <Activity size={16} className="text-primary" />
            Trend (30 Days)
          </h3>
        </div>
        <div className="h-48 w-full -ml-2 relative">
          {isLoading ? (
             <div className="absolute inset-0 flex items-end gap-2 px-4">
                 {[...Array(7)].map((_, i) => (
                     <Skeleton key={i} className={`w-full rounded-t-lg h-[${Math.random() * 80 + 20}%]`} />
                 ))}
             </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <Tooltip 
                  contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', padding: '8px' }}
                  itemStyle={{ color: '#fff', fontSize: '11px', fontWeight: 600 }}
                  labelStyle={{ color: '#94a3b8', fontSize: '10px', marginBottom: '4px' }}
                />
                <XAxis dataKey="date" hide />
                <Area type="monotone" dataKey="income" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorIncome)" />
                <Area type="monotone" dataKey="expense" stroke="#ef4444" strokeWidth={2} fillOpacity={1} fill="url(#colorExpense)" />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </motion.div>

      {/* 6. Recent Activity */}
      <motion.div variants={itemVariants} className="pb-8">
        <div className="flex justify-between items-center mb-3 px-1">
          <h3 className="font-bold text-white text-base">Recent Transactions</h3>
          <button className="text-[10px] font-semibold text-primary hover:text-primary/80 transition-colors flex items-center gap-1">
            See History <ArrowRight size={12} />
          </button>
        </div>
        
        <div className="space-y-2.5">
          {isLoading ? (
             <>
               <Skeleton className="h-16 w-full rounded-xl" />
               <Skeleton className="h-16 w-full rounded-xl" />
               <Skeleton className="h-16 w-full rounded-xl" />
             </>
          ) : (
             <>
              {recentTxs.map((tx, idx) => (
                <motion.div
                  key={tx.id || idx}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="group flex items-center justify-between p-3 bg-surface/40 hover:bg-surface/60 backdrop-blur-sm rounded-xl border border-white/5 hover:border-white/10 transition-all cursor-default"
                >
                  <div className="flex items-center gap-3">
                    <div className={`
                      w-10 h-10 rounded-xl flex items-center justify-center shadow-lg transition-transform group-hover:scale-105
                      ${tx.type === 'income' ? 'bg-gradient-to-br from-emerald-500/20 to-teal-500/20 text-emerald-400' : 'bg-gradient-to-br from-rose-500/20 to-orange-500/20 text-rose-400'}
                    `}>
                      {tx.type === 'income' ? <ArrowDownLeft size={18} strokeWidth={2.5} /> : <ArrowUpRight size={18} strokeWidth={2.5} />}
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-100 text-sm mb-0.5">{tx.title}</h4>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-md bg-white/5 text-slate-400">{tx.category}</span>
                        <span className="text-[10px] text-slate-500">{formatDate(tx.date)}</span>
                      </div>
                    </div>
                  </div>
                  <div className={`font-bold text-sm tracking-tight ${tx.type === 'income' ? 'text-emerald-400' : 'text-slate-200'}`}>
                    {tx.type === 'income' ? '+' : '-'}{formatCurrency(tx.amount)}
                  </div>
                </motion.div>
              ))}
              {recentTxs.length === 0 && (
                <div className="text-center text-slate-500 py-10 text-xs bg-surface/20 rounded-2xl border border-dashed border-white/5">
                    No recent transactions
                </div>
              )}
             </>
          )}
        </div>
      </motion.div>

      <HealthScoreModal 
        isOpen={isHealthModalOpen}
        onClose={() => setIsHealthModalOpen(false)}
        data={{
            score: financialHealthScore,
            savingsRate: savingsRate,
            budgetAdherence: budgetAdherenceRatio,
            hasSavings: assetScore > 0,
            totalSavings: totalSavings
        }}
      />
    </motion.div>
  );
};

export default Dashboard;
