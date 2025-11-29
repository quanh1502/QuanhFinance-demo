import React from 'react';

interface CurrencyInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange'> {
    value: number;
    onValueChange: (value: number) => void;
}

const CurrencyInput: React.FC<CurrencyInputProps> = ({ value, onValueChange, className, placeholder, ...props }) => {
    // Luôn đảm bảo displayValue là chuỗi số có định dạng, hoặc rỗng nếu bằng 0
    const displayValue = value ? (value / 1000).toLocaleString('vi-VN', { maximumFractionDigits: 3 }) : '';

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        // Chỉ lấy số và dấu chấm (cho phần thập phân nếu có, dù ở đây ta nhân 1000)
        const rawValue = e.target.value.replace(/[^0-9.]/g, '');
        
        if (!rawValue) {
            onValueChange(0);
            return;
        }

        // Chuyển đổi: Người dùng nhập 1 -> Hiểu là 1.000đ
        const numValue = parseFloat(rawValue);
        if (!isNaN(numValue)) {
            onValueChange(numValue * 1000);
        }
    };

    return (
        <div className="relative w-full">
            <input
                {...props}
                type="text"
                inputMode="decimal" // Giúp hiện bàn phím số trên điện thoại
                className={`${className} pr-10`} // Padding right để tránh đè chữ .000
                value={displayValue}
                onChange={handleChange}
                placeholder={placeholder || "0"}
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-white/50 pointer-events-none select-none font-medium text-sm">
                .000
            </span>
        </div>
    );
};

export default CurrencyInput;
