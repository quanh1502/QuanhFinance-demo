import React, { useState } from 'react';
import { SeasonalTheme } from '../types';
import CurrencyInput from './CurrencyInput';
import { ListIcon, PlusIcon, MinusIcon } from './icons';

interface BudgetRowProps {
    icon: React.ReactNode;
    label: string;
    budget: number;
    actual: number;
    onBudgetChange: (val: number) => void;
    onActualChange: (val: number) => void; // Hàm này sẽ nhận giá trị âm nếu là trừ
    theme: SeasonalTheme;
    colorClass: string;
    onDetailClick?: () => void;
}

const BudgetRow: React.FC<BudgetRowProps> = ({ icon, label, budget, actual, onBudgetChange, onActualChange, theme, colorClass, onDetailClick }) => {
    const [addValue, setAddValue] = useState(0);
    const percentage = budget > 0 ? Math.min((actual / budget) * 100, 100) : 0;
    const isOverBudget = actual > budget && budget > 0;

    const handleTransaction = (isAdding: boolean) => {
        if (addValue > 0) {
            // Nếu là thêm thì dương, trừ thì âm
            onActualChange(isAdding ? addValue : -addValue);
            setAddValue(0);
        }
    };

    return (
        <div className="p-3 bg-black/20 rounded-md relative group">
            <div className="flex items-center justify-between mb-2">
                <div className="flex items-center">
                    <span className={`${colorClass} mr-3`}>{icon}</span>
                    <span className={`font-semibold ${theme.primaryTextColor}`}>{label}</span>
                </div>
                <div className="flex items-center gap-2">
                     {isOverBudget && <span className="text-xs text-red-400 font-bold animate-pulse">Vượt!</span>}
                     {onDetailClick && (
                         <button 
                            onClick={onDetailClick}
                            className="text-xs bg-slate-700 hover:bg-slate-600 text-slate-300 px-2 py-1 rounded flex items-center gap-1"
                         >
                             <ListIcon /> Xem
                         </button>
                     )}
                </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4 mb-2">
                <div>
                    <label className={`block text-xs ${theme.secondaryTextColor} mb-1`}>Ngân sách</label>
                    <CurrencyInput
                        value={budget}
                        onValueChange={onBudgetChange}
                        className="input w-full text-right py-1.5 text-sm"
                    />
                </div>
                <div>
                    <label className={`block text-xs ${theme.secondaryTextColor} mb-1`}>Thực tế</label>
                    <div className={`input w-full text-right py-1.5 text-sm ${isOverBudget ? 'border-red-500/50 text-red-200' : 'bg-slate-800/50 cursor-not-allowed'}`}>
                         {actual.toLocaleString('vi-VN')}<span className="text-xs text-slate-500 ml-1">.đ</span>
                    </div>
                </div>
            </div>
            
            {/* Action Bar */}
            <div className="mt-2 flex items-center justify-end gap-2">
                <label className="text-[10px] text-slate-500">Nhập:</label>
                <div className="w-24">
                        <CurrencyInput
                        value={addValue}
                        onValueChange={setAddValue}
                        placeholder="0"
                        className="bg-slate-900 border-slate-700 py-1 px-2 text-xs text-right rounded w-full"
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') handleTransaction(true);
                        }}
                        />
                </div>
                {/* Nút Trừ (Mới) */}
                <button 
                    onClick={() => handleTransaction(false)}
                    disabled={addValue <= 0}
                    className="bg-slate-800 border border-slate-600 hover:bg-red-900/50 hover:border-red-500 text-red-400 p-1.5 rounded transition disabled:opacity-30"
                    title="Giảm bớt (Nhập sai/Hoàn tiền)"
                >
                    <MinusIcon className="w-3 h-3" />
                </button>
                {/* Nút Cộng */}
                <button 
                    onClick={() => handleTransaction(true)}
                    disabled={addValue <= 0}
                    className="bg-slate-700 hover:bg-emerald-600 text-white p-1.5 rounded transition disabled:opacity-30"
                    title="Thêm chi tiêu"
                >
                    <PlusIcon className="w-3 h-3" />
                </button>
            </div>

            <div className="w-full bg-slate-700 rounded-full h-1.5 mt-2 overflow-hidden">
                <div 
                    className={`h-1.5 rounded-full transition-all duration-500 ${isOverBudget ? 'bg-red-500' : theme.accentColor}`} 
                    style={{ width: `${percentage}%` }}
                ></div>
            </div>
        </div>
    );
};

export default BudgetRow;
