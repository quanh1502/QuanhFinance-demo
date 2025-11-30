import React, { useState, useEffect, useMemo, useRef } from 'react';
// [MODIFIED] Removed 'Debt' from import to use local definition
import { FilterState, GasLog, SeasonalTheme, ExpenseLog, DebtTransaction, IncomeLog, FoodLog, Holiday, SavingsTransaction } from './types';
import { TaurusIcon, StarIcon, SnowflakeIcon, FilterIcon, GasPumpIcon, WifiIcon, FoodIcon, PiggyBankIcon, TargetIcon, ChartLineIcon, WarningIcon, PlusIcon, CheckIcon, CalendarIcon, TagIcon, MoneyBillIcon, BoltIcon, SaveIcon, CircleIcon, CheckCircleIcon, HistoryIcon, HourglassIcon, CloseIcon, ListIcon, TrashIcon, CreditCardIcon, RepeatIcon, EditIcon, ShoppingBagIcon, MinusIcon, CalendarPlusIcon, PlaneIcon, WalletIcon, SunIcon, ArrowRightIcon, ExchangeIcon, CloudArrowUpIcon, CloudArrowDownIcon, TargetIcon as GoalIcon } from './components/icons';
import { formatDate, formatDateTime, daysBetween, getWeekNumber, getWeekRange, isDateInFilter, MONTH_NAMES, getUpcomingHolidays } from './utils/date';
import Header from './components/Header';
import FilterModal from './components/FilterModal';
import { sadDogImageBase64 } from './assets/sadDogImage';
import VirtualCard from './components/VirtualCard';
import ShoppingCopilot from './components/ShoppingCopilot';

// --- FIREBASE IMPORTS ---
import { signInWithPopup, signOut, onAuthStateChanged, User } from "firebase/auth";
import { doc, onSnapshot, setDoc, getDoc } from "firebase/firestore";
import { auth, googleProvider, db } from "./firebase";

const STORAGE_KEY = 'spending_app_data_v1';
const STRATEGY_KEY = 'spending_app_strategy_v1'; // [NEW] Key to save the strategy
const UI_MODE_KEY = 'spending_app_ui_mode';

// --- [ADDED] Local Debt Interface Definition to fix TS errors ---
export interface Debt {
    id: string;
    name: string;
    source: string;
    totalAmount: number;
    amountPaid: number;
    dueDate: Date;
    createdAt: Date;
    targetMonth?: number;
    targetYear?: number;
    transactions?: DebtTransaction[];
    // New fields
    repaymentType?: 'fixed' | 'flexible';
    monthlyInstallment?: number;
    isBNPL?: boolean; // [NEW] Đánh dấu là Ví trả sau/Credit Card
}

// --- HELPER: Xử lý ngày tháng an toàn tuyệt đối ---
const safeDate = (d: any): Date => {
    if (!d) return new Date();
    if (d instanceof Date) return d;
    if (typeof d === 'object' && 'seconds' in d) {
        return new Date(d.seconds * 1000); 
    }
    return new Date(d);
};

const sanitizeForFirestore = (obj: any): any => {
    return JSON.parse(JSON.stringify(obj));
};

const parseDataDates = (data: any) => {
    if (!data) return {};
    const parsed = { ...data };

    if (parsed.gasHistory) parsed.gasHistory = parsed.gasHistory.map((x: any) => ({ ...x, date: safeDate(x.date) }));
    if (parsed.lastWifiPayment) parsed.lastWifiPayment = safeDate(parsed.lastWifiPayment);
    if (parsed.incomeLogs) parsed.incomeLogs = parsed.incomeLogs.map((x: any) => ({ ...x, date: safeDate(x.date) }));
    if (parsed.foodLogs) parsed.foodLogs = parsed.foodLogs.map((x: any) => ({ ...x, date: safeDate(x.date) }));
    if (parsed.miscLogs) parsed.miscLogs = parsed.miscLogs.map((x: any) => ({ ...x, date: safeDate(x.date) }));
    if (parsed.savingsHistory) parsed.savingsHistory = parsed.savingsHistory.map((x: any) => ({ ...x, date: safeDate(x.date) }));
    
    if (parsed.debts) {
        parsed.debts = parsed.debts.map((d: any) => ({
            ...d,
            dueDate: safeDate(d.dueDate),
            createdAt: safeDate(d.createdAt),
            transactions: d.transactions?.map((t: any) => ({ ...t, date: safeDate(t.date) })) || []
        }));
    }
    if (parsed.holidays) parsed.holidays = parsed.holidays.map((x: any) => ({ ...x, date: safeDate(x.date) }));

    return parsed;
}

const loadLocalData = () => {
    try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (!saved) return null;
        return parseDataDates(JSON.parse(saved));
    } catch (e) { return null; }
};

// --- [NEW] Helper to get date from filter ---
const getDateFromFilter = (filter: FilterState): Date => {
    const now = new Date();
    
    // Nếu bộ lọc trùng với thời gian hiện tại, dùng ngày giờ hiện tại để chính xác
    if (filter.type === 'week' && filter.week === getWeekNumber(now)[1] && filter.year === now.getFullYear()) return now;
    if (filter.type === 'month' && filter.month === now.getMonth() && filter.year === now.getFullYear()) return now;
    if (filter.type === 'year' && filter.year === now.getFullYear()) return now;

    // Nếu khác, tính ngày bắt đầu của bộ lọc
    if (filter.type === 'week' && filter.week) {
        // Tính ngày thứ 2 của tuần đó (Simple approximation for ISO week)
        const simple = new Date(filter.year, 0, 1 + (filter.week - 1) * 7);
        const day = simple.getDay();
        const diff = simple.getDate() - day + (day === 0 ? -6 : 1); // Adjust to Monday
        const targetDate = new Date(simple.setDate(diff));
        // Set to noon to avoid timezone edge cases
        targetDate.setHours(12, 0, 0, 0);
        return targetDate;
    }
    if (filter.type === 'month' && filter.month !== undefined) {
        return new Date(filter.year, filter.month, 1, 12, 0, 0);
    }
    return new Date(filter.year, 0, 1, 12, 0, 0);
};

// --- INLINE COMPONENTS ---
interface CurrencyInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange'> {
    value: number;
    onValueChange: (value: number) => void;
}
const CurrencyInput: React.FC<CurrencyInputProps> = ({ value, onValueChange, className, placeholder, ...props }) => {
    const displayValue = value ? (value / 1000).toLocaleString('vi-VN', { maximumFractionDigits: 3 }) : '';
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const raw = e.target.value.replace(/[^0-9.]/g, '');
        if (!raw) { onValueChange(0); return; }
        const num = parseFloat(raw);
        if (!isNaN(num)) onValueChange(num * 1000);
    };
    return (
        <div className="relative w-full">
            <input {...props} type="text" inputMode="decimal" className={`${className} pr-10`} value={displayValue} onChange={handleChange} placeholder={placeholder || "0"} />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-white/50 pointer-events-none select-none font-medium text-sm">.000</span>
        </div>
    );
};

interface StatCardProps { icon: React.ReactNode; title: string; value: string; color: string; subtitle?: string; theme: SeasonalTheme; action?: React.ReactNode; }
const StatCard: React.FC<StatCardProps> = ({ icon, title, value, color, subtitle, theme, action }) => (
    <div className={`${theme.cardBg} p-4 rounded-lg shadow-md flex items-center justify-between transition-all duration-300`}>
        <div className="flex items-center"><div className={`mr-4 text-3xl ${color}`}>{icon}</div><div><p className={`text-sm ${theme.secondaryTextColor}`}>{title}</p><p className={`text-xl font-bold ${theme.primaryTextColor}`}>{value}</p>{subtitle && <p className={`text-xs ${theme.secondaryTextColor}`}>{subtitle}</p>}</div></div>{action && <div>{action}</div>}
    </div>
);

// [UPDATED] DebtItem to support 'fixed' vs 'flexible' logic and BNPL badge
interface DebtItemProps { debt: Debt; onAddPayment: (id: string, amount: number, date: Date) => void; onWithdrawPayment: (id: string, amount: number, reason: string) => void; onEdit: (debt: Debt) => void; theme: SeasonalTheme; disposableIncome: number; }
const DebtItem: React.FC<DebtItemProps> = ({ debt, onAddPayment, onWithdrawPayment, onEdit, theme, disposableIncome }) => {
    const [inputValue, setInputValue] = useState(0);
    const [showWithdrawReason, setShowWithdrawReason] = useState(false);
    const [withdrawReason, setWithdrawReason] = useState('');
    const [showHistory, setShowHistory] = useState(false);
    const [isConfirmingPayment, setIsConfirmingPayment] = useState(false);
    const [paymentDate, setPaymentDate] = useState(new Date().toISOString().slice(0, 10));
    const remaining = debt.totalAmount - debt.amountPaid;
    const daysLeft = Math.ceil((debt.dueDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
    
    // [UPDATED] Logic displaying based on repaymentType
    const isFixed = debt.repaymentType === 'fixed';
    const weeklyPaymentNeed = remaining > 0 ? remaining / Math.max(1, Math.ceil(daysLeft / 7)) : 0;
    
    const handleInitiateAdd = () => { if (inputValue > 0) { setIsConfirmingPayment(true); setPaymentDate(new Date().toISOString().slice(0, 10)); } };
    const confirmAddPayment = () => { onAddPayment(debt.id, inputValue, new Date(paymentDate)); setInputValue(0); setIsConfirmingPayment(false); };
    const confirmWithdraw = () => { if (withdrawReason.trim()) { onWithdrawPayment(debt.id, inputValue, withdrawReason); setShowWithdrawReason(false); setWithdrawReason(''); setInputValue(0); } else alert("Cần lý do!"); };
    
    const getSmartSuggestion = () => { 
        if (remaining <= 0) return null; 
        if (disposableIncome <= 0) return { text: "Thu nhập thấp, tạm ngưng.", color: "text-slate-400", bgColor: "bg-slate-700/50" }; 
        if (isFixed) return { text: "Nhớ đóng đúng hạn định kỳ.", color: "text-amber-300", bgColor: "bg-amber-900/30" };
        if (disposableIncome > weeklyPaymentNeed * 2) return { text: "Dư dả! Tăng mức góp.", color: "text-green-300", bgColor: "bg-green-900/30" }; 
        return { text: "Tiếp tục tích lũy.", color: "text-blue-300", bgColor: "bg-blue-900/30" }; 
    };
    
    const suggestion = getSmartSuggestion();
    let statusColor = daysLeft < 0 ? 'text-red-400' : daysLeft <= 3 ? 'text-orange-400' : 'text-green-400';
    let statusText = daysLeft < 0 ? `Quá hạn ${Math.abs(daysLeft)} ngày` : daysLeft <= 3 ? `Gấp! Còn ${daysLeft} ngày` : `Còn ${daysLeft} ngày`;
    
    return (
        <div className={`p-4 rounded-lg shadow-md mb-3 transition-all duration-300 ${daysLeft < 0 ? 'bg-red-900/20 border border-red-500/30' : `${theme.cardBg} border border-slate-700/50`}`}>
            <div className="flex justify-between items-start"><div className="flex-1 pr-2">
                <div className="flex items-center gap-2">
                    <h4 className={`font-bold text-lg ${theme.primaryTextColor}`}>{debt.name}</h4>
                    {/* [NEW] BNPL Badge */}
                    {debt.isBNPL && <span className="text-[10px] bg-purple-900/50 text-purple-300 px-1.5 py-0.5 rounded border border-purple-500/30 font-bold">Ví trả sau</span>}
                    <button onClick={() => onEdit(debt)} className="text-xs text-slate-500 hover:text-white p-1 rounded"><EditIcon /></button>
                    <button onClick={() => setShowHistory(!showHistory)} className={`text-xs px-2 py-1 rounded transition ${showHistory ? 'bg-blue-500/30 text-blue-200' : 'text-slate-500 hover:text-blue-300'}`}><HistoryIcon className="mr-1"/> Lịch sử</button>
                </div>
                <p className={`text-sm ${theme.secondaryTextColor} flex items-center gap-2`}><TagIcon /> {debt.source}</p>
                <p className={`text-xs ${theme.secondaryTextColor} flex items-center gap-2 mt-1`}><CalendarIcon className="w-3 h-3"/> {formatDate(debt.createdAt)} <ArrowRightIcon className="w-3 h-3"/> {formatDate(debt.dueDate)}</p>
            </div>
            <div className="text-right">
                <p className={`font-bold text-xl ${theme.primaryTextColor}`}>{remaining.toLocaleString('vi-VN')}đ</p>
                {remaining > 0 && (
                    isFixed ? 
                    <p className="text-xs font-semibold text-amber-400 mt-1 flex justify-end gap-1"><RepeatIcon className="w-3 h-3" /> Đóng: {(debt.monthlyInstallment || 0).toLocaleString('vi-VN')}đ/tháng</p> :
                    <p className="text-xs font-semibold text-pink-400 mt-1 flex justify-end gap-1"><ChartLineIcon className="w-3 h-3" /> Gợi ý: ~{Math.round(weeklyPaymentNeed).toLocaleString('vi-VN')}đ/tuần</p>
                )}
                <div className={`text-sm font-bold flex items-center justify-end gap-1 mt-1 ${statusColor}`}><HourglassIcon className="text-xs"/> {statusText}</div>
            </div></div>
            {showHistory && debt.transactions && (<div className="mt-3 mb-3 bg-black/40 rounded p-2 text-xs max-h-32 overflow-y-auto">{debt.transactions.slice().reverse().map(t => (<div key={t.id} className="flex justify-between py-1 border-b border-white/5 last:border-0"><span className="text-slate-400">{formatDate(new Date(t.date))}</span><div className="text-right"><span className={t.type === 'payment' ? 'text-green-400' : 'text-red-400 font-bold'}>{t.type === 'payment' ? '+' : '-'}{t.amount.toLocaleString('vi-VN')}</span></div></div>))}</div>)}
            <div className="mt-4"><div className="w-full bg-slate-700 rounded-full h-2.5"><div className={`${theme.accentColor} h-2.5 rounded-full transition-all duration-500`} style={{ width: `${Math.min((debt.amountPaid / debt.totalAmount) * 100, 100)}%` }}></div></div></div>
            {suggestion && <div className={`mt-3 p-2 rounded text-xs flex items-center gap-2 ${suggestion.bgColor} ${suggestion.color}`}><i className="fa-solid fa-lightbulb"></i><span>{suggestion.text}</span></div>}
            <div className="mt-3 flex items-end gap-2"><div className="flex-1"><label className="text-[10px] text-slate-400 uppercase font-bold mb-1 block">Cập nhật số tiền</label><CurrencyInput value={inputValue} onValueChange={setInputValue} className="w-full px-3 py-1.5 bg-slate-800/50 border border-slate-600 rounded-md text-white" placeholder="Nhập số tiền..." /></div><button onClick={handleInitiateAdd} disabled={inputValue <= 0} className={`px-3 py-1.5 h-[38px] rounded-md text-slate-900 font-bold ${theme.accentColor} hover:opacity-80 transition disabled:opacity-50 flex items-center`}><PlusIcon /></button><button onClick={() => setShowWithdrawReason(true)} disabled={inputValue <= 0 || inputValue > debt.amountPaid} className="px-3 py-1.5 h-[38px] rounded-md text-white font-bold bg-slate-700 hover:bg-red-900/50 hover:text-red-400 transition disabled:opacity-50 flex items-center"><MinusIcon /></button></div>
            {isConfirmingPayment && <div className="mt-2 p-3 bg-emerald-900/20 border border-emerald-500/30 rounded relative"><p className="text-xs font-bold text-emerald-300 mb-2">Xác nhận ngày:</p><div className="flex items-center gap-2 mb-3"><CalendarIcon className="text-slate-400"/><input type="date" value={paymentDate} onChange={(e) => setPaymentDate(e.target.value)} className="bg-slate-900 border border-slate-700 text-white px-2 py-1 rounded text-sm outline-none flex-1"/></div><div className="flex justify-end gap-2"><button onClick={() => setIsConfirmingPayment(false)} className="px-2 py-1 text-xs rounded bg-slate-700 text-slate-300">Hủy</button><button onClick={confirmAddPayment} className="px-2 py-1 text-xs rounded bg-emerald-600 text-white font-bold">Xác nhận</button></div></div>}
            {showWithdrawReason && <div className="mt-2 p-3 bg-red-900/20 border border-red-500/30 rounded"><label className="block text-xs font-bold text-red-300 mb-1">Lý do:</label><input type="text" value={withdrawReason} onChange={(e) => setWithdrawReason(e.target.value)} className="w-full bg-slate-900 border border-slate-700 text-white px-2 py-1 rounded text-sm mb-2" autoFocus /><div className="flex justify-end gap-2"><button onClick={() => setShowWithdrawReason(false)} className="px-2 py-1 text-xs rounded bg-slate-700 text-slate-300">Hủy</button><button onClick={confirmWithdraw} className="px-2 py-1 text-xs rounded bg-red-600 text-white font-bold">Rút</button></div></div>}
        </div>
    );
};

interface BudgetRowProps { icon: React.ReactNode; label: string; budget: number; actual: number; onBudgetChange: (val: number) => void; onActualChange: (val: number) => void; theme: SeasonalTheme; colorClass: string; onDetailClick?: () => void; }
const BudgetRow: React.FC<BudgetRowProps> = ({ icon, label, budget, actual, onBudgetChange, onActualChange, theme, colorClass, onDetailClick }) => {
    const [addValue, setAddValue] = useState(0);
    const percentage = budget > 0 ? Math.min((actual / budget) * 100, 100) : 0;
    const isOverBudget = actual > budget && budget > 0;
    const handleTransaction = (isAdding: boolean) => { if (addValue > 0) { onActualChange(isAdding ? addValue : -addValue); setAddValue(0); } };
    return (
        <div className="p-3 bg-black/20 rounded-md relative group">
            <div className="flex items-center justify-between mb-2">
                <div className="flex items-center"><span className={`${colorClass} mr-3`}>{icon}</span><span className={`font-semibold ${theme.primaryTextColor}`}>{label}</span></div>
                <div className="flex items-center gap-2">{isOverBudget && <span className="text-xs text-red-400 font-bold animate-pulse">Vượt!</span>}{onDetailClick && (<button onClick={onDetailClick} className="text-xs bg-slate-700 hover:bg-slate-600 text-slate-300 px-2 py-1 rounded flex items-center gap-1"><ListIcon /> Xem</button>)}</div>
            </div>
            <div className="grid grid-cols-2 gap-4 mb-2">
                <div><label className={`block text-xs ${theme.secondaryTextColor} mb-1`}>Ngân sách</label><CurrencyInput value={budget} onValueChange={onBudgetChange} className="input w-full text-right py-1.5 text-sm" /></div>
                <div><label className={`block text-xs ${theme.secondaryTextColor} mb-1`}>Thực tế</label><div className={`input w-full text-right py-1.5 text-sm ${isOverBudget ? 'border-red-500/50 text-red-200' : 'bg-slate-800/50 cursor-not-allowed'}`}>{actual.toLocaleString('vi-VN')}<span className="text-xs text-slate-500 ml-1">.đ</span></div></div>
            </div>
            <div className="mt-2 flex items-center justify-end gap-2">
                <label className="text-[10px] text-slate-500">Nhập:</label>
                <div className="w-24"><CurrencyInput value={addValue} onValueChange={setAddValue} placeholder="0" className="bg-slate-900 border-slate-700 py-1 px-2 text-xs text-right rounded w-full" onKeyDown={(e) => { if (e.key === 'Enter') handleTransaction(true); }} /></div>
                <button onClick={() => handleTransaction(false)} disabled={addValue <= 0} className="bg-slate-800 border border-slate-600 hover:border-red-500 text-red-400 p-1.5 rounded transition disabled:opacity-30" title="Trừ"><MinusIcon className="w-3 h-3" /></button>
                <button onClick={() => handleTransaction(true)} disabled={addValue <= 0} className="bg-slate-700 hover:bg-emerald-600 text-white p-1.5 rounded transition disabled:opacity-30" title="Cộng"><PlusIcon className="w-3 h-3" /></button>
            </div>
            <div className="w-full bg-slate-700 rounded-full h-1.5 mt-2"><div className={`h-1.5 rounded-full transition-all duration-500 ${isOverBudget ? 'bg-red-500' : theme.accentColor}`} style={{ width: `${percentage}%` }}></div></div>
        </div>
    );
};

// --- [RESTORED] SIMULATION VIEW COMPONENT ---
interface SimulationViewProps {
    theme: SeasonalTheme;
    activeDebts: Debt[];
    onClose: () => void;
}

const SimulationView: React.FC<SimulationViewProps> = ({ theme, activeDebts, onClose }) => {
    const [targetDate, setTargetDate] = useState<string>(new Date(new Date().getTime() + 7 * 86400000).toISOString().slice(0, 10)); // Default to next week
    const [simIncomes, setSimIncomes] = useState<{ id: string; name: string; amount: number }[]>([]);
    const [simExpenses, setSimExpenses] = useState<{ id: string; name: string; amount: number }[]>([]);
    const [newItemName, setNewItemName] = useState('');
    const [newItemAmount, setNewItemAmount] = useState(0);
    const [newItemType, setNewItemType] = useState<'income' | 'expense'>('income');

    const handleAddItem = () => {
        if (newItemAmount <= 0) return;
        const item = { id: Date.now().toString(), name: newItemName || (newItemType === 'income' ? 'Thu nhập thêm' : 'Chi tiêu thêm'), amount: newItemAmount };
        if (newItemType === 'income') setSimIncomes([...simIncomes, item]);
        else setSimExpenses([...simExpenses, item]);
        setNewItemName('');
        setNewItemAmount(0);
    };

    const handleDeleteItem = (id: string, type: 'income' | 'expense') => {
        if (type === 'income') setSimIncomes(simIncomes.filter(i => i.id !== id));
        else setSimExpenses(simExpenses.filter(i => i.id !== id));
    };

    // Calculate Debt Obligations for the simulated period (assuming weekly contribution logic)
    const simulatedDebtPayment = useMemo(() => {
        const d = new Date(targetDate);
        const daysToTarget = Math.max(1, Math.ceil(daysBetween(new Date(), d)));
        const weeksToTarget = Math.ceil(daysToTarget / 7);
        
        return activeDebts.reduce((total, debt) => {
            const remaining = debt.totalAmount - debt.amountPaid;
            if (remaining <= 0) return total;
            
            // [UPDATED] Simulation logic handles both fixed and flexible
            const isFixed = debt.repaymentType === 'fixed';
            if (isFixed) {
                // Approximate months covered in simulation period
                const months = Math.max(1, Math.round(daysToTarget / 30));
                return total + (debt.monthlyInstallment || 0) * months;
            } else {
                const daysLeftInDebt = Math.max(1, Math.ceil((debt.dueDate.getTime() - new Date().getTime()) / (86400000)));
                const debtWeeklyNeed = remaining / Math.max(1, Math.ceil(daysLeftInDebt / 7));
                return total + (debtWeeklyNeed * weeksToTarget);
            }
        }, 0);
    }, [activeDebts, targetDate]);

    const totalSimIncome = simIncomes.reduce((s, i) => s + i.amount, 0);
    const totalSimExpense = simExpenses.reduce((s, i) => s + i.amount, 0);
    const simulatedBalance = totalSimIncome - totalSimExpense - simulatedDebtPayment;

    return (
        <div className="space-y-6 animate-fade-in-up">
            <div className={`${theme.cardBg} p-6 rounded-xl shadow-lg border border-purple-500/30`}>
                <div className="flex justify-between items-start mb-4">
                    <h3 className={`text-2xl font-bold ${theme.primaryTextColor} flex items-center gap-2`}>
                        <CloudArrowUpIcon className="text-purple-400" /> Giả lập Tài chính
                    </h3>
                    <button onClick={onClose} className="text-sm text-slate-400 hover:text-white bg-slate-800 px-3 py-1 rounded">Quay lại</button>
                </div>
                
                <div className="mb-6 p-4 bg-slate-800/50 rounded-lg border border-slate-700">
                    <label className="block text-sm text-slate-300 mb-2 font-bold">Dự tính cho thời điểm:</label>
                    <input type="date" value={targetDate} onChange={(e) => setTargetDate(e.target.value)} className="input w-full bg-slate-900 border-slate-600 text-white" />
                    <p className="text-xs text-slate-500 mt-2 italic">Hệ thống sẽ tự động tính toán áp lực trả nợ tính đến ngày này.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    {/* Simulated Inputs */}
                    <div>
                        <h4 className="font-bold text-emerald-400 mb-2 border-b border-emerald-500/30 pb-1">Nguồn thu dự kiến</h4>
                        <div className="space-y-2 mb-3 max-h-40 overflow-y-auto">
                            {simIncomes.map(i => (
                                <div key={i.id} className="flex justify-between text-sm bg-emerald-900/10 p-2 rounded">
                                    <span>{i.name}</span>
                                    <div className="flex gap-2">
                                        <span className="font-bold text-emerald-300">+{i.amount.toLocaleString()}đ</span>
                                        <button onClick={() => handleDeleteItem(i.id, 'income')} className="text-slate-500 hover:text-red-400"><TrashIcon className="w-3 h-3"/></button>
                                    </div>
                                </div>
                            ))}
                            {simIncomes.length === 0 && <p className="text-xs text-slate-600 italic">Chưa có thu nhập giả định.</p>}
                        </div>
                    </div>

                    {/* Simulated Expenses */}
                    <div>
                        <h4 className="font-bold text-red-400 mb-2 border-b border-red-500/30 pb-1">Chi tiêu dự kiến</h4>
                        <div className="space-y-2 mb-3 max-h-40 overflow-y-auto">
                            {simExpenses.map(i => (
                                <div key={i.id} className="flex justify-between text-sm bg-red-900/10 p-2 rounded">
                                    <span>{i.name}</span>
                                    <div className="flex gap-2">
                                        <span className="font-bold text-red-300">-{i.amount.toLocaleString()}đ</span>
                                        <button onClick={() => handleDeleteItem(i.id, 'expense')} className="text-slate-500 hover:text-red-400"><TrashIcon className="w-3 h-3"/></button>
                                    </div>
                                </div>
                            ))}
                            {simExpenses.length === 0 && <p className="text-xs text-slate-600 italic">Chưa có chi tiêu giả định.</p>}
                        </div>
                    </div>
                </div>

                {/* Add Item Form */}
                <div className="bg-slate-900/50 p-3 rounded-lg border border-slate-700 mb-6 flex flex-col gap-2">
                    <div className="flex gap-2">
                        <select value={newItemType} onChange={(e) => setNewItemType(e.target.value as any)} className="input w-24 text-xs">
                            <option value="income">Thu</option>
                            <option value="expense">Chi</option>
                        </select>
                        <input type="text" placeholder="Tên khoản (ví dụ: Lương tuần 21)" value={newItemName} onChange={(e) => setNewItemName(e.target.value)} className="input flex-1 text-sm" />
                    </div>
                    <div className="flex gap-2">
                        <CurrencyInput value={newItemAmount} onValueChange={setNewItemAmount} placeholder="Số tiền" className="input flex-1 text-sm" />
                        <button onClick={handleAddItem} disabled={newItemAmount <= 0} className="bg-purple-600 hover:bg-purple-500 text-white px-4 rounded font-bold text-sm">Thêm</button>
                    </div>
                </div>

                {/* Simulation Result */}
                <div className="bg-slate-900 p-4 rounded-xl border border-slate-700">
                    <h4 className="text-center text-slate-400 uppercase text-xs font-bold mb-4">Kết quả dự báo</h4>
                    <div className="space-y-3">
                        <div className="flex justify-between text-sm">
                            <span className="text-slate-300">Tổng thu giả định:</span>
                            <span className="text-emerald-400 font-bold">{totalSimIncome.toLocaleString()}đ</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-slate-300">Tổng chi giả định:</span>
                            <span className="text-red-400 font-bold">-{totalSimExpense.toLocaleString()}đ</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-slate-300 flex items-center gap-1"><CreditCardIcon className="w-3 h-3"/> Trả nợ bắt buộc (Ước tính):</span>
                            <span className="text-pink-400 font-bold">-{simulatedDebtPayment.toLocaleString()}đ</span>
                        </div>
                        <div className="h-px bg-slate-700 my-2"></div>
                        <div className="flex justify-between items-center">
                            <span className="font-bold text-white">Dư ra:</span>
                            <span className={`text-2xl font-bold ${simulatedBalance >= 0 ? 'text-green-400' : 'text-red-500'}`}>{simulatedBalance.toLocaleString()}đ</span>
                        </div>
                        {simulatedBalance < 0 && <p className="text-xs text-red-400 text-center mt-2 bg-red-900/20 p-2 rounded">Cảnh báo: Bạn sẽ bị thâm hụt tài chính nếu kế hoạch này diễn ra!</p>}
                    </div>
                </div>
            </div>
        </div>
    );
};

// --- [NEW] STRATEGIC VIEW COMPONENT ---
interface StrategicViewProps {
    theme: SeasonalTheme;
    debts: Debt[];
    savingsBalance: number;
    onClose: () => void;
    // [NEW] Prop to save plan
    onSavePlan: (config: any) => void;
    onDeletePlan: () => void; 
    initialConfig: any;
}

const StrategicView: React.FC<StrategicViewProps> = ({ theme, debts, savingsBalance, onClose, onSavePlan, onDeletePlan, initialConfig }) => {
    // [MODIFIED] Generic Config State with safe initialization
    const [config, setConfig] = useState(() => {
        const defaults = {
            planName: 'Kế hoạch Mới',
            startDate: new Date().toISOString().slice(0, 10),
            endDate: new Date(new Date().getTime() + 90 * 86400000).toISOString().slice(0, 10), // Default 3 months
            weeklyIncome: 0,
            weeklyFood: 315000,
            weeklyMisc: 100000,
            goals: [{ id: 'g1', name: 'Mục tiêu 1', amount: 0 }]
        };
        // Merge defaults with initialConfig to ensure 'goals' and other new fields exist
        return { ...defaults, ...initialConfig };
    });

    const [plan, setPlan] = useState<any[]>([]);
    const [selectedWeekDebt, setSelectedWeekDebt] = useState<{ weekStr: string, details: string[] } | null>(null);
    
    // Helpers for Goal Management
    const addGoal = () => {
        setConfig((prev: any) => ({
            ...prev,
            goals: [...(prev.goals || []), { id: Date.now().toString(), name: '', amount: 0 }]
        }));
    };

    const removeGoal = (id: string) => {
        setConfig((prev: any) => ({
            ...prev,
            goals: (prev.goals || []).filter((g: any) => g.id !== id)
        }));
    };
    
    const updateGoal = (id: string, field: string, value: any) => {
        setConfig((prev: any) => ({
            ...prev,
            goals: (prev.goals || []).map((g: any) => g.id === id ? { ...g, [field]: value } : g)
        }));
    };

    // Logic to generate the plan
    useEffect(() => {
        if (!config.weeklyIncome) return;

        const start = new Date(config.startDate);
        const end = new Date(config.endDate);
        const weeks = [];
        let current = new Date(start);
        let cumulativeSavings = savingsBalance;

        // Loop week by week
        while (current < end) {
            const weekStart = new Date(current);
            const weekEnd = new Date(current.getTime() + 6 * 86400000);
            
            // 1. Base Income
            let income = config.weeklyIncome;
            
            // 2. Fixed & Variable Expenses
            let expense = config.weeklyFood + config.weeklyMisc;

            // 3. Smart Debt Calculation
            let debtPayment = 0;
            const debtDetails: string[] = [];

            debts.forEach(d => {
                const remaining = d.totalAmount - d.amountPaid;
                if (remaining <= 0) return;

                // Skip BNPL in cashflow if user uses them for daily expense (already counted)
                // Logic refinement: If BNPL is used for daily expenses, paying it off is an outflow.
                // Just keep standard logic.

                if (d.repaymentType === 'fixed') {
                    // Check if "due day" falls in this week
                    const dueDay = d.dueDate.getDate(); 
                    
                    let hasDueDay = false;
                    for (let t = new Date(weekStart); t <= weekEnd; t.setDate(t.getDate() + 1)) {
                        if (t.getDate() === dueDay) hasDueDay = true;
                    }

                    if (hasDueDay) {
                        const amount = d.monthlyInstallment || 0;
                        debtPayment += amount;
                        debtDetails.push(`${d.name}: -${amount.toLocaleString()}đ (Đến hạn ngày ${dueDay})`);
                    }
                } else {
                    // Flexible: Suggested weekly payment
                    const daysToDue = daysBetween(weekStart, d.dueDate);
                    const weeksToDue = Math.ceil(daysToDue / 7);
                    const START_SAVING_WEEKS_BEFORE = 4; 

                    if (daysToDue > 0 && weeksToDue <= START_SAVING_WEEKS_BEFORE) {
                        const weeksLeft = Math.max(1, weeksToDue);
                        const weekly = Math.ceil(remaining / weeksLeft);
                        
                        debtPayment += weekly;
                        debtDetails.push(`${d.name}: -${weekly.toLocaleString()}đ (Sắp đến hạn: còn ${weeksLeft} tuần)`);
                    } else if (daysToDue > -7 && daysToDue <= 0) {
                         debtPayment += remaining;
                         debtDetails.push(`${d.name}: -${remaining.toLocaleString()}đ (Tất toán ngay!)`);
                    }
                }
            });

            const net = income - expense - debtPayment;
            cumulativeSavings += net;

            weeks.push({
                start: weekStart,
                end: weekEnd,
                income,
                expense,
                debtPayment,
                debtDetails,
                net,
                balance: cumulativeSavings
            });

            // Next week
            current.setDate(current.getDate() + 7);
        }
        setPlan(weeks);
    }, [config, debts, savingsBalance]);

    // [FIXED] Safe access to goals using optional chaining/default
    const totalGoal = (config.goals || []).reduce((sum: number, g: any) => sum + g.amount, 0);
    const finalBalance = plan.length > 0 ? plan[plan.length - 1].balance : savingsBalance;
    const progress = totalGoal > 0 ? Math.max(0, Math.min((finalBalance / totalGoal) * 100, 100)) : 0;

    return (
        <div className="space-y-6 animate-fade-in-up">
            <div className={`${theme.cardBg} p-6 rounded-xl shadow-lg border-l-4 border-indigo-500`}>
                <div className="flex justify-between items-start mb-6">
                    <div className="flex-1 mr-4">
                        <div className="flex items-center gap-2 mb-1">
                            <GoalIcon className="text-indigo-400 text-2xl" />
                            <input 
                                type="text" 
                                value={config.planName} 
                                onChange={(e) => setConfig({...config, planName: e.target.value})}
                                className="bg-transparent border-b border-slate-600 text-xl font-bold text-white focus:outline-none focus:border-indigo-500 w-full"
                                placeholder="Đặt tên kế hoạch..."
                            />
                        </div>
                        <p className={`text-sm ${theme.secondaryTextColor}`}>Lộ trình tài chính từ {formatDate(new Date(config.startDate))} đến {formatDate(new Date(config.endDate))}</p>
                    </div>
                    <div className="flex gap-2">
                         {initialConfig && (
                             <button onClick={onDeletePlan} className="bg-red-900/80 text-red-200 px-3 py-1.5 rounded hover:bg-red-800 text-sm font-bold flex items-center gap-1 border border-red-700/50"><TrashIcon className="w-3 h-3"/> Hủy</button>
                         )}
                         <button onClick={() => onSavePlan(config)} className="bg-emerald-600 text-white px-3 py-1.5 rounded hover:bg-emerald-500 text-sm font-bold flex items-center gap-1"><SaveIcon className="w-3 h-3"/> Lưu</button>
                        <button onClick={onClose} className="bg-slate-800 text-slate-300 px-3 py-1.5 rounded hover:bg-slate-700 text-sm">Đóng</button>
                    </div>
                </div>

                {/* Configuration Panel */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                    <div className="bg-slate-900/50 p-4 rounded-lg border border-slate-700">
                        <h4 className="text-indigo-400 font-bold mb-3 uppercase text-xs">1. Thiết lập Nguồn lực & Thời gian</h4>
                        <div className="space-y-3">
                             <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-xs text-slate-400 block mb-1">Ngày bắt đầu</label>
                                    <input type="date" value={config.startDate} onChange={(e) => setConfig({...config, startDate: e.target.value})} className="input w-full text-sm" />
                                </div>
                                <div>
                                    <label className="text-xs text-slate-400 block mb-1">Ngày kết thúc</label>
                                    <input type="date" value={config.endDate} onChange={(e) => setConfig({...config, endDate: e.target.value})} className="input w-full text-sm" />
                                </div>
                            </div>
                            <div>
                                <label className="text-xs text-slate-400 block mb-1">Thu nhập dự kiến (Lương/Tuần)</label>
                                <CurrencyInput value={config.weeklyIncome} onValueChange={v => setConfig({...config, weeklyIncome: v})} className="input w-full" placeholder="Nhập lương tuần..." />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-xs text-slate-400 block mb-1">Ăn uống (Tuần)</label>
                                    <CurrencyInput value={config.weeklyFood} onValueChange={v => setConfig({...config, weeklyFood: v})} className="input w-full" />
                                </div>
                                <div>
                                    <label className="text-xs text-slate-400 block mb-1">Sinh hoạt (Tuần)</label>
                                    <CurrencyInput value={config.weeklyMisc} onValueChange={v => setConfig({...config, weeklyMisc: v})} className="input w-full" />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-slate-900/50 p-4 rounded-lg border border-slate-700 flex flex-col">
                        <div className="flex justify-between items-center mb-3">
                            <h4 className="text-emerald-400 font-bold uppercase text-xs">2. Danh sách Mục tiêu</h4>
                            <button onClick={addGoal} className="text-xs bg-emerald-900 text-emerald-200 px-2 py-1 rounded hover:bg-emerald-800">+ Thêm</button>
                        </div>
                        <div className="space-y-2 flex-1 overflow-y-auto max-h-48 custom-scrollbar pr-1">
                            {(config.goals || []).map((g: any, idx: number) => (
                                <div key={g.id} className="flex gap-2 items-center">
                                    <input 
                                        type="text" 
                                        placeholder="Tên mục tiêu" 
                                        value={g.name} 
                                        onChange={(e) => updateGoal(g.id, 'name', e.target.value)}
                                        className="input flex-1 text-sm bg-slate-800 border-slate-600"
                                    />
                                    <CurrencyInput 
                                        value={g.amount} 
                                        onValueChange={(v) => updateGoal(g.id, 'amount', v)} 
                                        className="input w-32 text-sm bg-slate-800 border-slate-600 text-right"
                                        placeholder="Số tiền"
                                    />
                                    <button onClick={() => removeGoal(g.id)} className="text-slate-500 hover:text-red-400 px-1"><TrashIcon className="w-3 h-3"/></button>
                                </div>
                            ))}
                            {(config.goals || []).length === 0 && <p className="text-slate-500 text-xs italic text-center mt-4">Chưa có mục tiêu nào.</p>}
                        </div>
                        <div className="mt-3 pt-3 border-t border-slate-700 flex justify-between items-center">
                            <span className="text-xs font-bold text-slate-400">TỔNG MỤC TIÊU:</span>
                            <span className="text-sm font-bold text-white">{totalGoal.toLocaleString()}đ</span>
                        </div>
                    </div>
                </div>

                {/* Analysis Result */}
                {config.weeklyIncome > 0 && (
                    <div className="animate-fade-in-up">
                        <div className="bg-slate-800 p-4 rounded-t-xl border-b border-slate-700 flex justify-between items-center">
                            <div>
                                <p className="text-slate-400 text-xs mb-1">Dự kiến tích lũy đến {formatDate(new Date(config.endDate))}</p>
                                <div className="flex items-end gap-2">
                                    <p className={`text-2xl font-bold ${finalBalance >= 0 ? 'text-white' : 'text-red-400'}`}>{finalBalance.toLocaleString('vi-VN')}đ</p>
                                    {totalGoal > 0 && <span className="text-xs text-slate-500 mb-1.5">/ {totalGoal.toLocaleString()}đ</span>}
                                </div>
                            </div>
                            {totalGoal > 0 && (
                                <div className="text-right w-1/2">
                                    <p className="text-slate-400 text-xs mb-1 text-right">Tiến độ: {Math.round(progress)}%</p>
                                    <div className="w-full bg-slate-700 h-3 rounded-full relative overflow-hidden">
                                        <div 
                                            className={`h-3 rounded-full transition-all duration-1000 ${progress >= 100 ? 'bg-gradient-to-r from-emerald-500 to-green-400' : 'bg-gradient-to-r from-amber-500 to-yellow-400'}`} 
                                            style={{width: `${progress}%`}}
                                        ></div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Timeline */}
                        <div className="bg-black/20 rounded-b-xl overflow-hidden relative">
                            <div className="max-h-80 overflow-y-auto custom-scrollbar p-2 space-y-2">
                                {plan.map((week, idx) => (
                                    <div key={idx} className={`p-3 rounded border bg-slate-800/40 border-slate-700/50 flex justify-between items-center relative group`}>
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="text-xs font-bold text-slate-300">Tuần {formatDate(week.start).slice(0,5)} - {formatDate(week.end).slice(0,5)}</span>
                                            </div>
                                            <div className="text-xs text-slate-500 flex gap-3 items-center">
                                                <span className="text-emerald-400">+{week.income.toLocaleString()}</span>
                                                <span className="text-red-400">-{week.expense.toLocaleString()} (Chi)</span>
                                                {week.debtPayment > 0 && (
                                                    <span 
                                                        className="text-amber-400 cursor-pointer underline decoration-dotted hover:text-amber-300"
                                                        onClick={() => setSelectedWeekDebt({weekStr: `${formatDate(week.start)} - ${formatDate(week.end)}`, details: week.debtDetails})}
                                                    >
                                                        -{week.debtPayment.toLocaleString()} (Nợ) [Chi tiết]
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className={`font-bold text-sm ${week.net >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                                {week.net > 0 ? '+' : ''}{week.net.toLocaleString()}
                                            </p>
                                            <p className="text-[10px] text-slate-500">Dư: {week.balance.toLocaleString()}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            
                            {/* Debt Detail Popover */}
                            {selectedWeekDebt && (
                                <div className="absolute top-0 left-0 right-0 bottom-0 bg-black/90 flex flex-col justify-center items-center p-4 z-10">
                                    <div className="bg-slate-900 border border-slate-600 p-4 rounded-lg w-full max-w-xs shadow-2xl">
                                        <h5 className="font-bold text-white mb-2 text-sm border-b border-slate-700 pb-1">Chi tiết trả nợ tuần: {selectedWeekDebt.weekStr}</h5>
                                        <div className="space-y-1 mb-3">
                                            {selectedWeekDebt.details.map((d, i) => <p key={i} className="text-xs text-amber-400">{d}</p>)}
                                        </div>
                                        <button onClick={() => setSelectedWeekDebt(null)} className="w-full bg-slate-700 text-white text-xs py-1.5 rounded">Đóng</button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

// --- APP COMPONENT ---
const App: React.FC = () => {
    const [user, setUser] = useState<User | null>(null);
    const [loadingData, setLoadingData] = useState(true);
    const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'saved'>('idle');

    // --- Data States ---
    const [gasHistory, setGasHistory] = useState<GasLog[]>([]);
    const [lastWifiPayment, setLastWifiPayment] = useState<Date | null>(null);
    const [debts, setDebts] = useState<Debt[]>([]);
    const [incomeLogs, setIncomeLogs] = useState<IncomeLog[]>([]);
    const [foodLogs, setFoodLogs] = useState<FoodLog[]>([]);
    const [miscLogs, setMiscLogs] = useState<ExpenseLog[]>([]);
    const [savingsHistory, setSavingsHistory] = useState<SavingsTransaction[]>([]);
    const [foodBudget, setFoodBudget] = useState<number>(315000);
    const [miscBudget, setMiscBudget] = useState<number>(100000);
    const [holidays, setHolidays] = useState<Holiday[]>([]);
    
    // [NEW] Strategy State
    const [savedStrategy, setSavedStrategy] = useState<any>(null);

    // --- UI States ---
    const [uiMode, setUiMode] = useState<'desktop' | 'mobile'>(() => (localStorage.getItem(UI_MODE_KEY) as 'desktop' | 'mobile') || 'desktop');
    const [view, setView] = useState<'dashboard' | 'planning' | 'simulation' | 'strategy'>('dashboard');
    const [currentDate] = useState(new Date());
    const [filter, setFilter] = useState<FilterState>({ type: 'week', year: currentDate.getFullYear(), week: getWeekNumber(currentDate)[1] });
    
    const [incomeInput, setIncomeInput] = useState<number>(0);
    const [incomeDate, setIncomeDate] = useState<string>(new Date().toISOString().slice(0, 10));

    const [debtFilterMonth, setDebtFilterMonth] = useState(currentDate.getMonth());
    const [debtFilterYear, setDebtFilterYear] = useState(currentDate.getFullYear());
    const [isFilterModalOpen, setFilterModalOpen] = useState(false);
    const [isDebtModalOpen, setDebtModalOpen] = useState(false);
    const [editingDebtId, setEditingDebtId] = useState<string | null>(null);
    const [isDebtHistoryOpen, setDebtHistoryOpen] = useState(false);
    const [isMiscDetailOpen, setMiscDetailOpen] = useState(false);
    const [manualEntryModal, setManualEntryModal] = useState<{ isOpen: boolean, type: 'gas' | 'wifi' | null }>({ isOpen: false, type: null });
    const [manualDate, setManualDate] = useState<string>(new Date().toISOString().slice(0, 10));
    const [isIncomeEditOpen, setIncomeEditOpen] = useState(false);
    const [editingIncomeId, setEditingIncomeId] = useState<string | null>(null);
    const [editIncomeValue, setEditIncomeValue] = useState<number>(0);
    const [editIncomeDate, setEditIncomeDate] = useState<string>(''); 
    const [isSavingsHistoryOpen, setSavingsHistoryOpen] = useState(false);

    const [debtType, setDebtType] = useState<'standard' | 'shopee'>('standard');
    // [MODIFIED] Added startDate to state
    // [UPDATED] Added repaymentType and monthlyInstallment to state
    // [UPDATED] Added isBNPL to state
    const [newDebt, setNewDebt] = useState({ 
        name: '', 
        source: '', 
        totalAmount: 0, 
        dueDate: new Date().toISOString().slice(0, 10), 
        startDate: new Date().toISOString().slice(0, 10), 
        repaymentType: 'flexible' as 'fixed' | 'flexible',
        monthlyInstallment: 0,
        isBNPL: false, // Default is NOT BNPL
        targetMonth: currentDate.getMonth(), 
        targetYear: currentDate.getFullYear() 
    });
    const [shopeeBillMonth, setShopeeBillMonth] = useState(currentDate.getMonth());
    const [shopeeBillYear, setShopeeBillYear] = useState(currentDate.getFullYear());
    const [isRecurringDebt, setIsRecurringDebt] = useState(false);
    const [recurringFrequency, setRecurringFrequency] = useState<'weekly' | 'monthly'>('monthly');
    const [recurringEndDate, setRecurringEndDate] = useState('');
    const [newMiscLog, setNewMiscLog] = useState({ name: '', amount: 0, date: new Date().toISOString().slice(0, 10) });

    // --- FIX RACE CONDITION START ---
    const isPendingSave = useRef(false);
    const isRemoteUpdate = useRef(false);

    // --- AUTH & DATA SYNC (UPDATED) ---
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            setUser(currentUser);
            if (currentUser) {
                const docRef = doc(db, "users", currentUser.uid);
                const docSnap = await getDoc(docRef);
                
                if (!docSnap.exists()) {
                    const localData = loadLocalData();
                    if (localData) await setDoc(docRef, { ...localData, updatedAt: new Date().toISOString() });
                }

                // Kích hoạt metadataChanges để bắt được các thay đổi "local pending"
                const unsubDoc = onSnapshot(docRef, { includeMetadataChanges: true }, (doc) => {
                    // [QUAN TRỌNG 1] Nếu người dùng đang gõ/đang lưu, không nhận update để tránh nhảy chữ
                    if (isPendingSave.current) return;

                    // [QUAN TRỌNG 2] hasPendingWrites = true nghĩa là đây là dữ liệu LOCAL vừa gửi đi
                    // Chúng ta đã có dữ liệu này rồi (Optimistic UI), nên không cần update lại state.
                    if (doc.metadata.hasPendingWrites) return;

                    if (doc.exists()) {
                        // Đánh dấu đây là cập nhật từ Server
                        isRemoteUpdate.current = true;

                        const data = doc.data();
                        const parsed = parseDataDates(data);
                        setGasHistory(parsed.gasHistory || []);
                        setLastWifiPayment(parsed.lastWifiPayment || null);
                        setDebts(parsed.debts || []);
                        setIncomeLogs(parsed.incomeLogs || []);
                        setFoodLogs(parsed.foodLogs || []);
                        setMiscLogs(parsed.miscLogs || []);
                        setSavingsHistory(parsed.savingsHistory || []);
                        setFoodBudget(parsed.foodBudget || 315000);
                        setMiscBudget(parsed.miscBudget || 100000);
                        
                        // Load saved strategy if exists
                        if (data.savedStrategy) setSavedStrategy(data.savedStrategy);

                        const upcoming = getUpcomingHolidays();
                        if (parsed.holidays) {
                            const merged = upcoming.map(freshH => {
                                const savedH = parsed.holidays.find((s: any) => s.id === freshH.id);
                                return savedH ? { ...freshH, ...savedH } : freshH;
                            });
                            setHolidays(merged);
                        } else { setHolidays(upcoming); }
                    }
                    setLoadingData(false);
                });
                return () => unsubDoc();
            } else {
                const localData = loadLocalData();
                if (localData) {
                    setGasHistory(localData.gasHistory || []);
                    setLastWifiPayment(localData.lastWifiPayment || null);
                    setDebts(localData.debts || []);
                    setIncomeLogs(localData.incomeLogs || []);
                    setFoodLogs(localData.foodLogs || []);
                    setMiscLogs(localData.miscLogs || []);
                    setSavingsHistory(localData.savingsHistory || []);
                    setFoodBudget(localData.foodBudget || 315000);
                    setMiscBudget(localData.miscBudget || 100000);
                    setHolidays(getUpcomingHolidays());
                    
                    // Try load strategy from LocalStorage
                    const savedStrat = localStorage.getItem(STRATEGY_KEY);
                    if (savedStrat) setSavedStrategy(JSON.parse(savedStrat));
                }
                setLoadingData(false);
            }
        });
        return () => unsubscribe();
    }, []);

    // --- SAVE DATA EFFECT (UPDATED) ---
    const isFirstRun = useRef(true);
    useEffect(() => {
        if (isFirstRun.current) { isFirstRun.current = false; return; }
        if (loadingData) return;

        // [QUAN TRỌNG 3] Nếu đây là update do onSnapshot (từ server) kích hoạt, 
        // thì KHÔNG được lưu ngược lại server. Reset cờ và thoát.
        if (isRemoteUpdate.current) {
            isRemoteUpdate.current = false;
            return;
        }

        const dataToSave = { gasHistory, lastWifiPayment, debts, incomeLogs, foodLogs, miscLogs, savingsHistory, foodBudget, miscBudget, holidays, savedStrategy };
        
        // Lưu LocalStorage
        localStorage.setItem(STORAGE_KEY, JSON.stringify(dataToSave));
        if (savedStrategy) localStorage.setItem(STRATEGY_KEY, JSON.stringify(savedStrategy));

        if (user) {
            setSyncStatus('syncing');
            
            // Đánh dấu là đang có thay đổi LOCAL
            isPendingSave.current = true;

            const timeoutId = setTimeout(async () => {
                try {
                    const docRef = doc(db, "users", user.uid);
                    await setDoc(docRef, { ...sanitizeForFirestore(dataToSave), updatedAt: new Date().toISOString() }, { merge: true });
                    
                    setSyncStatus('saved');
                    
                    // Delay ngắn để đảm bảo không xung đột với snapshot ack
                    setTimeout(() => {
                        isPendingSave.current = false;
                    }, 500);

                    setTimeout(() => setSyncStatus('idle'), 2000);
                } catch (e) { 
                    setSyncStatus('idle'); 
                    console.error("Lỗi lưu:", e);
                    isPendingSave.current = false; // Reset nếu lỗi
                }
            }, 2000); // Debounce 2 giây
            
            return () => clearTimeout(timeoutId);
        }
    }, [gasHistory, lastWifiPayment, debts, incomeLogs, foodLogs, miscLogs, savingsHistory, foodBudget, miscBudget, holidays, user, loadingData, savedStrategy]);
    // --- FIX RACE CONDITION END ---

    useEffect(() => { localStorage.setItem(UI_MODE_KEY, uiMode); }, [uiMode]);

    const handleLogin = async () => { try { await signInWithPopup(auth, googleProvider); } catch (error: any) { alert("Lỗi đăng nhập: " + error.message); } };
    const handleLogout = async () => { if(confirm("Bạn muốn đăng xuất?")) { await signOut(auth); window.location.reload(); } };

    const handleSaveStrategy = (config: any) => {
        setSavedStrategy(config);
        alert("Đã lưu kế hoạch chiến lược! Bạn có thể theo dõi tiến độ ở màn hình chính.");
    };

    // [NEW] Delete Strategy Handler
    const handleDeleteStrategy = () => {
        if (confirm("Bạn có chắc muốn hủy kế hoạch chiến lược hiện tại? Dữ liệu theo dõi sẽ bị xóa.")) {
            setSavedStrategy(null);
            localStorage.removeItem(STRATEGY_KEY);
        }
    };

    const handleDeleteSavingsTransaction = (id: string) => {
        if (confirm("Bạn có chắc muốn xóa giao dịch này? (Hành động này sẽ hoàn tác số dư quỹ)")) {
            setSavingsHistory(prev => prev.filter(t => t.id !== id));
        }
    };

    const seasonalTheme = useMemo<SeasonalTheme>(() => {
        const month = currentDate.getMonth();
        const greetingName = user ? user.displayName?.split(' ').pop() : 'bạn';
        const base = { greeting: `Chào ${greetingName}!`, background: "bg-gradient-to-br from-gray-900 via-blue-950 to-indigo-900", primaryTextColor: "text-slate-100", secondaryTextColor: "text-slate-400", cardBg: "bg-black/20 backdrop-blur-lg border border-white/10", accentColor: "bg-amber-400", icon: <TaurusIcon className="text-amber-300"/> };
        if (month === 11 || month === 0) return { ...base, greeting: `Giáng sinh an lành, ${greetingName}!`, decorations: <SnowflakeIcon className="text-white/10 absolute top-10 right-10 text-6xl animate-pulse" /> };
        return base;
    }, [currentDate, user]);

    const GAS_COST = 70000; const WIFI_COST = 30000; const FIXED_EXPENSES = GAS_COST + WIFI_COST;
    const getFilteredTotal = (logs: { date: Date; amount: number }[]) => logs.filter(log => isDateInFilter(new Date(log.date), filter)).reduce((sum, log) => sum + log.amount, 0);
    const filteredIncome = getFilteredTotal(incomeLogs);
    const filteredFoodSpending = getFilteredTotal(foodLogs);
    const filteredMiscSpending = getFilteredTotal(miscLogs);
    const { activeDebts, completedDebts } = useMemo(() => debts.reduce((acc, d) => { d.amountPaid >= d.totalAmount ? acc.completedDebts.push(d) : acc.activeDebts.push(d); return acc; }, { activeDebts: [] as Debt[], completedDebts: [] as Debt[] }), [debts]);
    const displayDebts = useMemo(() => activeDebts.filter(d => { const fm = d.targetMonth ?? d.dueDate.getMonth(); const fy = d.targetYear ?? d.dueDate.getFullYear(); return fm === debtFilterMonth && fy === debtFilterYear; }).sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime()), [activeDebts, debtFilterMonth, debtFilterYear]);
    
    // [MODIFIED] FILTERED ACTUAL DEBT PAID LOGIC
    // We now exclude payments made to debts marked as "isBNPL"
    const filteredActualDebtPaid = useMemo(() => { 
        let total = 0; 
        debts.forEach(d => {
            // [NEW] If this is a BNPL debt, we SKIP adding its payments to total spending
            // because the original expense (food/misc) was already recorded.
            if (d.isBNPL) return;

            d.transactions?.forEach(t => { 
                if (t.type === 'payment' && isDateInFilter(new Date(t.date), filter)) {
                    total += t.amount; 
                }
            });
        }); 
        return total; 
    }, [debts, filter]);

    const currentSavingsBalance = useMemo(() => savingsHistory.reduce((acc, trans) => trans.type === 'deposit' ? acc + trans.amount : acc - trans.amount, 0), [savingsHistory]);
    const filteredSavingsDeposited = useMemo(() => savingsHistory.filter(t => t.type === 'deposit' && isDateInFilter(new Date(t.date), filter)).reduce((sum, t) => sum + t.amount, 0), [savingsHistory, filter]);
    const weeklyDebtContribution = activeDebts.reduce((t, d) => { const rem = d.totalAmount - d.amountPaid; if (rem <= 0) return t; const w = Math.ceil(daysBetween(new Date(), d.dueDate) / 7); return w <= 0 ? t + rem : t + (rem / w); }, 0);
    const totalActualSpending = FIXED_EXPENSES + filteredFoodSpending + filteredMiscSpending + filteredActualDebtPaid;
    const totalPlannedSpending = FIXED_EXPENSES + foodBudget + miscBudget + weeklyDebtContribution;
    const financialStatus = filteredIncome - totalActualSpending - filteredSavingsDeposited;
    const disposableIncomeForDebts = filteredIncome - (FIXED_EXPENSES + filteredFoodSpending + filteredMiscSpending);
    const currentMonthIncome = useMemo(() => incomeLogs.filter(l => !l.isSavingsWithdrawal && new Date(l.date).getMonth() === new Date().getMonth() && new Date(l.date).getFullYear() === new Date().getFullYear()).reduce((sum, l) => sum + l.amount, 0), [incomeLogs]);
    const monthlyIncomeRef = currentMonthIncome > 0 ? currentMonthIncome : (totalPlannedSpending * 4);
    const lastGasFill = gasHistory.length > 0 ? gasHistory[gasHistory.length - 1] : null;
    const isGasFilledToday = lastGasFill ? new Date().toDateString() === lastGasFill.date.toDateString() : false;
    const isWifiPaidRecently = lastWifiPayment ? daysBetween(lastWifiPayment, new Date()) < 7 : false;

    // Handlers
    const handleToggleGas = () => isGasFilledToday ? setGasHistory(prev => prev.slice(0, -1)) : setGasHistory(prev => [...prev, { id: Date.now().toString(), date: new Date() }]);
    const handleToggleWifi = () => isWifiPaidRecently ? setLastWifiPayment(null) : setLastWifiPayment(new Date());
    const handleUpdateIncome = () => { 
        const date = getDateFromFilter(filter);
        setIncomeLogs(p => [...p, { id: Date.now().toString(), amount: incomeInput, date: date }]); 
        setIncomeInput(0); 
    };
    const handleSavingsDeposit = () => { 
        if (financialStatus <= 0) return; 
        // [FIX] Use date from filter instead of new Date() to match current view
        const date = getDateFromFilter(filter);
        const newTransaction: SavingsTransaction = { 
            id: Date.now().toString(), 
            date: date, 
            amount: financialStatus, 
            type: 'deposit', 
            note: 'Cất tiền dư' 
        }; 
        setSavingsHistory(prev => [...prev, newTransaction]); 
    };

    const handleSavingsWithdraw = (amount: number) => { 
        if (amount > 0 && amount <= currentSavingsBalance) { 
            // [FIX] Use date from filter
            const date = getDateFromFilter(filter);
            setSavingsHistory(prev => [...prev, { id: Date.now().toString(), date: date, amount, type: 'withdrawal', note: 'Rút tiêu dùng' }]); 
            setIncomeLogs(p => [...p, { id: Date.now().toString(), amount, date: date, isSavingsWithdrawal: true }]); 
        } 
    };
    const handleFoodChange = (amount: number) => { 
        const date = getDateFromFilter(filter);
        if (amount !== 0) setFoodLogs(p => [...p, { id: Date.now().toString(), amount, date: date }]); 
    };
    const handleMiscChange = (amount: number) => { 
        const date = getDateFromFilter(filter);
        if (amount !== 0) setMiscLogs(p => [...p, { id: Date.now().toString(), name: amount > 0 ? 'Chi nhanh' : 'Giảm bớt', amount, date: date }]); 
    };
    const handleAddPayment = (id: string, amount: number, date: Date) => setDebts(p => p.map(d => d.id === id ? { ...d, amountPaid: d.amountPaid + amount, transactions: [...(d.transactions||[]), { id: Date.now().toString(), date, amount, type: 'payment' }] } : d));
    const handleWithdrawPayment = (id: string, amount: number, reason: string) => setDebts(p => p.map(d => d.id === id ? { ...d, amountPaid: Math.max(0, d.amountPaid - amount), transactions: [...(d.transactions||[]), { id: Date.now().toString(), date: new Date(), amount, type: 'withdrawal', reason }] } : d));
    const handleDeleteMiscLog = (id: string, amount: number) => setMiscLogs(p => p.filter(l => l.id !== id));
    const handleAddMiscLog = (e: React.FormEvent) => { e.preventDefault(); const log: ExpenseLog = { id: Date.now().toString(), name: newMiscLog.name, amount: newMiscLog.amount, date: new Date(newMiscLog.date) }; setMiscLogs(prev => [...prev, log]); setNewMiscLog({ name: '', amount: 0, date: new Date().toISOString().slice(0, 10) }); };
    const handleSaveHoliday = (id: string, data: Partial<Holiday>) => setHolidays(p => p.map(h => h.id === id ? { ...h, ...data } : h));
    const handleOpenManualEntry = (type: 'gas' | 'wifi') => { setManualEntryModal({ isOpen: true, type }); setManualDate(new Date().toISOString().slice(0, 10)); };
    const handleSaveManualEntry = () => { const d = new Date(manualDate); if (manualEntryModal.type === 'gas') setGasHistory(p => [...p, {id: Date.now().toString(), date: d}].sort((a,b)=>a.date.getTime()-b.date.getTime())); else setLastWifiPayment(d); setManualEntryModal({isOpen:false, type:null}); };
    const handleEditIncomeStart = (id: string, val: number, date: Date) => { setEditingIncomeId(id); setEditIncomeValue(val); setEditIncomeDate(new Date(date).toISOString().slice(0, 10)); setIncomeEditOpen(true); };
    const handleEditIncomeSave = () => { if(editingIncomeId) setIncomeLogs(p => p.map(l => l.id === editingIncomeId ? {...l, amount: editIncomeValue, date: new Date(editIncomeDate)} : l)); setIncomeEditOpen(false); setEditingIncomeId(null); };
    
    // Update manual input dates when filter changes
    useEffect(() => {
        const date = getDateFromFilter(filter);
        const dateStr = date.toISOString().slice(0, 10);
        setIncomeDate(dateStr);
        // Also update misc log date if it hasn't been manually set? 
        // Actually the modal handles its own state, but let's update default
        setNewMiscLog(prev => ({ ...prev, date: dateStr }));
    }, [filter]);

    // [UPDATED] Handle Save Debt with Shopee Year
    const handleSaveDebt = (e: React.FormEvent) => {
        e.preventDefault();
        if (editingDebtId) {
            setDebts(p => p.map(d => d.id === editingDebtId ? { 
                ...d, 
                name: newDebt.name, 
                source: newDebt.source, 
                totalAmount: newDebt.totalAmount, 
                dueDate: new Date(newDebt.dueDate), 
                createdAt: new Date(newDebt.startDate), // Update start date (createdAt)
                repaymentType: newDebt.repaymentType,
                monthlyInstallment: newDebt.monthlyInstallment,
                isBNPL: newDebt.isBNPL, // [NEW] Save BNPL status
                targetMonth: newDebt.targetMonth, 
                targetYear: newDebt.targetYear 
            } : d));
        } else {
            const list: Debt[] = [];
            if (debtType === 'shopee') {
                let m = shopeeBillMonth + 1;
                let y = shopeeBillYear;
                if (m > 11) { m = 0; y++; }
                // Tạo ngày hạn trả: mùng 10 tháng sau
                const dueDate = new Date(y, m, 10);
                
                list.push({
                    id: Date.now().toString(),
                    // [UPDATED] Tên khoản nợ hiển thị Năm
                    name: `SPayLater T${shopeeBillMonth + 1}/${shopeeBillYear}`,
                    source: 'Shopee',
                    totalAmount: newDebt.totalAmount,
                    amountPaid: 0,
                    dueDate: dueDate,
                    createdAt: new Date(),
                    repaymentType: 'fixed', // Shopee is typically fixed due date, treated as fixed here for simplicity or flexible? Actually Shopee has fixed monthly bill
                    monthlyInstallment: newDebt.totalAmount, // Shopee bill is 1-time payment for that month
                    targetMonth: shopeeBillMonth,
                    targetYear: shopeeBillYear,
                    isBNPL: true, // [NEW] Shopee is definitely BNPL
                    transactions: []
                });
            } else if (isRecurringDebt) {
                let cur = new Date(newDebt.dueDate), end = new Date(recurringEndDate), count = 1;
                while (cur <= end) {
                    list.push({ id: `${Date.now()}-${count}`, name: `${newDebt.name} ${recurringFrequency==='monthly' ? `(T${cur.getMonth()+1})` : `(Kỳ ${count})`}`, source: newDebt.source, totalAmount: newDebt.totalAmount, amountPaid: 0, dueDate: new Date(cur), createdAt: new Date(), targetMonth: cur.getMonth(), targetYear: cur.getFullYear(), isBNPL: newDebt.isBNPL, transactions: [] });
                    recurringFrequency === 'weekly' ? cur.setDate(cur.getDate()+7) : cur.setMonth(cur.getMonth()+1); count++;
                }
            } else {
                list.push({ 
                    id: Date.now().toString(), 
                    name: newDebt.name, 
                    source: newDebt.source, 
                    totalAmount: newDebt.totalAmount, 
                    amountPaid: 0, 
                    dueDate: new Date(newDebt.dueDate), 
                    createdAt: new Date(newDebt.startDate), // Use custom start date
                    repaymentType: newDebt.repaymentType,
                    monthlyInstallment: newDebt.monthlyInstallment,
                    isBNPL: newDebt.isBNPL, // [NEW] Save BNPL status
                    targetMonth: newDebt.targetMonth, 
                    targetYear: newDebt.targetYear, 
                    transactions: [] 
                });
            }
            setDebts(p => [...p, ...list]);
        }
        setNewDebt({ name: '', source: '', totalAmount: 0, dueDate: new Date().toISOString().slice(0, 10), startDate: new Date().toISOString().slice(0, 10), repaymentType: 'flexible', monthlyInstallment: 0, isBNPL: false, targetMonth: currentDate.getMonth(), targetYear: currentDate.getFullYear() });
        setDebtModalOpen(false); setIsRecurringDebt(false); setEditingDebtId(null); setDebtType('standard');
    };
    const handleEditDebt = (d: Debt) => { 
        setNewDebt({ 
            name: d.name.replace(/\(.*\)/,'').trim(), 
            source: d.source, 
            totalAmount: d.totalAmount, 
            dueDate: d.dueDate.toISOString().slice(0, 10), 
            startDate: d.createdAt ? d.createdAt.toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10), // Load existing start date
            repaymentType: (d as any).repaymentType || 'flexible',
            monthlyInstallment: (d as any).monthlyInstallment || 0,
            isBNPL: d.isBNPL || false, // [NEW] Load BNPL status
            targetMonth: d.targetMonth!, 
            targetYear: d.targetYear! 
        }); 
        setEditingDebtId(d.id); 
        setDebtType('standard'); 
        setDebtModalOpen(true); 
    };
    const handleDeleteDebt = (id: string) => { if(confirm("Xóa?")) setDebts(p => p.filter(d => d.id !== id)); setDebtModalOpen(false); };
    
    // NEW: Dashboard Filter Navigation Handlers
    const handlePrevFilter = () => {
        setFilter(prev => {
            let { type, year, week, month } = prev;
            if (type === 'week') {
                if (week === 1) { year--; week = 52; } else { week!--; }
                return { ...prev, year, week };
            } else if (type === 'month') {
                if (month === 0) { year--; month = 11; } else { month!--; }
                return { ...prev, year, month };
            } else {
                return { ...prev, year: year - 1 };
            }
        });
    };

    const handleNextFilter = () => {
        setFilter(prev => {
            let { type, year, week, month } = prev;
            if (type === 'week') {
                if (week === 52) { year++; week = 1; } else { week!++; }
                return { ...prev, year, week };
            } else if (type === 'month') {
                if (month === 11) { year++; month = 0; } else { month!++; }
                return { ...prev, year, month };
            } else {
                return { ...prev, year: year + 1 };
            }
        });
    };

    const getFilterDisplay = () => {
        if (filter.type === 'week') return `Tuần ${filter.week} - Năm ${filter.year}`;
        if (filter.type === 'month') return `${MONTH_NAMES[filter.month!]} ${filter.year}`;
        return `Năm ${filter.year}`;
    };

    // [NEW] Strategy Comparison Widget (Dashboard)
    const getStrategyComparison = () => {
        if (!savedStrategy) return null;

        // Find relevant week in strategy plan
        // Strategy config has StartDate. Calculate offset.
        const planStart = new Date(savedStrategy.startDate);
        // If current view filter is WEEK, we try to match it.
        // For simplicity, let's match the CURRENT REAL WORLD DATE to the plan
        const now = new Date();
        const daysSinceStart = daysBetween(planStart, now);
        
        // We want to find the week index in the plan
        const weekIndex = Math.floor(daysSinceStart / 7);

        // If we are outside the plan window (before start or way after)
        if (weekIndex < 0) return { status: 'not_started', message: "Kế hoạch chưa bắt đầu" };
        // We assume the plan goes for ~12 weeks based on typical setup
        if (weekIndex > 20) return { status: 'ended', message: "Kế hoạch đã kết thúc" };

        // We need to RE-CALCULATE the plan array based on saved config to get the numbers for that week
        // Doing full recalc is heavy, but necessary since we only saved config.
        // OR we could have saved the 'plan' array. But let's calc on fly for accuracy if logic changes.
        // Simplified calc for just this week's EXPECTED balance:
        // Actually, it's easier to check TOTAL saved vs EXPECTED saved by this week.
        
        // Let's estimate "Expected Savings" = (WeeklyIncome - WeeklyExpense - AvgDebt) * WeekIndex
        // This is rough.
        
        // Better: Recalculate properly
        const planEnd = new Date(savedStrategy.internshipDate);
        let simCurrent = new Date(planStart);
        let expectedBalance = currentSavingsBalance; // Starting point? No, starting point was when plan made. 
        // ISSUE: We don't know the savings balance WHEN the plan was made. 
        // WORKAROUND: We track "Weekly Surplus" target.
        
        const weeklyTarget = savedStrategy.weeklyIncome - savedStrategy.weeklyFood - savedStrategy.weeklyMisc;
        // Subtract avg debt... this is hard without full calc.
        
        return { status: 'active', weekIndex: weekIndex + 1, message: `Đang trong tuần ${weekIndex + 1} của kế hoạch`, target: weeklyTarget };
    };

    const strategyStatus = useMemo(getStrategyComparison, [savedStrategy, currentSavingsBalance]);

    const renderDashboard = () => (
        <>
             {/* [NEW] Strategy Tracking Widget */}
             {savedStrategy && strategyStatus && strategyStatus.status === 'active' && (
                <div className="mb-6 animate-fade-in-up bg-indigo-900/40 border border-indigo-500/50 p-4 rounded-lg flex justify-between items-center">
                    <div>
                        <p className="text-xs text-indigo-300 font-bold uppercase mb-1">Theo dõi Chiến lược</p>
                        <p className="text-white font-bold">{strategyStatus.message}</p>
                        <p className="text-xs text-slate-400">Mục tiêu dư hàng tuần: <span className="text-emerald-400">+{strategyStatus.target.toLocaleString()}đ</span> (chưa trừ nợ)</p>
                    </div>
                    <button onClick={() => setView('strategy')} className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs px-3 py-2 rounded font-bold">Xem chi tiết</button>
                </div>
             )}

             <div className="mb-4 animate-fade-in-up flex items-center justify-between bg-black/20 p-2 rounded-full border border-white/10">
                <button onClick={handlePrevFilter} className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-white"><ArrowRightIcon className="w-4 h-4 rotate-180" /></button>
                <div className="flex items-center gap-2">
                    <select value={filter.type} onChange={(e) => setFilter({...filter, type: e.target.value as any})} className="bg-transparent text-sm font-bold text-slate-300 outline-none">
                        <option value="week" className="bg-slate-900">Theo Tuần</option>
                        <option value="month" className="bg-slate-900">Theo Tháng</option>
                        <option value="year" className="bg-slate-900">Theo Năm</option>
                    </select>
                    <span className="text-white font-bold text-sm">| {getFilterDisplay()}</span>
                </div>
                <button onClick={handleNextFilter} className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-white"><ArrowRightIcon className="w-4 h-4" /></button>
             </div>

             <div className="mb-6 animate-fade-in-up">
                <VirtualCard balance={financialStatus} totalSpent={totalActualSpending} theme={seasonalTheme} />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
                <StatCard icon={<TargetIcon />} title="Thu nhập cần đạt" value={`${Math.round(totalPlannedSpending).toLocaleString('vi-VN')}đ`} color="text-amber-400" theme={seasonalTheme} subtitle="Theo ngân sách" />
                <StatCard icon={<CreditCardIcon />} title="Góp nợ tuần" value={`${Math.round(weeklyDebtContribution).toLocaleString('vi-VN')}đ`} color="text-pink-400" theme={seasonalTheme} subtitle="Dự kiến" />
                <StatCard icon={<MoneyBillIcon />} title="Thu nhập thực tế" value={`${filteredIncome.toLocaleString('vi-VN')}đ`} color="text-emerald-400" theme={seasonalTheme} />
                <StatCard icon={<ChartLineIcon />} title="Tình trạng" value={`${financialStatus.toLocaleString('vi-VN')}đ`} color={financialStatus >= 0 ? "text-green-400" : "text-red-400"} subtitle={financialStatus >= 0 ? "Dư giả" : "Thiếu hụt"} theme={seasonalTheme} />
            </div>

            <div className={`${seasonalTheme.cardBg} p-5 rounded-lg shadow-lg mb-6 border border-emerald-500/20`}>
                <div className="flex justify-between items-center mb-2">
                    <div className="flex items-center gap-3">
                        <div className="bg-emerald-500/20 p-3 rounded-full"><WalletIcon className="text-emerald-400 text-2xl" /></div>
                        <div><h3 className={`text-lg font-bold ${seasonalTheme.primaryTextColor}`}>Quỹ dự phòng</h3><p className={`text-2xl font-mono font-bold text-emerald-300`}>{currentSavingsBalance.toLocaleString('vi-VN')}đ</p></div>
                    </div>
                    <button onClick={() => setSavingsHistoryOpen(true)} className="text-xs text-slate-400 hover:text-white flex items-center gap-1 bg-slate-800/50 px-2 py-1 rounded"><HistoryIcon /> Lịch sử</button>
                </div>
                <div className="flex gap-2 mt-2">
                    <button onClick={handleSavingsDeposit} disabled={financialStatus <= 0} className={`flex-1 px-3 py-2 text-sm font-bold rounded-lg shadow transition flex items-center justify-center gap-1 ${financialStatus > 0 ? 'bg-emerald-600 hover:bg-emerald-500 text-white cursor-pointer' : 'bg-slate-700 text-slate-500 cursor-not-allowed'}`}><ArrowRightIcon /> {financialStatus > 0 ? `Cất ${financialStatus.toLocaleString('vi-VN')}đ` : 'Không có tiền dư'}</button>
                    <button onClick={() => { const max = currentSavingsBalance; const a = prompt(`Nhập số tiền muốn rút (Tối đa ${max.toLocaleString()}đ):`); if(a) handleSavingsWithdraw(parseInt(a.replace(/[^0-9]/g, ''))); }} disabled={currentSavingsBalance <= 0} className="px-3 py-2 bg-slate-700 hover:bg-slate-600 text-slate-300 text-sm font-bold rounded-lg shadow transition disabled:opacity-50 flex items-center"><ExchangeIcon className="mr-1" /> Rút</button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-1 space-y-6">
                    <div className={`${seasonalTheme.cardBg} p-5 rounded-lg shadow-lg`}>
                        <h3 className={`text-xl font-bold mb-4 ${seasonalTheme.primaryTextColor}`}>Chi tiêu & Ngân sách</h3>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between p-3 bg-black/20 rounded-md"><div className="flex items-center"><GasPumpIcon className="text-red-400 mr-3" /><div><p className={`font-semibold ${seasonalTheme.primaryTextColor}`}>Xăng</p><p className={`text-xs ${seasonalTheme.secondaryTextColor}`}>{lastGasFill ? formatDate(lastGasFill.date) : 'N/A'}</p></div></div><div className="text-right flex items-center gap-2"><p className={`font-bold ${seasonalTheme.primaryTextColor}`}>{GAS_COST.toLocaleString('vi-VN')}đ</p><button onClick={() => handleOpenManualEntry('gas')} className="text-slate-500 p-1"><CalendarPlusIcon /></button><button onClick={handleToggleGas} className={`text-2xl ${isGasFilledToday ? 'text-green-400' : 'text-gray-600'}`}>{isGasFilledToday ? <CheckCircleIcon /> : <CircleIcon />}</button></div></div>
                            <div className="flex items-center justify-between p-3 bg-black/20 rounded-md"><div className="flex items-center"><WifiIcon className="text-blue-400 mr-3" /><div><p className={`font-semibold ${seasonalTheme.primaryTextColor}`}>Wifi</p><p className={`text-xs ${seasonalTheme.secondaryTextColor}`}>{lastWifiPayment ? formatDate(new Date(lastWifiPayment.getTime() + 7 * 86400000)) : 'N/A'}</p></div></div><div className="text-right flex items-center gap-2"><p className={`font-bold ${seasonalTheme.primaryTextColor}`}>{WIFI_COST.toLocaleString('vi-VN')}đ</p><button onClick={() => handleOpenManualEntry('wifi')} className="text-slate-500 p-1"><CalendarPlusIcon /></button><button onClick={handleToggleWifi} className={`text-2xl ${isWifiPaidRecently ? 'text-green-400' : 'text-gray-600'}`}>{isWifiPaidRecently ? <CheckCircleIcon /> : <CircleIcon />}</button></div></div>
                            <BudgetRow icon={<FoodIcon />} label="Ăn uống" budget={foodBudget} actual={filteredFoodSpending} onBudgetChange={setFoodBudget} onActualChange={handleFoodChange} theme={seasonalTheme} colorClass="text-orange-400" />
                            <BudgetRow icon={<BoltIcon />} label="Phát sinh" budget={miscBudget} actual={filteredMiscSpending} onBudgetChange={setMiscBudget} onActualChange={handleMiscChange} theme={seasonalTheme} colorClass="text-purple-400" onDetailClick={() => setMiscDetailOpen(true)} />
                        </div>
                    </div>
                    
                    <div className={`${seasonalTheme.cardBg} p-5 rounded-lg shadow-lg`}>
                         <h3 className={`text-xl font-bold mb-4 ${seasonalTheme.primaryTextColor}`}>Cập nhật thu nhập</h3>
                         <div className="flex items-center gap-2">
                            <div className="flex-1"><CurrencyInput value={incomeInput} onValueChange={setIncomeInput} className="w-full input" placeholder="Số tiền" /></div>
                            <div className="w-36"><input type="date" value={incomeDate} onChange={(e) => setIncomeDate(e.target.value)} className="w-full input px-2 text-sm h-[42px] bg-slate-900 border border-slate-600 rounded-md text-white focus:outline-none focus:border-emerald-500" title="Chọn ngày nhận tiền" /></div>
                            <button onClick={handleUpdateIncome} className={`px-4 py-2.5 rounded-md font-semibold ${seasonalTheme.accentColor} text-slate-900 flex items-center gap-2`}><SaveIcon /> Lưu</button>
                         </div>
                         <div className="mt-4 max-h-40 overflow-y-auto pr-1 space-y-2">{incomeLogs.filter(l => isDateInFilter(new Date(l.date), filter)).slice().reverse().map(log => (<div key={log.id} className="flex justify-between items-center p-2 bg-slate-800/50 rounded border border-slate-700 text-sm"><span className="text-slate-400">{formatDateTime(new Date(log.date))}</span><div className="flex items-center gap-2"><span className={log.isSavingsWithdrawal ? 'text-emerald-400 italic' : 'text-white font-bold'}>{log.amount.toLocaleString('vi-VN')}đ</span>{!log.isSavingsWithdrawal && <button onClick={() => handleEditIncomeStart(log.id, log.amount, log.date)} className="text-slate-500 hover:text-amber-400"><EditIcon className="w-3 h-3" /></button>}</div></div>))}</div>
                    </div>
                </div>

                <div className="lg:col-span-2">
                      <div className={`${seasonalTheme.cardBg} p-5 rounded-lg shadow-lg`}>
                        <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-4 gap-4">
                           <div className="flex items-center gap-2"><h3 className={`text-xl font-bold ${seasonalTheme.primaryTextColor}`}>Nợ cần trả</h3><div className="flex items-center gap-2 bg-black/30 rounded-lg px-3 py-1 border border-slate-700"><select value={debtFilterMonth} onChange={(e) => setDebtFilterMonth(parseInt(e.target.value))} className="bg-transparent text-sm font-semibold text-white outline-none">{MONTH_NAMES.map((m, idx) => <option key={idx} value={idx} className="bg-slate-900">{m}</option>)}</select><input type="number" value={debtFilterYear} onChange={(e) => setDebtFilterYear(parseInt(e.target.value))} className="bg-transparent text-sm font-semibold text-white w-16 outline-none"/></div></div>
                           <div className="flex gap-2"><button onClick={() => setDebtHistoryOpen(true)} className="px-3 py-2 text-sm font-semibold text-slate-300 bg-slate-800 rounded-lg flex items-center gap-1"><HistoryIcon /> Lịch sử</button><button onClick={() => { setNewDebt({ name: '', source: '', totalAmount: 0, dueDate: new Date().toISOString().slice(0, 10), startDate: new Date().toISOString().slice(0, 10), repaymentType: 'flexible', monthlyInstallment: 0, isBNPL: false, targetMonth: debtFilterMonth, targetYear: debtFilterYear }); setEditingDebtId(null); setIsRecurringDebt(false); setDebtModalOpen(true); }} className={`px-4 py-2 text-sm font-semibold text-slate-900 rounded-lg shadow-md ${seasonalTheme.accentColor}`}><PlusIcon className="inline mr-1"/> Thêm</button></div>
                        </div>
                        <div className="max-h-[70vh] overflow-y-auto pr-2">
                            {displayDebts.length > 0 ? displayDebts.map(d => <DebtItem key={d.id} debt={d} onAddPayment={handleAddPayment} onWithdrawPayment={handleWithdrawPayment} onEdit={handleEditDebt} theme={seasonalTheme} disposableIncome={disposableIncomeForDebts} />) : <div className={`text-center ${seasonalTheme.secondaryTextColor} py-8 border-2 border-dashed border-slate-700 rounded-xl`}>Không có khoản nợ nào tháng này.</div>}
                        </div>
                      </div>
                </div>
            </div>
        </>
    );

    const renderPlanning = () => {
        const totalDebtAmount = debts.reduce((sum, d) => sum + d.totalAmount, 0);
        const totalPaidAmount = debts.reduce((sum, d) => sum + d.amountPaid, 0);
        const totalRemainingAmount = totalDebtAmount - totalPaidAmount;

        return (
            <div className="space-y-6 animate-fade-in-up">
                <ShoppingCopilot 
                    theme={seasonalTheme}
                    disposableIncome={financialStatus > 0 ? financialStatus : 0}
                    totalDebt={activeDebts.reduce((s, d) => s + (d.totalAmount - d.amountPaid), 0)}
                    monthlyIncomeEstimate={monthlyIncomeRef}
                    savingsBalance={currentSavingsBalance}
                />

                <div className={`${seasonalTheme.cardBg} p-6 rounded-xl shadow-lg border-t-4 border-pink-500`}>
                    <h3 className={`text-2xl font-bold ${seasonalTheme.primaryTextColor} mb-6 flex items-center gap-2`}>
                        <CreditCardIcon className="text-pink-400" /> Tổng quan Nợ & Trả góp
                    </h3>
                    
                    {/* Summary Stats */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                        <div className="bg-slate-800/60 p-4 rounded-lg border border-slate-600 text-center">
                            <p className="text-slate-400 text-xs uppercase font-bold mb-1">Tổng nợ gốc</p>
                            <p className="text-xl font-bold text-white">{totalDebtAmount.toLocaleString('vi-VN')}đ</p>
                        </div>
                        <div className="bg-slate-800/60 p-4 rounded-lg border border-slate-600 text-center">
                            <p className="text-slate-400 text-xs uppercase font-bold mb-1">Đã trả</p>
                            <p className="text-xl font-bold text-emerald-400">{totalPaidAmount.toLocaleString('vi-VN')}đ</p>
                        </div>
                        <div className="bg-slate-800/60 p-4 rounded-lg border border-slate-600 text-center">
                            <p className="text-slate-400 text-xs uppercase font-bold mb-1">Còn lại</p>
                            <p className="text-xl font-bold text-pink-400">{totalRemainingAmount.toLocaleString('vi-VN')}đ</p>
                        </div>
                    </div>

                    {/* Active Debts */}
                    <div className="mb-6">
                        <h4 className="font-bold text-lg text-white mb-3 border-b border-slate-700 pb-2 flex justify-between items-center">
                            <span>Đang thực hiện ({activeDebts.length})</span>
                            <span className="text-xs font-normal text-slate-400">Ưu tiên trả sớm</span>
                        </h4>
                        <div className="space-y-3">
                            {activeDebts.length > 0 ? activeDebts.map(d => {
                                const percent = Math.min((d.amountPaid / d.totalAmount) * 100, 100);
                                return (
                                    <div key={d.id} className="bg-slate-800/40 p-3 rounded border border-slate-700/50 flex justify-between items-center">
                                        <div className="flex-1">
                                            <div className="flex justify-between mb-1">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-bold text-slate-200">{d.name}</span>
                                                    {d.isBNPL && <span className="text-[9px] bg-purple-900 text-purple-300 px-1 rounded border border-purple-500/50">Ví trả sau</span>}
                                                </div>
                                                <span className="text-xs text-pink-300 font-bold">Còn {(d.totalAmount - d.amountPaid).toLocaleString()}đ</span>
                                            </div>
                                            <div className="w-full bg-slate-700 rounded-full h-1.5">
                                                <div className="bg-pink-500 h-1.5 rounded-full" style={{ width: `${percent}%` }}></div>
                                            </div>
                                            <div className="flex justify-between mt-1 text-[10px] text-slate-500">
                                                <span>{formatDate(d.dueDate)}</span>
                                                <span>{Math.round(percent)}%</span>
                                            </div>
                                        </div>
                                    </div>
                                );
                            }) : <p className="text-slate-500 text-sm italic text-center py-2">Không có khoản nợ đang trả.</p>}
                        </div>
                    </div>

                    {/* Completed Debts (History) */}
                    <div>
                        <h4 className="font-bold text-lg text-emerald-400 mb-3 border-b border-slate-700 pb-2 flex justify-between items-center">
                            <span>Lịch sử đã trả ({completedDebts.length})</span>
                            <span className="text-xs font-normal text-slate-400">Đã hoàn thành</span>
                        </h4>
                        <div className="space-y-2 max-h-60 overflow-y-auto pr-1 custom-scrollbar">
                            {completedDebts.length > 0 ? completedDebts.map(d => (
                                <div key={d.id} className="bg-emerald-900/10 p-3 rounded border border-emerald-500/20 flex justify-between items-center">
                                    <div>
                                        <p className="font-bold text-slate-300 text-sm line-through decoration-emerald-500/50">{d.name}</p>
                                        <p className="text-[10px] text-slate-500">{d.source}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-bold text-emerald-500 text-sm">{d.totalAmount.toLocaleString()}đ</p>
                                        <p className="text-[10px] text-slate-500">Hoàn tất</p>
                                    </div>
                                </div>
                            )) : <p className="text-slate-500 text-sm italic text-center py-2">Chưa có lịch sử trả nợ.</p>}
                        </div>
                    </div>
                </div>

                <div className={`${seasonalTheme.cardBg} p-6 rounded-xl shadow-lg border-t-4 border-amber-500`}>
                    <h3 className={`text-2xl font-bold ${seasonalTheme.primaryTextColor} mb-6 flex items-center gap-2`}><PlaneIcon className="text-amber-400" /> Kế hoạch Nghỉ Lễ</h3>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        <div className="space-y-4">
                            {holidays.map(h => (
                                <div key={h.id} className="bg-slate-800/60 p-4 rounded-lg border border-slate-600">
                                    <div className="flex justify-between items-start mb-3"><div><h5 className="text-lg font-bold text-white">{h.name}</h5><p className="text-amber-400 font-medium"><SunIcon className="mr-1"/>{formatDate(h.date)}</p></div><label className="relative inline-flex items-center cursor-pointer"><input type="checkbox" checked={h.isTakingOff} onChange={(e) => handleSaveHoliday(h.id, { isTakingOff: e.target.checked })} className="sr-only peer"/><div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:bg-amber-500 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-full"></div><span className="ml-2 text-sm font-medium text-slate-300">Nghỉ</span></label></div>
                                    {h.isTakingOff && <div className="space-y-3 bg-black/20 p-3 rounded"><div className="grid grid-cols-2 gap-4"><div><label className="text-xs text-slate-400">Từ ngày</label><input type="date" className="input w-full text-sm" value={h.startDate || ''} onChange={(e) => handleSaveHoliday(h.id, { startDate: e.target.value })}/></div><div><label className="text-xs text-slate-400">Đến ngày</label><input type="date" className="input w-full text-sm" value={h.endDate || ''} onChange={(e) => handleSaveHoliday(h.id, { endDate: e.target.value })}/></div></div><textarea placeholder="Ghi chú..." className="input w-full text-sm h-16" value={h.note || ''} onChange={(e) => handleSaveHoliday(h.id, { note: e.target.value })}></textarea></div>}
                                </div>
                            ))}
                        </div>
                        <div className="bg-indigo-900/30 border border-indigo-500/30 p-5 rounded-lg flex items-center justify-center text-slate-400"><p>Chọn "Nghỉ" để xem phân tích tài chính (Tính năng đang phát triển)</p></div>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className={`min-h-screen ${seasonalTheme.background} ${seasonalTheme.primaryTextColor} font-sans p-4 sm:p-6 lg:p-8 relative z-0`}>
            {seasonalTheme.decorations}
            <div className="max-w-5xl mx-auto relative z-10">
                <header className="flex justify-between items-center mb-6">
                    <Header theme={seasonalTheme} />
                    <div className="flex gap-2">
                        {user ? (
                            <div className="flex items-center gap-3 bg-black/30 px-3 py-1.5 rounded-full border border-white/10">
                                <img src={user.photoURL || sadDogImageBase64} alt="User" className="w-8 h-8 rounded-full border border-white/50" />
                                <div className="hidden sm:block"><p className="text-xs font-bold text-white">{user.displayName}</p><button onClick={handleLogout} className="text-[10px] text-red-400 hover:text-red-300">Đăng xuất</button></div>
                            </div>
                        ) : (
                            <button onClick={handleLogin} className="bg-white text-slate-900 px-4 py-2 rounded-full font-bold text-sm shadow-lg hover:bg-gray-100 transition flex items-center gap-2"><svg className="w-4 h-4" viewBox="0 0 24 24"><path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" /><path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" /><path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" /><path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" /></svg>Đăng nhập Google</button>
                        )}
                    </div>
                </header>

                <div className="flex gap-4 mb-6 justify-center">
                    <button onClick={() => setView('dashboard')} className={`px-6 py-2 rounded-full font-bold transition-all ${view === 'dashboard' ? 'bg-amber-400 text-slate-900 shadow-lg scale-105' : 'bg-slate-800 text-slate-400'}`}>Tổng quan</button>
                    <button onClick={() => setView('planning')} className={`px-6 py-2 rounded-full font-bold transition-all ${view === 'planning' ? 'bg-purple-500 text-white shadow-lg scale-105' : 'bg-slate-800 text-slate-400'}`}>Kế hoạch</button>
                    <button onClick={() => setView('strategy')} className={`px-6 py-2 rounded-full font-bold transition-all ${view === 'strategy' ? 'bg-indigo-500 text-white shadow-lg scale-105' : 'bg-slate-800 text-slate-400'}`}>Chiến lược</button>
                </div>
                {loadingData ? <div className="text-center text-white py-10 animate-pulse">
                    {syncStatus === 'syncing' ? <div className="flex justify-center items-center gap-2"><CloudArrowUpIcon className="animate-bounce"/> Đang đồng bộ...</div> : "Đang tải dữ liệu..."}
                </div> : (
                    view === 'dashboard' ? renderDashboard() : 
                    view === 'planning' ? renderPlanning() : 
                    view === 'strategy' ? <StrategicView theme={seasonalTheme} debts={debts.filter(d => d.amountPaid < d.totalAmount)} savingsBalance={currentSavingsBalance} onClose={() => setView('dashboard')} onSavePlan={handleSaveStrategy} onDeletePlan={handleDeleteStrategy} initialConfig={savedStrategy} /> :
                    <SimulationView theme={seasonalTheme} activeDebts={debts.filter(d => d.amountPaid < d.totalAmount)} onClose={() => setView('dashboard')} />
                )}
                
                {/* Sync Status Indicator */}
                {user && (
                    <div className={`fixed bottom-4 right-4 px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-2 transition-all duration-500 ${syncStatus === 'saved' ? 'bg-green-500/80 text-white' : syncStatus === 'syncing' ? 'bg-blue-500/80 text-white' : 'opacity-0'}`}>
                        {syncStatus === 'saved' ? <><CheckCircleIcon className="w-4 h-4"/> Đã lưu</> : <><CloudArrowUpIcon className="w-4 h-4 animate-bounce"/> Đang lưu...</>}
                    </div>
                )}

                <FilterModal isOpen={isFilterModalOpen} onClose={() => setFilterModalOpen(false)} onApply={setFilter} currentFilter={filter} />
                
                {isIncomeEditOpen && <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"><div className="bg-slate-900 border border-slate-700 rounded-xl p-6 w-full max-w-sm"><h3 className="text-lg font-bold text-white mb-4">Sửa thu nhập</h3><CurrencyInput value={editIncomeValue} onValueChange={setEditIncomeValue} className="input w-full mb-4" /><input type="date" value={editIncomeDate} onChange={(e) => setEditIncomeDate(e.target.value)} className="w-full input px-2 h-10 mb-4 bg-slate-800 border border-slate-600 rounded text-white" /><div className="flex justify-end gap-2"><button onClick={() => setIncomeEditOpen(false)} className="px-3 py-1.5 rounded bg-slate-700 text-slate-300">Hủy</button><button onClick={handleEditIncomeSave} className="px-3 py-1.5 rounded bg-amber-500 text-slate-900 font-bold">Lưu</button></div></div></div>}
                
                {manualEntryModal.isOpen && <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"><div className="bg-slate-900 border border-slate-700 rounded-xl p-6 w-full max-w-sm"><h3 className="text-lg font-bold text-white mb-4">Cập nhật lịch sử</h3><input type="date" value={manualDate} onChange={(e) => setManualDate(e.target.value)} className="input w-full mb-4" /><div className="flex justify-end gap-2"><button onClick={() => setManualEntryModal({isOpen: false, type: null})} className="px-3 py-1.5 rounded bg-slate-700 text-slate-300">Hủy</button><button onClick={handleSaveManualEntry} className="px-3 py-1.5 rounded bg-amber-500 text-slate-900 font-bold">Lưu</button></div></div></div>}
                
                {isDebtModalOpen && <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"><div className="bg-slate-900 border border-slate-700 rounded-xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto"><form onSubmit={handleSaveDebt}><h3 className="text-2xl font-bold mb-4">{editingDebtId ? "Sửa nợ" : "Thêm nợ"}</h3>{!editingDebtId && <div className="flex border-b border-slate-700 mb-4"><button type="button" onClick={() => setDebtType('standard')} className={`flex-1 py-2 ${debtType==='standard'?'text-amber-400 border-b-2 border-amber-400':'text-slate-400'}`}>Thường</button><button type="button" onClick={() => setDebtType('shopee')} className={`flex-1 py-2 ${debtType==='shopee'?'text-orange-500 border-b-2 border-orange-500':'text-slate-400'}`}>Shopee</button></div>}{debtType === 'standard' ? <div className="space-y-4"><div><label className="text-sm text-slate-300">Tên</label><input type="text" value={newDebt.name} onChange={e=>setNewDebt({...newDebt,name:e.target.value})} className="input w-full" required/></div><div><label className="text-sm text-slate-300">Nguồn</label><input type="text" value={newDebt.source} onChange={e=>setNewDebt({...newDebt,source:e.target.value})} className="input w-full" required/></div>{!editingDebtId && <div className="flex items-center gap-2"><input type="checkbox" checked={isRecurringDebt} onChange={e=>setIsRecurringDebt(e.target.checked)}/><label>Trả góp/Lặp lại</label></div>}<div><label className="text-sm text-slate-300">Ngày vay/Bắt đầu</label><input type="date" value={newDebt.startDate} onChange={e=>setNewDebt({...newDebt,startDate:e.target.value})} className="input w-full" required/></div><div><label className="text-sm text-slate-300">Ngày tất toán/Hạn trả</label><input type="date" value={newDebt.dueDate} onChange={e=>setNewDebt({...newDebt,dueDate:e.target.value})} className="input w-full" required/></div>
                
                {/* [MODIFIED] Added Repayment Type Selection */}
                <div className="bg-slate-800/50 p-3 rounded border border-slate-600">
                    <label className="text-xs uppercase font-bold text-slate-400 mb-2 block">Kiểu trả nợ</label>
                    <div className="flex gap-4 mb-2">
                        <label className="flex items-center cursor-pointer">
                            <input type="radio" name="repaymentType" checked={newDebt.repaymentType === 'fixed'} onChange={() => setNewDebt({...newDebt, repaymentType: 'fixed'})} className="mr-2" />
                            <span className="text-sm text-white">Cố định (Cty tài chính)</span>
                        </label>
                        <label className="flex items-center cursor-pointer">
                            <input type="radio" name="repaymentType" checked={newDebt.repaymentType === 'flexible'} onChange={() => setNewDebt({...newDebt, repaymentType: 'flexible'})} className="mr-2" />
                            <span className="text-sm text-white">Linh hoạt (Người thân)</span>
                        </label>
                    </div>
                    {/* [NEW] BNPL Checkbox */}
                    <div className="mt-2 pt-2 border-t border-slate-700">
                        <label className="flex items-center cursor-pointer gap-2">
                            <input type="checkbox" checked={newDebt.isBNPL || false} onChange={(e) => setNewDebt({...newDebt, isBNPL: e.target.checked})} className="accent-purple-500 w-4 h-4" />
                            <span className="text-sm text-purple-300 font-bold">Là Ví trả sau/Thẻ tín dụng (Không tính vào tổng chi)</span>
                        </label>
                        <p className="text-[10px] text-slate-500 mt-1 pl-6">Chọn mục này để khi trả nợ, hệ thống không cộng dồn vào tổng chi tiêu tháng (tránh tính 2 lần).</p>
                    </div>

                    {newDebt.repaymentType === 'fixed' && (
                        <div className="animate-fade-in-up mt-3">
                            <label className="text-xs text-slate-300 mb-1 block">Số tiền đóng mỗi tháng:</label>
                            <CurrencyInput value={newDebt.monthlyInstallment} onValueChange={v => setNewDebt({...newDebt, monthlyInstallment: v})} className="input w-full text-sm" placeholder="Nhập số tiền..." />
                        </div>
                    )}
                </div>

                {isRecurringDebt && <div className="p-3 bg-amber-900/20 rounded border border-amber-500/30 space-y-2"><select value={recurringFrequency} onChange={e=>setRecurringFrequency(e.target.value as any)} className="input w-full"><option value="monthly">Tháng</option><option value="weekly">Tuần</option></select><input type="date" value={recurringEndDate} onChange={e=>setRecurringEndDate(e.target.value)} className="input w-full" required/></div>}<div><label className="text-sm text-slate-300">Số tiền</label><CurrencyInput value={newDebt.totalAmount} onValueChange={v=>setNewDebt({...newDebt,totalAmount:v})} className="input w-full" required/></div>{!isRecurringDebt && <div className="flex gap-2 mt-2"><select value={newDebt.targetMonth} onChange={e=>setNewDebt({...newDebt,targetMonth:parseInt(e.target.value)})} className="input flex-1">{MONTH_NAMES.map((m,i)=><option key={i} value={i} className="text-black">{m}</option>)}</select><input type="number" value={newDebt.targetYear} onChange={e=>setNewDebt({...newDebt,targetYear:parseInt(e.target.value)})} className="input w-24"/></div>}</div> : <div className="space-y-4"><div className="flex justify-between items-center mb-2"><label className="text-sm text-slate-300">Năm hóa đơn</label><input type="number" value={shopeeBillYear} onChange={(e) => setShopeeBillYear(parseInt(e.target.value))} className="input w-24 text-center bg-slate-800 text-white border border-slate-600 rounded" /></div><div><label className="text-sm text-slate-300 block mb-2">Tháng</label><div className="grid grid-cols-6 gap-1">{MONTH_NAMES.map((m, i) => (<button type="button" key={i} onClick={() => setShopeeBillMonth(i)} className={`p-1 text-xs rounded ${shopeeBillMonth === i ? 'bg-orange-500 text-white' : 'bg-slate-700 text-slate-400'}`}>T{i + 1}</button>))}</div></div><div><label className="text-sm text-slate-300">Số tiền</label><CurrencyInput value={newDebt.totalAmount} onValueChange={v=>setNewDebt({...newDebt,totalAmount:v})} className="input w-full"/></div></div>}<div className="mt-6 flex justify-end gap-3">{editingDebtId && <button type="button" onClick={()=>handleDeleteDebt(editingDebtId)} className="text-red-400 mr-auto"><TrashIcon/> Xóa</button>}<button type="button" onClick={()=>setDebtModalOpen(false)} className="text-slate-300">Hủy</button><button type="submit" className="bg-amber-500 text-slate-900 px-4 py-2 rounded font-bold">Lưu</button></div></form></div></div>}
                
                {isSavingsHistoryOpen && (
                    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
                        <div className="bg-slate-900 border border-slate-700 rounded-xl p-6 w-full max-w-md h-[70vh] flex flex-col relative shadow-2xl">
                            <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2"><HistoryIcon className="text-emerald-400" /> Lịch sử Quỹ dự phòng</h3>
                            <div className="flex-1 overflow-y-auto pr-2 space-y-3 custom-scrollbar">
                                {savingsHistory.length > 0 ? (
                                    [...savingsHistory].sort((a,b) => b.date.getTime() - a.date.getTime()).map(trans => (
                                        <div key={trans.id} className="flex justify-between items-center p-3 bg-slate-800/60 rounded-lg border border-slate-700/50">
                                            <div>
                                                <p className={`font-bold text-sm ${trans.type === 'deposit' ? 'text-emerald-400' : 'text-amber-400'}`}>{trans.type === 'deposit' ? 'Đã cất vào' : 'Đã rút ra'}</p>
                                                <p className="text-xs text-slate-500">{formatDate(trans.date)}</p>
                                                {trans.note && <p className="text-[10px] text-slate-400 italic mt-0.5">{trans.note}</p>}
                                            </div>
                                            <div className="text-right">
                                                <p className={`font-mono font-bold ${trans.type === 'deposit' ? 'text-emerald-300' : 'text-amber-300'}`}>{trans.type === 'deposit' ? '+' : '-'}{trans.amount.toLocaleString('vi-VN')}đ</p>
                                            </div>
                                        </div>
                                    ))
                                ) : <div className="text-center text-slate-500 py-10">Chưa có giao dịch nào.</div>}
                            </div>
                            <div className="mt-4 pt-4 border-t border-slate-700 flex justify-between items-end">
                                <div><p className="text-xs text-slate-400 uppercase">Tổng quỹ hiện tại</p><p className="text-2xl font-mono font-bold text-emerald-400">{currentSavingsBalance.toLocaleString('vi-VN')}đ</p></div>
                                <button onClick={() => setSavingsHistoryOpen(false)} className="px-4 py-2 rounded-lg bg-slate-700 text-white hover:bg-slate-600 transition">Đóng</button>
                            </div>
                        </div>
                    </div>
                )}

                {isMiscDetailOpen && <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"><div className="bg-slate-900 border border-slate-700 rounded-xl p-6 w-full max-w-lg h-[80vh] flex flex-col"><h3 className="text-xl font-bold mb-4 text-white">Chi tiết phát sinh</h3><div className="flex-1 overflow-y-auto space-y-2 mb-4">{miscLogs.map(l=><div key={l.id} className="flex justify-between p-3 bg-slate-800 rounded"><span>{l.name}</span><div className="flex gap-2"><span className="text-purple-400">{l.amount.toLocaleString()}đ</span><button onClick={()=>handleDeleteMiscLog(l.id, l.amount)} className="text-slate-600 hover:text-red-400"><TrashIcon/></button></div></div>)}</div><form onSubmit={handleAddMiscLog} className="space-y-2"><input type="text" placeholder="Tên" value={newMiscLog.name} onChange={e=>setNewMiscLog({...newMiscLog,name:e.target.value})} className="input w-full" required /><div className="flex gap-2"><CurrencyInput value={newMiscLog.amount} onValueChange={v=>setNewMiscLog({...newMiscLog,amount:v})} className="input flex-1" required /><input type="date" value={newMiscLog.date} onChange={e=>setNewMiscLog({...newMiscLog,date:e.target.value})} className="input w-1/3" required /></div><button className="w-full bg-purple-600 py-2 rounded font-bold">Thêm</button></form><button onClick={()=>setMiscDetailOpen(false)} className="absolute top-4 right-4"><CloseIcon/></button></div></div>}
            </div>
        </div>
    );
};

export default App;