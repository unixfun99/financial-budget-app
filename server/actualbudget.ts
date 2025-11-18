export interface ActualBudgetData {
  accounts?: ActualAccount[];
  transactions?: ActualTransaction[];
  categories?: ActualCategory[];
  payees?: ActualPayee[];
}

export interface ActualAccount {
  id: string;
  name: string;
  type?: string;
  offbudget?: boolean;
  closed?: boolean;
  balance?: number;
}

export interface ActualTransaction {
  id: string;
  date: string;
  amount: number;
  notes?: string;
  payee?: string;
  payee_name?: string;
  account: string;
  category?: string;
  transfer_id?: string;
}

export interface ActualCategory {
  id: string;
  name: string;
  is_income?: boolean;
  hidden?: boolean;
}

export interface ActualPayee {
  id: string;
  name: string;
}

export function parseActualBudgetJSON(jsonData: any): ActualBudgetData {
  if (jsonData.data) {
    return jsonData.data;
  }
  
  return jsonData as ActualBudgetData;
}

export function mapActualAccountToLocal(actualAccount: ActualAccount): {
  name: string;
  type: 'checking' | 'savings' | 'credit' | 'investment' | 'other';
  balance: string;
} {
  const name = actualAccount.name;
  const balance = actualAccount.balance 
    ? (actualAccount.balance / 100).toFixed(2) 
    : '0';
  
  let type: 'checking' | 'savings' | 'credit' | 'investment' | 'other' = 'other';
  const typeLower = actualAccount.type?.toLowerCase() || '';
  const nameLower = name.toLowerCase();
  
  if (typeLower.includes('checking') || nameLower.includes('checking')) {
    type = 'checking';
  } else if (typeLower.includes('savings') || nameLower.includes('savings')) {
    type = 'savings';
  } else if (typeLower.includes('credit') || nameLower.includes('credit')) {
    type = 'credit';
  } else if (typeLower.includes('invest') || nameLower.includes('invest')) {
    type = 'investment';
  }
  
  return { name, type, balance };
}

export function mapActualTransactionToLocal(
  actualTxn: ActualTransaction,
  accountId: string,
  userId: string
): {
  accountId: string;
  userId: string;
  date: Date;
  payee: string;
  amount: string;
  notes: string | null;
} {
  const payee = actualTxn.payee_name || actualTxn.payee || 'Unknown';
  
  return {
    accountId,
    userId,
    date: new Date(actualTxn.date),
    payee,
    amount: (actualTxn.amount / 100).toFixed(2),
    notes: actualTxn.notes || null,
  };
}

export function mapActualCategoryToLocal(
  actualCategory: ActualCategory,
  userId: string
): {
  userId: string;
  name: string;
  budgeted: string;
} {
  return {
    userId,
    name: actualCategory.name,
    budgeted: '0',
  };
}
