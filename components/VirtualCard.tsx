import React from 'react';
import { SeasonalTheme } from '../types';
import { WifiIcon } from './icons';

interface VirtualCardProps {
    balance: number;
    totalSpent: number;
    theme: SeasonalTheme;
}

const VirtualCard: React.FC<VirtualCardProps> = ({ balance, totalSpent, theme }) => {
    return (
        <div className="relative w-full h-56 rounded-2xl overflow-hidden transition-transform duration-500 hover:scale-[1.01] shadow-2xl group">
            
            {/* 1. BACKGROUND LAYER */}
            {/* Gradient nền tối sang trọng */}
            <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-black z-0"></div>
            
            {/* Họa tiết nhiễu hạt (Noise texture) giả lập chất liệu nhựa nhám - Optional */}
            <div className="absolute inset-0 opacity-10 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] z-0 mix-blend-overlay"></div>

            {/* Màu nhấn theo mùa (Glow effect) */}
            <div className={`absolute -top-24 -right-24 w-64 h-64 ${theme.accentColor} opacity-20 blur-[80px] rounded-full z-0`}></div>
            <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-blue-600 opacity-15 blur-[80px] rounded-full z-0"></div>

            {/* 2. WATERMARK LAYER (Chữ in chìm) */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full text-center z-0 pointer-events-none overflow-hidden">
                <span className="text-[120px] font-black text-white/5 tracking-tighter whitespace-nowrap select-none font-sans italic transform -rotate-12 block">
                    QABank
                </span>
            </div>

            {/* 3. CONTENT LAYER */}
            <div className="relative z-10 p-6 flex flex-col justify-between h-full text-white">
                
                {/* --- TOP ROW: Logo & Contactless --- */}
                <div className="flex justify-between items-start">
                    {/* Logo QABank tự thiết kế */}
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 border-2 border-white/80 rounded-tr-xl rounded-bl-xl flex items-center justify-center backdrop-blur-sm bg-white/10">
                            <span className="font-bold text-sm">QA</span>
                        </div>
                        <span className="font-bold text-lg tracking-wider font-sans opacity-90 text-shadow-sm">QABank</span>
                        <div className="px-1.5 py-0.5 rounded text-[8px] bg-white/20 border border-white/10 font-bold uppercase tracking-wider ml-1 backdrop-blur-md">
                            Debit
                        </div>
                    </div>
                    
                    {/* Icon sóng (Contactless Payment) */}
                    <WifiIcon className="rotate-90 text-white/60 text-3xl drop-shadow-md" /> 
                </div>

                {/* --- MIDDLE ROW: Chip & Balance --- */}
                <div className="flex items-center gap-6 mt-2">
                    {/* Chip EMV giả lập */}
                    <div className="w-12 h-9 bg-gradient-to-tr from-[#ffcc80] via-[#ffd54f] to-[#ffecb3] rounded-md shadow-inner border border-[#ffa000]/50 flex flex-col justify-between py-1 px-0.5 relative overflow-hidden">
                         <div className="w-full h-[1px] bg-black/20 z-10"></div>
                         <div className="w-full h-[1px] bg-black/20 z-10"></div>
                         <div className="absolute top-0 left-1/2 -translate-x-1/2 h-full w-[1px] bg-black/20 z-10"></div>
                         <div className="absolute inset-0 bg-gradient-to-br from-white/40 to-transparent opacity-50"></div>
                    </div>

                    {/* Số dư (Hiển thị to rõ như số thẻ) */}
                    <div>
                         <p className="text-[10px] text-slate-400 uppercase tracking-widest font-semibold mb-0.5">Số dư khả dụng</p>
                         <p className={`text-2xl font-mono font-bold tracking-tight drop-shadow-lg ${balance >= 0 ? 'text-white' : 'text-red-400'}`}>
                            {balance.toLocaleString('vi-VN')} <span className="text-sm text-slate-400 font-sans font-normal">VND</span>
                        </p>
                    </div>
                </div>

                {/* --- BOTTOM ROW: Number, Date, Name --- */}
                <div className="mt-auto">
                    <div className="flex justify-between items-end">
                        <div className="space-y-1">
                            {/* Số thẻ ẩn */}
                            <p className="font-mono text-white/60 text-lg tracking-[0.2em] shadow-black drop-shadow-sm">
                                •••• •••• •••• {new Date().getFullYear()}
                            </p>
                            
                            <div className="flex items-end gap-6 pt-2">
                                {/* Chủ thẻ */}
                                <div>
                                    <p className="text-[7px] text-slate-400 uppercase tracking-widest mb-0.5">MEMBER SINCE 2025</p>
                                    <p className="font-medium text-sm tracking-widest uppercase text-slate-100 font-sans drop-shadow-md">
                                        LÊ QUỲNH ANH
                                    </p>
                                </div>
                                
                                {/* Ngày hết hạn giả */}
                                <div>
                                    <p className="text-[6px] text-slate-400 uppercase text-center leading-tight">VALID<br/>THRU</p>
                                    <p className="font-mono text-sm text-white/90">12/28</p>
                                </div>
                            </div>
                        </div>

                        {/* Tổng chi (Tính năng riêng của App) */}
                        <div className="text-right opacity-80 group-hover:opacity-100 transition-opacity">
                            <p className="text-[9px] text-slate-400 uppercase font-bold">Tổng chi tháng</p>
                            <p className="font-bold text-sm text-white">{totalSpent.toLocaleString('vi-VN')}đ</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default VirtualCard;
