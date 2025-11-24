import { parse } from 'csv-parse/sync';

export interface YNABBudget {
  id: string;
  name: string;
  accounts?: YNABAccount[];
  transactions?: YNABTransaction[];
  categories?: YNABCategory[];
  category_groups?: YNABCategoryGroup[];
}

export interface YNABAccount {
  id: string;
  name: string;
  type: string;
  on_budget?: boolean;
  closed?: boolean;
  balance: number;
}

export interface YNABTransaction {
  id: string;
  date: string;
  amount: number;
  memo?: string;
  payee_name?: string;
  payee_id?: string;
  account_id: string;
  category_id?: string;
  category_name?: string;
  transfer_account_id?: string;
  deleted?: boolean;
}

export interface YNABCategoryGroup {
  id: string;
  name: string;
  hidden?: boolean;
  deleted?: boolean;
}

export interface YNABCategory {
  id: string;
  category_group_id: string;
  name: string;
  hidden?: boolean;
  budgeted?: number;
  deleted?: boolean;
}

export interface YNABCSVRow {
  Date: string;
  Payee: string;
  Category?: string;
  Memo?: string;
  Outflow?: string;
  Inflow?: string;
  Amount?: string;
}

export function parseYNABJSON(jsonData: any): YNABBudget {
  if (jsonData.data && jsonData.data.budget) {
    return jsonData.data.budget;
  }
  
  if (jsonData.budget) {
    return jsonData.budget;
  }
  
  return jsonData as YNABBudget;
}

export function parseYNABCSV(csvContent: string): YNABCSVRow[] {
  const records = parse(csvContent, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  });
  
  return records as YNABCSVRow[];
}

export function mapYNABAccountToLocal(ynabAccount: YNABAccount): {
  name: string;
  type: 'checking' | 'savings' | 'credit' | 'investment' | 'other';
  balance: string;
} {
  const name = ynabAccount.name;
  const balance = (ynabAccount.balance / 1000).toFixed(2);
  
  let type: 'checking' | 'savings' | 'credit' | 'investment' | 'other' = 'other';
  const typeLower = ynabAccount.type?.toLowerCase() || '';
  const nameLower = name.toLowerCase();
  
  if (typeLower.includes('checking') || nameLower.includes('checking') || typeLower === 'checking') {
    type = 'checking';
  } else if (typeLower.includes('savings') || nameLower.includes('savings') || typeLower === 'savings') {
    type = 'savings';
  } else if (typeLower.includes('credit') || nameLower.includes('credit') || typeLower === 'creditcard') {
    type = 'credit';
  } else if (typeLower.includes('invest') || nameLower.includes('invest') || typeLower === 'investmentaccount') {
    type = 'investment';
  }
  
  return { name, type, balance };
}

export function mapYNABTransactionToLocal(
  ynabTxn: YNABTransaction,
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
  return {
    accountId,
    userId,
    date: new Date(ynabTxn.date),
    payee: ynabTxn.payee_name || 'Unknown',
    amount: (ynabTxn.amount / 1000).toFixed(2),
    notes: ynabTxn.memo || null,
  };
}

export function mapYNABCategoryToLocal(
  ynabCategory: YNABCategory,
  userId: string
): {
  userId: string;
  name: string;
  budgeted: string;
} {
  return {
    userId,
    name: ynabCategory.name,
    budgeted: ynabCategory.budgeted ? (ynabCategory.budgeted / 1000).toFixed(2) : '0',
  };
}

export function mapYNABCSVRowToLocal(
  row: YNABCSVRow,
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
  let amount: number;
  if (row.Amount !== undefined) {
    amount = parseFloat(row.Amount.replace(/[^0-9.-]/g, ''));
  } else {
    const inflow = row.Inflow ? parseFloat(row.Inflow.replace(/[^0-9.-]/g, '')) : 0;
    const outflow = row.Outflow ? parseFloat(row.Outflow.replace(/[^0-9.-]/g, '')) : 0;
    amount = inflow - outflow;
  }
  
  return {
    accountId,
    userId,
    date: new Date(row.Date),
    payee: row.Payee || 'Unknown',
    amount: amount.toFixed(2),
    notes: row.Memo || null,
  };
}
