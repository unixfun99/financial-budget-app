import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AccountCard } from "@/components/AccountCard";
import { TransactionsTable, type Transaction } from "@/components/TransactionsTable";
import { TransactionForm } from "@/components/TransactionForm";
import { ImportCSV } from "@/components/ImportCSV";
import { Plus, Upload, TrendingUp, TrendingDown, DollarSign } from "lucide-react";
import { useState } from "react";

//todo: remove mock functionality
const mockAccounts = [
  { name: "Checking", type: "Checking", balance: 5234.50, change: 123.45, changePercent: 2.4 },
  { name: "Savings", type: "Savings", balance: 12890.00, change: -45.20, changePercent: -0.35 },
  { name: "Credit Card", type: "Credit", balance: -890.25, change: -120.00, changePercent: 15.6 },
];

//todo: remove mock functionality
const mockTransactions: Transaction[] = [
  { id: "1", date: "2024-01-15", payee: "Whole Foods", category: "Groceries", account: "Checking", amount: -145.32 },
  { id: "2", date: "2024-01-14", payee: "Monthly Salary", category: "Income", account: "Checking", amount: 4500.00 },
  { id: "3", date: "2024-01-13", payee: "Electric Company", category: "Utilities", account: "Checking", amount: -89.50 },
  { id: "4", date: "2024-01-12", payee: "Netflix", category: "Entertainment", account: "Credit Card", amount: -15.99 },
  { id: "5", date: "2024-01-11", payee: "Gas Station", category: "Transportation", account: "Credit Card", amount: -45.00 },
];

export default function Dashboard() {
  const [showTransactionForm, setShowTransactionForm] = useState(false);
  const [showImportCSV, setShowImportCSV] = useState(false);
  const [transactions, setTransactions] = useState<Transaction[]>(mockTransactions);

  const handleAddTransaction = (transaction: any) => {
    const newTransaction: Transaction = {
      id: Date.now().toString(),
      ...transaction,
    };
    setTransactions([newTransaction, ...transactions]);
    console.log("Transaction added:", newTransaction);
  };

  const handleDeleteTransaction = (id: string) => {
    setTransactions(transactions.filter(t => t.id !== id));
    console.log("Transaction deleted:", id);
  };

  const handleEditTransaction = (transaction: Transaction) => {
    console.log("Edit transaction:", transaction);
  };

  const handleImport = (file: File) => {
    console.log("Import CSV:", file.name);
  };

  const totalBalance = mockAccounts.reduce((sum, acc) => sum + acc.balance, 0);
  const totalIncome = transactions.filter(t => t.amount > 0).reduce((sum, t) => sum + t.amount, 0);
  const totalExpenses = transactions.filter(t => t.amount < 0).reduce((sum, t) => sum + Math.abs(t.amount), 0);

  return (
    <div className="flex flex-col gap-6 p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold">Dashboard</h1>
          <p className="text-muted-foreground mt-1">Overview of your financial health</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setShowImportCSV(true)}
            data-testid="button-import"
          >
            <Upload className="h-4 w-4 mr-2" />
            Import
          </Button>
          <Button
            onClick={() => setShowTransactionForm(true)}
            data-testid="button-add-transaction"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Transaction
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Balance</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-mono font-semibold tracking-tight" data-testid="text-total-balance">
              ${totalBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Across all accounts</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Income This Month</CardTitle>
            <TrendingUp className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-mono font-semibold tracking-tight text-primary" data-testid="text-total-income">
              +${totalIncome.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-muted-foreground mt-1">January 2024</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Expenses This Month</CardTitle>
            <TrendingDown className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-mono font-semibold tracking-tight text-destructive" data-testid="text-total-expenses">
              -${totalExpenses.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-muted-foreground mt-1">January 2024</p>
          </CardContent>
        </Card>
      </div>

      <div>
        <h2 className="text-xl font-semibold mb-4">Accounts</h2>
        <div className="grid gap-4 md:grid-cols-3">
          {mockAccounts.map((account) => (
            <AccountCard key={account.name} {...account} />
          ))}
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Recent Transactions</h2>
        </div>
        <TransactionsTable
          transactions={transactions.slice(0, 10)}
          onEdit={handleEditTransaction}
          onDelete={handleDeleteTransaction}
        />
      </div>

      <TransactionForm
        open={showTransactionForm}
        onClose={() => setShowTransactionForm(false)}
        onSave={handleAddTransaction}
      />

      <ImportCSV
        open={showImportCSV}
        onClose={() => setShowImportCSV(false)}
        onImport={handleImport}
      />
    </div>
  );
}
