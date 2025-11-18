import { encrypt, decrypt } from './crypto';

export interface SimplefinAccount {
  id: string;
  name: string;
  currency: string;
  balance: string;
  'available-balance'?: string;
  'balance-date': number;
  transactions: SimplefinTransaction[];
}

export interface SimplefinTransaction {
  id: string;
  posted: number;
  amount: string;
  description: string;
  pending?: boolean;
  extra?: {
    category?: string;
    [key: string]: any;
  };
}

export interface SimplefinAccountSet {
  accounts: SimplefinAccount[];
}

const ALLOWED_SIMPLEFIN_HOSTS = [
  'bridge.simplefin.org',
  'beta-bridge.simplefin.org',
];

function validateSimplefinClaimUrl(url: string): void {
  let parsedUrl: URL;
  try {
    parsedUrl = new URL(url);
  } catch (error) {
    console.error('[SimpleFIN] Invalid URL format in setup token:', error);
    throw new Error('Invalid setup token format');
  }
  
  if (parsedUrl.protocol !== 'https:') {
    console.warn('[SimpleFIN] Rejected non-HTTPS claim URL:', parsedUrl.protocol);
    throw new Error('Setup token must use HTTPS');
  }
  
  if (!ALLOWED_SIMPLEFIN_HOSTS.includes(parsedUrl.hostname)) {
    console.warn('[SimpleFIN] Rejected unauthorized host:', parsedUrl.hostname);
    throw new Error('Setup token host not authorized');
  }
  
  if (!parsedUrl.pathname.includes('/simplefin')) {
    console.warn('[SimpleFIN] Rejected invalid path:', parsedUrl.pathname);
    throw new Error('Setup token path invalid');
  }
}

export async function claimSetupToken(setupToken: string): Promise<string> {
  let claimUrl: string;
  try {
    claimUrl = Buffer.from(setupToken, 'base64').toString('utf-8');
  } catch (error) {
    console.error('[SimpleFIN] Failed to decode setup token:', error);
    throw new Error('Invalid setup token encoding');
  }
  
  validateSimplefinClaimUrl(claimUrl);
  
  const response = await fetch(claimUrl, {
    method: 'POST',
  });
  
  if (!response.ok) {
    console.error('[SimpleFIN] Failed to claim token:', response.status, response.statusText);
    throw new Error(`Failed to claim setup token: ${response.statusText}`);
  }
  
  const accessUrl = await response.text();
  
  return encrypt(accessUrl);
}

export function parseAccessUrl(encryptedAccessUrl: string): {
  baseUrl: string;
  username: string;
  password: string;
} {
  const accessUrl = decrypt(encryptedAccessUrl);
  
  const match = accessUrl.match(/^https?:\/\/([^:]+):([^@]+)@(.+)$/);
  if (!match) {
    throw new Error('Invalid access URL format');
  }
  
  const [, username, password, rest] = match;
  const baseUrl = `https://${rest}`;
  
  return { baseUrl, username, password };
}

export async function fetchAccounts(
  encryptedAccessUrl: string,
  startDate?: Date,
  endDate?: Date
): Promise<SimplefinAccountSet> {
  const { baseUrl, username, password } = parseAccessUrl(encryptedAccessUrl);
  
  let url = `${baseUrl}/accounts`;
  const params = new URLSearchParams();
  
  if (startDate) {
    params.append('start-date', Math.floor(startDate.getTime() / 1000).toString());
  }
  if (endDate) {
    params.append('end-date', Math.floor(endDate.getTime() / 1000).toString());
  }
  
  if (params.toString()) {
    url += `?${params.toString()}`;
  }
  
  const response = await fetch(url, {
    headers: {
      'Authorization': 'Basic ' + Buffer.from(`${username}:${password}`).toString('base64'),
    },
  });
  
  if (!response.ok) {
    throw new Error(`SimpleFIN API error: ${response.statusText}`);
  }
  
  return await response.json();
}

export function mapSimplefinAccountToLocal(sfAccount: SimplefinAccount): {
  name: string;
  type: 'checking' | 'savings' | 'credit' | 'investment' | 'other';
  balance: string;
} {
  const name = sfAccount.name;
  const balance = sfAccount.balance;
  
  let type: 'checking' | 'savings' | 'credit' | 'investment' | 'other' = 'other';
  const nameLower = name.toLowerCase();
  
  if (nameLower.includes('checking') || nameLower.includes('chequing')) {
    type = 'checking';
  } else if (nameLower.includes('savings') || nameLower.includes('save')) {
    type = 'savings';
  } else if (nameLower.includes('credit') || nameLower.includes('card')) {
    type = 'credit';
  } else if (nameLower.includes('investment') || nameLower.includes('brokerage') || nameLower.includes('401k') || nameLower.includes('ira')) {
    type = 'investment';
  }
  
  return { name, type, balance };
}

export function mapSimplefinTransactionToLocal(sfTxn: SimplefinTransaction, accountId: string, userId: string): {
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
    date: new Date(sfTxn.posted * 1000),
    payee: sfTxn.description || 'Unknown',
    amount: sfTxn.amount,
    notes: sfTxn.extra?.category || null,
  };
}
