import React, { useState } from 'react';
import { SeasonalTheme, PurchaseScenario, AnalysisResult } from '../types';
import { BrainIcon, ShieldIcon, RocketIcon, WarningIcon, CheckCircleIcon, CloseIcon } from './icons';

// Định nghĩa lại CurrencyInput nội bộ để đảm bảo hoạt động độc lập
const LocalCurrencyInput = ({ value, onValueChange, className }: { value: number, onValueChange: (v: number) => void, className?: string }) => {
    const displayValue = value ? (value / 1000).toLocaleString('vi-VN') : '';
    return (
        <div className="relative w-full">
            <input
                type="text"
                inputMode="decimal"
                className={`${className} pr-8`}
                value={displayValue}
                onChange={(e) => {
                    const raw = e.target.value.replace(/[^0-9]/g, '');
                    onValueChange(raw ? parseFloat(raw) * 1000 : 0);
                }}
                placeholder="0"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-white/50 pointer-events-none text-xs">.000</span>
        </div>
    );
};

interface ShoppingCopilotProps {
    theme: SeasonalTheme;
    disposableIncome: number;
    totalDebt: number;
    monthlyIncomeEstimate: number;
    savingsBalance: number;
}

const ShoppingCopilot: React.FC<ShoppingCopilotProps> = ({ theme, disposableIncome, totalDebt, monthlyIncomeEstimate, savingsBalance }) => {
    const [step, setStep] = useState<'input' | 'result'>('input');
    const [data, setData] = useState<PurchaseScenario>({
        name: '', price: 0, category: 'short-term', urgency: 'low', method: 'full', installmentTerm: 3, monthlyPayment: 0
    });
    const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);

    const analyzePurchase = () => {
        let score = 50; 
        const msgs: string[] = [];
        let risk: AnalysisResult['riskLevel'] = 'low';
        let impact = '';
        let verdict: AnalysisResult['verdict'] = 'consider';

        // --- 1. PHÂN TÍCH KHẢ NĂNG THANH TOÁN (STRICT MODE) ---
        if (data.method === 'full') {
            const surplusAfterPurchase = disposableIncome - data.price;
            
            if (surplusAfterPurchase < 0) {
                // Tiền mặt không đủ -> TỪ CHỐI NGAY
                score = 0; verdict = 'rejected'; risk = 'critical';
                msgs.push("⛔ TỪ CHỐI: Bạn KHÔNG ĐỦ TIỀN MẶT dư dả (đang thiếu " + Math.abs(surplusAfterPurchase).toLocaleString() + "đ). Mua xong sẽ thâm hụt vào tiền ăn/tiền nhà.");
                impact = "Vỡ ngân sách hiện tại.";
            } else if (surplusAfterPurchase < 500000 && data.category !== 'long-term') {
                // Còn quá ít tiền -> Rất nguy hiểm
                score -= 40; risk = 'high'; verdict = 'rejected';
                msgs.push("⚠️ CẢNH BÁO ĐỎ: Mua xong bạn sẽ 'cháy túi' (còn dưới 500k). Rủi ro rất cao nếu có việc phát sinh.");
                impact = `Chỉ còn dư ${surplusAfterPurchase.toLocaleString()}đ.`;
            } else {
                score += 20;
                msgs.push("✅ Tài chính cho phép thanh toán ngay.");
                impact = `Chiếm ${Math.round((data.price / disposableIncome) * 100)}% số dư khả dụng.`;
            }
        } else {
            // --- TRẢ GÓP ---
            const monthlyPay = data.monthlyPayment || (data.price / (data.installmentTerm || 1));
            const debtRatio = ((totalDebt + data.price) / monthlyIncomeEstimate) * 100;

            if (data.category === 'short-term') {
                // Trả góp cho tiêu sản -> CẤM
                score = 0; verdict = 'rejected'; risk = 'critical';
                msgs.push("⛔ TƯ DUY SAI LẦM: Tuyệt đối không trả góp cho tiêu sản ngắn hạn (ăn uống, mỹ phẩm). Bạn sẽ phải trả nợ khi món đồ đã hết giá trị sử dụng.");
            } else if (debtRatio > 35) {
                // Nợ cao -> CẤM
                score -= 50; verdict = 'rejected'; risk = 'high';
                msgs.push(`⛔ CẢNH BÁO NỢ: Tỷ lệ nợ sẽ vượt quá 35% (${debtRatio.toFixed(1)}%). Dừng ngay việc vay thêm.`);
            } else {
                score += 10;
                impact = `Gánh thêm ${monthlyPay.toLocaleString()}đ/tháng trong ${data.installmentTerm} tháng.`;
            }
        }

        // --- 2. PHÂN TÍCH NHU CẦU ---
        if (verdict !== 'rejected') {
            if (data.urgency === 'high') { 
                score += 30; msgs.push("🔥 Nhu cầu cấp bách -> Ưu tiên giải quyết."); 
            } else if (data.urgency === 'low') { 
                score -= 30; msgs.push("🧊 Không gấp -> Áp dụng quy tắc 48h (Chờ 2 ngày hãy mua)."); 
                // Nếu điểm thấp quá thì chuyển sang consider
                if (score < 50) verdict = 'consider';
            }
            
            if (data.category === 'long-term') { score += 10; msgs.push("💎 Món đồ có giá trị sử dụng lâu dài."); }
        }

        // Quyết định cuối cùng
        if (score >= 80 && verdict !== 'rejected') verdict = 'approved';
        else if (score <= 40) verdict = 'rejected';

        setAnalysis({ score, verdict, riskLevel: risk, messages: msgs, financialImpact: impact });
        setStep('result');
    };

    return (
        <div className={`w-full bg-slate-900 border border-slate-700 rounded-xl overflow-hidden shadow-2xl animate-fade-in-up`}>
            <div className="bg-gradient-to-r from-indigo-900 to-slate-900 p-4 border-b border-slate-700 flex justify-between items-center">
                <div className="flex items-center gap-2"><BrainIcon className="text-pink-400 text-2xl" /><div><h3 className="text-lg font-bold text-white">Hội đồng Thẩm định</h3><p className="text-[10px] text-slate-400">Strict Mode: On</p></div></div>
                {step === 'result' && <button onClick={() => setStep('input')} className="text-xs text-slate-400 hover:text-white underline">Làm lại</button>}
            </div>
            <div className="p-5">
                {step === 'input' ? (
                    <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div><label className="block text-xs text-slate-400 mb-1">Tên món đồ</label><input type="text" className="input w-full" value={data.name} onChange={e => setData({...data, name: e.target.value})} placeholder="VD: Giày, Tai nghe..." /></div>
                            <div><label className="block text-xs text-slate-400 mb-1">Giá tiền</label><LocalCurrencyInput value={data.price} onValueChange={val => setData({...data, price: val})} className="input w-full" /></div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div><label className="block text-xs text-slate-400 mb-1">Loại</label><select className="input w-full" value={data.category} onChange={e => setData({...data, category: e.target.value as any})}><option value="short-term">Tiêu hao (Ngắn hạn)</option><option value="long-term">Tài sản (Lâu dài)</option><option value="experience">Trải nghiệm</option></select></div>
                            <div><label className="block text-xs text-slate-400 mb-1">Độ cần thiết</label><select className="input w-full" value={data.urgency} onChange={e => setData({...data, urgency: e.target.value as any})}><option value="low">Thích thì mua</option><option value="medium">Cần thiết</option><option value="high">Cấp bách/Bắt buộc</option></select></div>
                        </div>
                        <div className="p-3 bg-black/20 rounded border border-slate-700">
                            <label className="block text-xs text-slate-400 mb-2">Thanh toán</label>
                            <div className="flex gap-4 mb-3">
                                <label className="flex items-center gap-2 cursor-pointer"><input type="radio" checked={data.method === 'full'} onChange={() => setData({...data, method: 'full'})} /><span className="text-sm text-slate-200">Trả thẳng</span></label>
                                <label className="flex items-center gap-2 cursor-pointer"><input type="radio" checked={data.method === 'installment'} onChange={() => setData({...data, method: 'installment'})} /><span className="text-sm text-slate-200">Trả góp</span></label>
                            </div>
                            {data.method === 'installment' && <div className="grid grid-cols-2 gap-4"><div><label className="text-[10px]">Số kỳ</label><input type="number" className="input w-full" value={data.installmentTerm} onChange={e => setData({...data, installmentTerm: parseInt(e.target.value)})} /></div><div><label className="text-[10px]">Góp mỗi kỳ</label><LocalCurrencyInput value={data.monthlyPayment || 0} onValueChange={val => setData({...data, monthlyPayment: val})} className="input w-full" /></div></div>}
                        </div>
                        <button onClick={analyzePurchase} disabled={!data.name || data.price <= 0} className="w-full py-3 rounded-lg font-bold text-white shadow-lg bg-gradient-to-r from-pink-600 to-purple-600 hover:scale-[1.02] transition-all disabled:opacity-50 disabled:cursor-not-allowed"><RocketIcon className="mr-2 inline" /> Thẩm định ngay</button>
                    </div>
                ) : (
                    <div className="animate-fade-in-up">
                        <div className="flex items-center justify-between mb-4">
                            <div><h4 className="text-xl font-bold text-white">{data.name}</h4><p className="text-sm text-slate-400">{data.price.toLocaleString('vi-VN')}đ • {data.method === 'full' ? 'Trả thẳng' : `Góp ${data.installmentTerm} tháng`}</p></div>
                            <div className={`px-4 py-2 rounded-full border font-bold text-sm flex items-center gap-2 ${analysis?.verdict === 'approved' ? 'bg-green-500/20 border-green-500 text-green-400' : analysis?.verdict === 'rejected' ? 'bg-red-500/20 border-red-500 text-red-400' : 'bg-yellow-500/20 border-yellow-500 text-yellow-400'}`}>{analysis?.verdict === 'approved' ? <CheckCircleIcon/> : analysis?.verdict === 'rejected' ? <CloseIcon/> : <WarningIcon/>}{analysis?.verdict === 'approved' ? 'NÊN MUA' : analysis?.verdict === 'rejected' ? 'KHÔNG NÊN MUA' : 'CÂN NHẮC'}</div>
                        </div>
                        {analysis?.financialImpact && <div className="bg-slate-800/50 p-4 rounded-lg border border-slate-700 mb-4"><p className="text-xs text-slate-400 uppercase font-bold mb-1">Tác động</p><p className="text-white">{analysis.financialImpact}</p></div>}
                        <div className="space-y-2 mb-4">{analysis?.messages.map((msg, idx) => <div key={idx} className="flex gap-2 text-sm text-slate-300"><span>•</span><span>{msg}</span></div>)}</div>
                        <div className="mt-6 pt-4 border-t border-slate-700 flex justify-end"><button onClick={() => setStep('input')} className="px-4 py-2 bg-slate-700 text-white rounded hover:bg-slate-600">Kiểm tra khác</button></div>
                    </div>
                )}
            </div>
        </div>
    );
};
export default ShoppingCopilot;
