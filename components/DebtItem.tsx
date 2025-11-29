import React, { useState } from 'react';
import { Debt, SeasonalTheme } from '../types';
import { formatDate, MONTH_NAMES } from '../utils/date';
import CurrencyInput from './CurrencyInput';
import { 
    TagIcon, CalendarIcon, EditIcon, HistoryIcon, 
    ChartLineIcon, HourglassIcon, PlusIcon, MinusIcon 
} from './icons'; 

interface DebtItemProps {
    debt: Debt;
    onAddPayment: (id: string, amount: number, date: Date) => void;
    onWithdrawPayment: (id: string, amount: number, reason: string) => void;
    onEdit: (debt: Debt) => void;
    theme: SeasonalTheme;
    disposableIncome: number; 
    isMobile?: boolean;
}

const DebtItem: React.FC<DebtItemProps> = ({ debt, onAddPayment, onWithdrawPayment, onEdit, theme, disposableIncome, isMobile }) => {
    const [inputValue, setInputValue] = useState(0);
    const [showWithdrawReason, setShowWithdrawReason] = useState(false);
    const [withdrawReason, setWithdrawReason] = useState('');
    const [showHistory, setShowHistory] = useState(false);
    
    const [isConfirmingPayment, setIsConfirmingPayment] = useState(false);
    const [paymentDate, setPaymentDate] = useState(new Date().toISOString().slice(0, 10));

    const remaining = debt.totalAmount - debt.amountPaid;
    
    // --- [FIX] Logic tính ngày ---
    // Đưa thời gian về 00:00:00 để so sánh chính xác theo ngày dương lịch
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const dueDateObj = new Date(debt.dueDate);
    dueDateObj.setHours(0, 0, 0, 0);

    const isOverdue = today > dueDateObj && remaining > 0;
    const daysLeft = Math.ceil((dueDateObj.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    // ---------------------------

    const weeksRemaining = Math.max(1, Math.ceil(daysLeft / 7));
    const weeklyPaymentNeed = remaining > 0 ? remaining / weeksRemaining : 0;

    const handleInitiateAdd = () => {
        if (inputValue <= 0) return;
        setIsConfirmingPayment(true);
        // Mặc định ngày trả là hôm nay
        setPaymentDate(new Date().toISOString().slice(0, 10));
    };

    const confirmAddPayment = () => {
        onAddPayment(debt.id, inputValue, new Date(paymentDate));
        setInputValue(0);
        setIsConfirmingPayment(false);
    };

    const confirmWithdraw = () => {
        if (!withdrawReason.trim()) {
            alert("Vui lòng nhập lý do rút tiền!");
            return;
        }
        onWithdrawPayment(debt.id, inputValue, withdrawReason);
        setShowWithdrawReason(false);
        setWithdrawReason('');
        setInputValue(0);
    };

    const getSmartSuggestion = () => {
        if (remaining <= 0) return null;
        if (disposableIncome <= 0) return { text: "Thu nhập thấp, cân nhắc tạm ngưng.", color: "text-slate-400", bgColor: "bg-slate-700/50" };
        if (disposableIncome > weeklyPaymentNeed * 2) return { text: "Dư dả! Gợi ý tăng mức góp.", color: "text-green-300", bgColor: "bg-green-900/30" };
        return { text: "Tiếp tục góp theo kế hoạch.", color: "text-blue-300", bgColor: "bg-blue-900/30" };
    };

    const suggestion = getSmartSuggestion();
    
    // Tách accentColor an toàn (ví dụ: 'bg-amber-400' -> 'amber-400') để dùng cho border/ring
    const accentBase = theme.accentColor.replace('bg-', ''); 
    const accentClass = `ring-${accentBase} border-${accentBase}`;

    let statusColor = 'text-green-400';
    let statusText = `Còn ${daysLeft} ngày`;
    
    if (remaining <= 0) {
        statusColor = 'text-slate-500';
        statusText = 'Hoàn thành';
    } else if (daysLeft < 0) {
        statusColor = 'text-red-400';
        statusText = `Quá hạn ${Math.abs(daysLeft)} ngày`;
    } else if (daysLeft === 0) {
        statusColor = 'text-orange-400';
        statusText = `Hạn chót hôm nay!`;
    } else if (daysLeft <= 3) {
        statusColor = 'text-orange-400';
        statusText = `Gấp! Còn ${daysLeft} ngày`;
    }

    const targetBudgetInfo = (debt.targetMonth !== undefined && debt.targetYear !== undefined)
        ? `Ngân sách: ${MONTH_NAMES[debt.targetMonth]} ${debt.targetYear}` 
        : null;

    // Sizing classes responsive
    const titleSize = isMobile ? 'text-base' : 'text-lg';
    const amountSize = isMobile ? 'text-lg' : 'text-xl';
    const smallText = isMobile ? 'text-[10px]' : 'text-xs';
    const baseText = isMobile ? 'text-xs' : 'text-sm';
    const padding = isMobile ? 'p-3' : 'p-4';

    return (
        <div className={`${padding} rounded-lg shadow-md mb-3 transition-all duration-300 border ${isOverdue ? 'bg-red-900/20 border-red-500/30' : `${theme.cardBg} border-slate-700/50`}`}>
            <div className="flex justify-between items-start">
                <div className="flex-1 pr-2">
                    <div className="flex items-center gap-2 mb-1">
                        <h4 className={`font-bold ${titleSize} ${theme.primaryTextColor} line-clamp-1`}>{debt.name}</h4>
                        <button onClick={() => onEdit(debt)} className={`${smallText} text-slate-500 hover:text-white p-1 rounded hover:bg-white/10 transition`}>
                            <EditIcon />
                        </button>
                        <button 
                            onClick={() => setShowHistory(!showHistory)} 
                            className={`${smallText} px-2 py-0.5 rounded transition flex items-center ${showHistory ? 'bg-blue-500/30 text-blue-200' : 'text-slate-500 hover:text-blue-300'}`}
                        >
                            <HistoryIcon className="mr-1 w-3 h-3"/> Lịch sử
                        </button>
                    </div>
                    <p className={`${baseText} ${theme.secondaryTextColor} flex items-center gap-2`}><TagIcon className="w-3 h-3" /> {debt.source}</p>
                    <p className={`${baseText} ${theme.secondaryTextColor} flex items-center gap-2 mt-0.5`}><CalendarIcon className="w-3 h-3"/> Hạn: {formatDate(debt.dueDate)}</p>
                    {targetBudgetInfo && (
                        <p className={`${smallText} text-amber-400/80 mt-1 italic border-l-2 border-amber-400/50 pl-2`}>
                            {targetBudgetInfo}
                        </p>
                    )}
                </div>
                <div className="text-right flex-shrink-0">
                    <p className={`font-bold ${amountSize} ${theme.primaryTextColor}`}>{remaining.toLocaleString('vi-VN')}đ</p>
                    {remaining > 0 && (
                        <p className={`${smallText} font-semibold text-pink-400 mt-1 flex justify-end items-center gap-1`} title="Số tiền cần góp mỗi tuần để trả hết đúng hạn">
                           <ChartLineIcon className="w-3 h-3" />
                           ~{Math.round(weeklyPaymentNeed).toLocaleString('vi-VN')}/tuần
                        </p>
                    )}
                    <div className={`${baseText} font-bold flex items-center justify-end gap-1 mt-1 ${statusColor}`}>
                        <HourglassIcon className="w-3 h-3"/>
                        {statusText}
                    </div>
                </div>
            </div>
            
            {/* Lịch sử giao dịch */}
            {showHistory && debt.transactions && debt.transactions.length > 0 && (
                <div className={`mt-3 mb-3 bg-black/40 rounded p-2 ${smallText} max-h-32 overflow-y-auto border border-white/5`}>
                    <h5 className="font-bold text-slate-400 mb-2 sticky top-0 bg-black/80 pb-1 border-b border-white/10">Lịch sử giao dịch:</h5>
                    {debt.transactions.slice().slice().reverse().map(t => (
                        <div key={t.id} className="flex justify-between py-1.5 border-b border-white/5 last:border-0 hover:bg-white/5 px-1 rounded">
                            <span className="text-slate-400">{formatDate(t.date)}</span>
                            <div className="text-right">
                                <span className={t.type === 'payment' ? 'text-green-400 font-bold' : 'text-red-400 font-bold'}>
                                    {t.type === 'payment' ? '+' : '-'}{t.amount.toLocaleString('vi-VN')}
                                </span>
                                {t.reason && <span className="block text-[9px] text-slate-500 italic max-w-[150px] ml-auto truncate">{t.reason}</span>}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Thanh tiến độ */}
            <div className="mt-4">
                <div className="w-full bg-slate-700 rounded-full h-2 relative overflow-hidden">
                    <div className={`${theme.accentColor} h-2 rounded-full transition-all duration-500 absolute left-0 top-0`} style={{ width: `${Math.min((debt.amountPaid / debt.totalAmount) * 100, 100)}%` }}></div>
                </div>
                <div className={`${smallText} ${theme.secondaryTextColor} mt-1.5 flex justify-between`}>
                    <span>Đã trả: <strong className="text-green-400">{debt.amountPaid.toLocaleString('vi-VN')}đ</strong></span>
                    <span>Tổng: {debt.totalAmount.toLocaleString('vi-VN')}đ</span>
                </div>
            </div>

            {/* Gợi ý thông minh */}
            {suggestion && (
                <div className={`mt-3 p-2 rounded ${smallText} flex items-start gap-2 ${suggestion.bgColor} ${suggestion.color} border border-white/5`}>
                    <i className="fa-solid fa-lightbulb mt-0.5"></i>
                    <span className="leading-tight">{suggestion.text}</span>
                </div>
            )}

            {/* Khu vực nhập liệu */}
             <div className="mt-3 flex items-end gap-2">
                <div className="flex-1">
                    <label className={`${smallText} text-slate-400 uppercase font-bold mb-1 block`}>Cập nhật số tiền</label>
                    <CurrencyInput
                        value={inputValue}
                        onValueChange={setInputValue}
                        className={`w-full px-3 py-2 bg-slate-800/50 border border-slate-600 rounded-md focus:ring-1 focus:ring-${accentBase}-500 focus:border-${accentBase}-500 transition text-white ${baseText}`}
                        placeholder="Nhập số tiền..."
                        isMobile={isMobile}
                    />
                </div>
                <button 
                    onClick={handleInitiateAdd} 
                    disabled={inputValue <= 0}
                    className={`h-[38px] px-4 rounded-md text-slate-900 font-bold ${theme.accentColor} hover:brightness-110 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center shadow-lg shadow-${accentBase}-500/20`}
                    title="Góp thêm"
                >
                    <PlusIcon className="w-4 h-4"/>
                </button>
                <button 
                    onClick={() => setShowWithdrawReason(true)} 
                    disabled={inputValue <= 0 || inputValue > debt.amountPaid}
                    className="h-[38px] px-4 rounded-md text-white font-bold bg-slate-700 border border-slate-600 hover:bg-red-900/50 hover:border-red-500 hover:text-red-400 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                    title="Rút bớt (Tiêu dùng)"
                >
                    <MinusIcon className="w-4 h-4"/>
                </button>
            </div>
            
            {/* Popup Xác nhận ngày trả */}
            {isConfirmingPayment && (
                <div className={`mt-3 p-3 bg-emerald-900/30 border border-emerald-500/40 rounded-lg animate-fade-in-up relative ${baseText}`}>
                    <p className="font-bold text-emerald-400 mb-2 text-xs uppercase tracking-wide">Xác nhận ngày giao dịch:</p>
                    <div className="flex items-center gap-2 mb-3">
                        <CalendarIcon className="text-emerald-500/70 w-4 h-4"/>
                        <input 
                            type="date" 
                            value={paymentDate}
                            onChange={(e) => setPaymentDate(e.target.value)}
                            className="bg-slate-900 border border-slate-600 text-white px-2 py-1.5 rounded text-sm focus:border-emerald-400 outline-none flex-1"
                        />
                    </div>
                    <div className="flex justify-end gap-2">
                        <button onClick={() => setIsConfirmingPayment(false)} className="px-3 py-1.5 rounded bg-slate-800 text-slate-300 hover:bg-slate-700 text-xs font-semibold">Hủy</button>
                        <button onClick={confirmAddPayment} className="px-3 py-1.5 rounded bg-emerald-600 text-white font-bold hover:bg-emerald-500 text-xs shadow-lg shadow-emerald-900/20">
                            Xác nhận
                        </button>
                    </div>
                </div>
            )}

            {/* Popup Lý do rút tiền */}
            {showWithdrawReason && (
                <div className={`mt-3 p-3 bg-red-900/20 border border-red-500/40 rounded-lg animate-fade-in-up ${baseText}`}>
                    <label className="block font-bold text-red-400 mb-1 text-xs uppercase">Lý do rút tiền (Bắt buộc):</label>
                    <input 
                        type="text" 
                        value={withdrawReason}
                        onChange={(e) => setWithdrawReason(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-600 text-white px-3 py-2 rounded text-sm mb-3 focus:border-red-400 outline-none"
                        placeholder="VD: Cần tiền gấp..."
                        autoFocus
                    />
                    <div className="flex justify-end gap-2">
                        <button onClick={() => setShowWithdrawReason(false)} className="px-3 py-1.5 rounded bg-slate-800 text-slate-300 hover:bg-slate-700 text-xs font-semibold">Hủy</button>
                        <button onClick={confirmWithdraw} className="px-3 py-1.5 rounded bg-red-600 text-white font-bold hover:bg-red-500 text-xs shadow-lg shadow-red-900/20">
                            Rút tiền
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DebtItem;
