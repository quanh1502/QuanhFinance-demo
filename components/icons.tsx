import React from 'react';

// --- 1. Existing FontAwesome Icons (Giữ nguyên phong cách cũ) ---

export const SnowflakeIcon = ({ className }: { className?: string }) => (
    <i className={`fa-regular fa-snowflake ${className}`}></i>
);

export const SantaIcon = ({ className }: { className?: string }) => (
    <i className={`fa-solid fa-sleigh ${className}`}></i>
);

export const TaurusIcon = ({ className }: { className?: string }) => (
    <i className={`fa-solid fa-gem ${className}`}></i>
);

export const StarIcon = ({ className }: { className?: string }) => (
    <i className={`fa-solid fa-star ${className}`}></i>
);

export const FilterIcon = ({ className }: { className?: string }) => (
    <i className={`fa-solid fa-filter ${className}`}></i>
);

export const MoneyBillIcon = ({ className }: { className?: string }) => (
    <i className={`fa-solid fa-money-bill-wave ${className}`}></i>
);

export const CalendarIcon = ({ className }: { className?: string }) => (
    <i className={`fa-solid fa-calendar-days ${className}`}></i>
);

export const TagIcon = ({ className }: { className?: string }) => (
    <i className={`fa-solid fa-tag ${className}`}></i>
);

export const CheckIcon = ({ className }: { className?: string }) => (
    <i className={`fa-solid fa-check ${className}`}></i>
);

export const CloseIcon = ({ className }: { className?: string }) => (
    <i className={`fa-solid fa-times ${className}`}></i>
);

export const PlusIcon = ({ className }: { className?: string }) => (
    <i className={`fa-solid fa-plus ${className}`}></i>
);

export const MinusIcon = ({ className }: { className?: string }) => (
    <i className={`fa-solid fa-minus ${className}`}></i>
);

export const GasPumpIcon = ({ className }: { className?: string }) => (
    <i className={`fa-solid fa-gas-pump ${className}`}></i>
);

export const WifiIcon = ({ className }: { className?: string }) => (
    <i className={`fa-solid fa-wifi ${className}`}></i>
);

export const FoodIcon = ({ className }: { className?: string }) => (
    <i className={`fa-solid fa-utensils ${className}`}></i>
);

export const PiggyBankIcon = ({ className }: { className?: string }) => (
    <i className={`fa-solid fa-piggy-bank ${className}`}></i>
);

export const TargetIcon = ({ className }: { className?: string }) => (
    <i className={`fa-solid fa-bullseye ${className}`}></i>
);

export const ChartLineIcon = ({ className }: { className?: string }) => (
    <i className={`fa-solid fa-chart-line ${className}`}></i>
);

export const WarningIcon = ({ className }: { className?: string }) => (
    <i className={`fa-solid fa-triangle-exclamation ${className}`}></i>
);

export const ChevronLeftIcon = ({ className }: { className?: string }) => (
    <i className={`fa-solid fa-chevron-left ${className}`}></i>
);

export const ChevronRightIcon = ({ className }: { className?: string }) => (
    <i className={`fa-solid fa-chevron-right ${className}`}></i>
);

export const BoltIcon = ({ className }: { className?: string }) => (
    <i className={`fa-solid fa-bolt ${className}`}></i>
);

export const SaveIcon = ({ className }: { className?: string }) => (
    <i className={`fa-solid fa-floppy-disk ${className}`}></i>
);

export const CircleIcon = ({ className }: { className?: string }) => (
    <i className={`fa-regular fa-circle ${className}`}></i>
);

export const CheckCircleIcon = ({ className }: { className?: string }) => (
    <i className={`fa-solid fa-circle-check ${className}`}></i>
);

export const HistoryIcon = ({ className }: { className?: string }) => (
    <i className={`fa-solid fa-clock-rotate-left ${className}`}></i>
);

export const HourglassIcon = ({ className }: { className?: string }) => (
    <i className={`fa-solid fa-hourglass-half ${className}`}></i>
);

export const ListIcon = ({ className }: { className?: string }) => (
    <i className={`fa-solid fa-list-ul ${className}`}></i>
);

export const TrashIcon = ({ className }: { className?: string }) => (
    <i className={`fa-solid fa-trash-can ${className}`}></i>
);

export const CreditCardIcon = ({ className }: { className?: string }) => (
    <i className={`fa-regular fa-credit-card ${className}`}></i>
);

export const RepeatIcon = ({ className }: { className?: string }) => (
    <i className={`fa-solid fa-repeat ${className}`}></i>
);

export const EditIcon = ({ className }: { className?: string }) => (
    <i className={`fa-solid fa-pen-to-square ${className}`}></i>
);

export const ReceiptIcon = ({ className }: { className?: string }) => (
    <i className={`fa-solid fa-receipt ${className}`}></i>
);

export const ShoppingBagIcon = ({ className }: { className?: string }) => (
    <i className={`fa-solid fa-bag-shopping ${className}`}></i>
);

export const CalendarPlusIcon = ({ className }: { className?: string }) => (
    <i className={`fa-solid fa-calendar-plus ${className}`}></i>
);

export const PlaneIcon = ({ className }: { className?: string }) => (
    <i className={`fa-solid fa-plane-departure ${className}`}></i>
);

export const WalletIcon = ({ className }: { className?: string }) => (
    <i className={`fa-solid fa-wallet ${className}`}></i>
);

export const SunIcon = ({ className }: { className?: string }) => (
    <i className={`fa-solid fa-sun ${className}`}></i>
);

export const ArrowRightIcon = ({ className }: { className?: string }) => (
    <i className={`fa-solid fa-arrow-right ${className}`}></i>
);

export const ExchangeIcon = ({ className }: { className?: string }) => (
    <i className={`fa-solid fa-right-left ${className}`}></i>
);

// --- 2. New SVG Icons (Dành cho các tính năng mới & Seasonal Theme) ---
// Sử dụng SVG Inline để đảm bảo không bị lỗi nếu FontAwesome thiếu icon

export const GearIcon = ({ className = "w-6 h-6" }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M10.343 3.94c.09-.542.56-.94 1.11-.94h1.093c.55 0 1.02.398 1.11.94l.149.894c.07.424.384.764.78.93.398.164.855.142 1.205-.108l.737-.527a1.125 1.125 0 011.45.12l.773.774c.39.389.44 1.002.12 1.45l-.527.737c-.25.35-.272.806-.107 1.204.165.397.505.71.93.78l.893.15c.543.09.94.56.94 1.109v1.094c0 .55-.397 1.02-.94 1.11l-.893.149c-.425.07-.765.383-.93.78-.165.398-.143.854.107 1.204l.527.738c.32.447.269 1.06-.12 1.45l-.774.773a1.125 1.125 0 01-1.449.12l-.738-.527c-.35-.25-.806-.272-1.203-.107-.397.165-.71.505-.781.929l-.149.894c-.09.542-.56.94-1.11.94h-1.094c-.55 0-1.019-.398-1.11-.94l-.148-.894c-.071-.424-.384-.764-.781-.93-.398-.164-.854-.142-1.204.108l-.738.527c-.447.32-1.06.269-1.45-.12l-.773-.774a1.125 1.125 0 01-.12-1.45l.527-.737c.25-.35.273-.806.108-1.204-.165-.397-.505-.71-.93-.78l-.894-.15c-.542-.09-.94-.56-.94-1.109v-1.094c0-.55.398-1.02.94-1.11l.894-.149c.424-.07.765-.383.93-.78.165-.398.143-.854-.107-1.204l-.527-.738a1.125 1.125 0 01.12-1.45l.773-.773a1.125 1.125 0 011.45-.12l.737.527c.35.25.807.272 1.204.107.397-.165.71-.505.78-.929l.15-.894z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
);

export const CloudArrowUpIcon = ({ className = "w-6 h-6" }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 16.5V9.75m0 0l3 3m-3-3l-3 3M6.75 19.5a4.5 4.5 0 01-1.41-8.775 5.25 5.25 0 0110.233-2.33 3 3 0 013.758 3.848A3.752 3.752 0 0118 19.5H6.75z" />
    </svg>
);

export const CloudArrowDownIcon = ({ className = "w-6 h-6" }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9.75v6.75m0 0l-3-3m3 3l3-3m-8.25 6a4.5 4.5 0 01-1.41-8.775 5.25 5.25 0 0110.233-2.33 3 3 0 013.758 3.848A3.752 3.752 0 0118 19.5H6.75z" />
    </svg>
);

export const FileCodeIcon = ({ className = "w-6 h-6" }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M14.25 9.75L16.5 12l-2.25 2.25m-4.5 0L7.5 12l2.25-2.25M6 20.25h12A2.25 2.25 0 0020.25 18V6A2.25 2.25 0 0018 3.75H6A2.25 2.25 0 003.75 6v12A2.25 2.25 0 006 20.25z" />
    </svg>
);

export const FlowerIcon = ({ className = "w-6 h-6" }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
        <path d="M11.645 20.91l-.007-.003-.022-.012a15.247 15.247 0 01-.383-.218 25.18 25.18 0 01-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0112 5.052 5.5 5.5 0 0116.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 01-4.244 3.17 15.247 15.247 0 01-.383.219l-.022.012-.007.004-.003.001a.752.752 0 01-.704 0l-.003-.001z" />
    </svg>
);

export const LeafIcon = ({ className = "w-6 h-6" }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
        <path fillRule="evenodd" d="M12.963 2.286a.75.75 0 00-1.071-.136 9.742 9.742 0 00-3.539 6.177 7.547 7.547 0 01-1.705-1.715.75.75 0 00-1.152-.082A9 9 0 1015.68 4.534a7.46 7.46 0 01-2.717-2.248zM15.75 14.25a3.75 3.75 0 11-7.313-1.172c.628.465 1.35.81 2.133 1a5.99 5.99 0 011.925-3.545 3.75 3.75 0 013.255 3.717z" clipRule="evenodd" />
    </svg>
);

export const UmbrellaIcon = ({ className = "w-6 h-6" }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
        <path fillRule="evenodd" d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25zm-2.625 6c-.54 0-.828.419-.936.634a1.96 1.96 0 00-.189.866c0 .298.059.605.189.866.108.215.395.634.936.634.54 0 .828-.419.936-.634.13-.26.189-.568.189-.866 0-.298-.059-.605-.189-.866-.108-.215-.395-.634-.936-.634zm4.314.634c.108-.215.395-.634.936-.634.54 0 .828.419.936.634.13.26.189.568.189.866 0 .298-.059.605-.189.866-.108.215-.395.634-.936.634-.54 0-.828-.419-.936-.634a1.96 1.96 0 01-.189-.866c0-.298.059-.605.189-.866zm2.023 6.828a.75.75 0 10-1.06-1.06 3.75 3.75 0 01-5.304 0 .75.75 0 00-1.06 1.06 5.25 5.25 0 007.424 0z" clipRule="evenodd" />
    </svg>
);

export const HeartIcon = ({ className = "w-6 h-6" }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
    </svg>
);

export const BrainIcon = ({ className = "w-6 h-6" }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 18v-5.25m0 0a6.01 6.01 0 001.5-.189m-1.5.189a6.01 6.01 0 01-1.5-.189m3.75 7.478a12.06 12.06 0 01-4.5 0m3.75 2.383a14.406 14.406 0 01-3 0M14.25 18v-.192c0-.983.658-1.823 1.508-2.316a7.5 7.5 0 10-7.517 0c.85.493 1.509 1.333 1.509 2.316V18" />
    </svg>
);

export const ShieldIcon = ({ className = "w-6 h-6" }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 01-3.296-1.043 3.745 3.745 0 01-1.043-3.296A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 011.043-3.296 3.746 3.746 0 013.296-1.043A3.746 3.746 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 013.296 1.043 3.746 3.746 0 011.043 3.296A3.745 3.745 0 0121 12z" />
    </svg>
);

export const RocketIcon = ({ className = "w-6 h-6" }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.59 14.37a6 6 0 01-5.84 7.38v-4.8m5.84-2.58a14.98 14.98 0 006.16-12.12A14.98 14.98 0 009.631 8.41m5.96 5.96a14.926 14.926 0 01-5.841 2.58m-.119-8.54a6 6 0 00-7.381 5.84h4.8m2.581-5.84a14.927 14.927 0 00-2.58 5.84m2.699 2.7c-.103.021-.207.041-.311.06a15.09 15.09 0 01-2.448-2.448 14.9 14.9 0 01.06-.312m-2.24 2.39a4.493 4.493 0 00-1.757 4.306 4.493 4.493 0 004.306-1.758M16.5 9a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" />
    </svg>
);

export const FeatherIcon = ({ className = "w-6 h-6" }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125" />
    </svg>
);

export const PushPinIcon = ({ className = "w-6 h-6" }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
);

export const EnvelopeIcon = ({ className = "w-6 h-6" }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
    </svg>
);

// Placeholder SVG for illustrations
export const TreeIllustration = () => (
    <svg viewBox="0 0 200 200" className="w-full h-full opacity-50">
        <circle cx="100" cy="100" r="80" fill="currentColor" />
    </svg>
);

export const DeskIllustration = () => (
    <svg viewBox="0 0 200 200" className="w-full h-full opacity-50">
        <rect x="20" y="80" width="160" height="10" fill="currentColor" />
    </svg>
);
