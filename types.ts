import React from 'react';

// --- 1. Các Log (Nhật ký) cơ bản ---

export interface GasLog {
  date: Date;
  id: string;
}

export interface FoodLog {
  id: string;
  amount: number;
  date: Date;
}

export interface ExpenseLog {
  id: string;
  name: string;
  amount: number;
  date: Date;
}

export interface IncomeLog {
  id: string;
  amount: number;
  date: Date;
  isSavingsWithdrawal?: boolean; // True nếu khoản thu này là rút từ quỹ dự phòng
}

// --- 2. Quản lý Quỹ Dự Phòng (Mới) ---

export interface SavingsTransaction {
  id: string;
  date: Date;
  amount: number;
  type: 'deposit' | 'withdrawal'; // 'deposit': Cất vào, 'withdrawal': Rút ra
  note?: string;
}

// --- 3. Quản lý Nợ (Debt) ---

export interface DebtTransaction {
  id: string;
  date: Date;
  amount: number; // Số dương là trả nợ (+), Số dương ở type withdrawal là rút bớt
  reason?: string;
  type: 'payment' | 'withdrawal';
}

export interface Debt {
  id: string;
  name: string;
  source: string;
  totalAmount: number;
  amountPaid: number;
  dueDate: Date;
  createdAt: Date;
  targetMonth?: number; // 0-11
  targetYear?: number;
  transactions?: DebtTransaction[];
}

// --- 4. Mục tiêu & Ngày lễ ---

export interface Holiday {
  id: string;
  name: string;
  date: Date;
  isTakingOff: boolean;
  startDate?: string; // ISO string YYYY-MM-DD
  endDate?: string;   // ISO string YYYY-MM-DD
  note?: string;
}

export interface Aspiration {
  id: string;
  title: string;
  description?: string;
  type: 'financial' | 'non-financial';
  status: 'pending' | 'in-progress' | 'completed';
  createdAt: Date;
  targetAmount?: number;
  deadline?: Date;
  motivationLevel?: number;   // 1-10
  preparednessLevel?: number; // 1-10
  isPinned?: boolean;
}

// --- 5. Trợ lý mua sắm (Shopping Copilot) - [MỚI] ---

export type PurchaseCategory = 'long-term' | 'short-term' | 'experience';
export type UrgencyLevel = 'high' | 'medium' | 'low';
export type PaymentMethod = 'full' | 'installment';

export interface PurchaseScenario {
    name: string;
    price: number;
    category: PurchaseCategory;
    urgency: UrgencyLevel;
    method: PaymentMethod;
    installmentTerm?: number; 
    monthlyPayment?: number;  
}

export interface AnalysisResult {
    score: number; 
    verdict: 'approved' | 'consider' | 'rejected'; 
    riskLevel: 'low' | 'medium' | 'high' | 'critical';
    messages: string[]; 
    financialImpact: string; 
}

// --- 6. Cấu hình hệ thống & UI ---

export type FilterType = 'all' | 'week' | 'month' | 'year';

export interface FilterState {
  type: FilterType;
  year: number;
  month?: number; // 0-11
  week?: number;  // 1-53
}

export interface SeasonalTheme {
  greeting: string;
  background: string;
  primaryTextColor: string;
  secondaryTextColor: string;
  cardBg: string;
  accentColor: string;
  icon: React.ReactNode;
  decorations?: React.ReactNode;
}

// --- 7. Interface phụ (Legacy) ---
export interface Transaction {
    id: string;
    description: string;
    amount: number;
    date: Date;
    category: 'food' | 'misc' | 'fixed';
    isSelected: boolean;
}
