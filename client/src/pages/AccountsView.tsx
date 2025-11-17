import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AccountCard } from "@/components/AccountCard";
import { TransactionsTable, type Transaction } from "@/components/TransactionsTable";
import { Plus } from "lucide-react";
import { useState } from "react";

//todo: remove mock functionality
const mockAccounts = [
  { name: "Checking Account", type: "Checking", balance: 5234.50, change: 123.45, changePercent: 2.4 },
  { name: "Savings Account", type: "Savings", balance: 12890.00, change: -45.20, changePercent: -0.35 },
  { name: "Emergency Fund", type: "Savings", balance: 8500.00, change: 250.00, changePercent: 3.03 },
  { name: "Credit Card", type: "Credit", balance: -890.25, change: -120.00, changePercent: 15.6 },
  { name: "Investment Account", type: "Investment", balance: 25340.75, change: 1234.50, changePercent: 5.12 },
];

//todo: remove mock functionality
const mockTransactions: Transaction[] = [
  { id: "1", date: "2024-01-15", payee: "Whole Foods", category: "Groceries", account: "Checking Account", amount: -145.32 },
  { id: "2", date: "2024-01-14", payee: "Monthly Salary", category: "Income", account: "Checking Account", amount: 4500.00 },
  { id: "3", date: "2024-01-13", payee: "Electric Company", category: "Utilities", account: "Checking Account", amount: -89.50 },
  { id: "4", date: "2024-01-12", payee: "Transfer to Savings", category: "Transfer", account: "Savings Account", amount: 500.00 },
  { id: "5", date: "2024-01-11", payee: "Amazon", category: "Shopping", account: "Credit Card", amount: -234.99 },
];

export default function AccountsView() {
  const [selectedAccount, setSelectedAccount] = useState<string | null>(null);

  const filteredTransactions = selectedAccount
    ? mockTransactions.filter(t => t.account === selectedAccount)
    : mockTransactions;

  const totalBalance = mockAccounts.reduce((sum, acc) => sum + acc.balance, 0);

  return (
    <div className="flex flex-col gap-6 p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold">Accounts</h1>
          <p className="text-muted-foreground mt-1">Manage your accounts and view transactions</p>
        </div>
        <Button data-testid="button-add-account">
          <Plus className="h-4 w-4 mr-2" />
          Add Account
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Net Worth</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-mono font-semibold tracking-tight" data-testid="text-net-worth">
            ${totalBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </div>
          <p className="text-xs text-muted-foreground mt-1">Total across all accounts</p>
        </CardContent>
      </Card>

      <div>
        <h2 className="text-xl font-semibold mb-4">Your Accounts</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {mockAccounts.map((account) => (
            <div
              key={account.name}
              onClick={() => setSelectedAccount(account.name)}
              className="cursor-pointer"
            >
              <AccountCard {...account} />
            </div>
          ))}
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">
            {selectedAccount ? `${selectedAccount} Transactions` : "All Transactions"}
          </h2>
          {selectedAccount && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSelectedAccount(null)}
              data-testid="button-clear-filter"
            >
              Clear Filter
            </Button>
          )}
        </div>
        <TransactionsTable
          transactions={filteredTransactions}
          onEdit={(t) => console.log("Edit transaction:", t)}
          onDelete={(id) => console.log("Delete transaction:", id)}
        />
      </div>
    </div>
  );
}
