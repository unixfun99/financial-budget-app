import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AccountCard } from "@/components/AccountCard";
import { TransactionsTable, type Transaction } from "@/components/TransactionsTable";
import { TransactionForm } from "@/components/TransactionForm";
import { AccountForm } from "@/components/AccountForm";
import { ImportCSV } from "@/components/ImportCSV";
import { Plus, Upload, TrendingUp, TrendingDown, DollarSign } from "lucide-react";
import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { Account, Transaction as DBTransaction } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

export default function Dashboard() {
  const [showTransactionForm, setShowTransactionForm] = useState(false);
  const [showImportCSV, setShowImportCSV] = useState(false);
  const [showAddAccount, setShowAddAccount] = useState(false);
  const { toast } = useToast();

  const { data: accounts = [], isLoading: accountsLoading } = useQuery<Account[]>({
    queryKey: ['/api/accounts'],
  });

  const { data: transactions = [], isLoading: transactionsLoading } = useQuery<DBTransaction[]>({
    queryKey: ['/api/transactions'],
  });

  const deleteTransactionMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest('DELETE', `/api/transactions/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/transactions'] });
      toast({
        title: "Transaction deleted",
        description: "The transaction has been successfully deleted.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete transaction.",
        variant: "destructive",
      });
    },
  });

  const handleDeleteTransaction = (id: string) => {
    deleteTransactionMutation.mutate(id);
  };

  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);

  const handleEditTransaction = (transaction: Transaction) => {
    // Set the transaction first, then open the form to avoid race condition
    setEditingTransaction(transaction);
    // Use setTimeout to ensure state update completes before opening dialog
    setTimeout(() => setShowTransactionForm(true), 0);
  };

  const handleImport = (file: File) => {
    console.log("Import CSV:", file.name);
  };

  if (accountsLoading || transactionsLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  const totalBalance = accounts.reduce((sum, acc) => sum + parseFloat(acc.balance), 0);
  const totalIncome = transactions.filter(t => parseFloat(t.amount) > 0).reduce((sum, t) => sum + parseFloat(t.amount), 0);
  const totalExpenses = transactions.filter(t => parseFloat(t.amount) < 0).reduce((sum, t) => sum + Math.abs(parseFloat(t.amount)), 0);

  const displayTransactions: Transaction[] = transactions.slice(0, 5).map(t => ({
    id: t.id,
    date: new Date(t.date).toISOString().split('T')[0],
    payee: t.payee,
    category: t.categoryId || '',
    account: t.accountId,
    amount: parseFloat(t.amount),
  }));

  const displayAccounts = accounts.slice(0, 3).map(acc => ({
    name: acc.name,
    type: acc.type.charAt(0).toUpperCase() + acc.type.slice(1),
    balance: parseFloat(acc.balance),
    change: 0,
    changePercent: 0,
  }));

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
            <p className="text-xs text-muted-foreground mt-1">This month</p>
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
            <p className="text-xs text-muted-foreground mt-1">This month</p>
          </CardContent>
        </Card>
      </div>

      <div>
        <h2 className="text-xl font-semibold mb-4">Accounts</h2>
        {accounts.length === 0 ? (
          <Card className="p-12 text-center">
            <p className="text-muted-foreground mb-4">No accounts yet. Add your first account to get started!</p>
            <Button onClick={() => setShowAddAccount(true)} data-testid="button-add-account">
              <Plus className="h-4 w-4 mr-2" />
              Add Account
            </Button>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-3">
            {displayAccounts.map((account) => (
              <AccountCard key={account.name} {...account} />
            ))}
          </div>
        )}
      </div>

      <div>
        <h2 className="text-xl font-semibold mb-4">Recent Transactions</h2>
        {transactions.length === 0 ? (
          <Card className="p-12 text-center">
            <p className="text-muted-foreground mb-4">No transactions yet. Add your first transaction to start tracking!</p>
            <Button onClick={() => setShowTransactionForm(true)} data-testid="button-add-first-transaction">
              <Plus className="h-4 w-4 mr-2" />
              Add Transaction
            </Button>
          </Card>
        ) : (
          <TransactionsTable
            transactions={displayTransactions}
            onEdit={handleEditTransaction}
            onDelete={handleDeleteTransaction}
          />
        )}
      </div>

      <AccountForm
        open={showAddAccount}
        onClose={() => setShowAddAccount(false)}
      />

      <TransactionForm
        open={showTransactionForm}
        onClose={() => {
          setShowTransactionForm(false);
          setEditingTransaction(null);
        }}
        initialTransaction={editingTransaction}
        onSave={(data) => {
          if (data.id) {
            toast({
              title: "Transaction updated",
              description: "The transaction has been updated successfully.",
            });
          } else {
            toast({
              title: "Transaction created",
              description: "The transaction has been created successfully.",
            });
          }
          setShowTransactionForm(false);
          setEditingTransaction(null);
        }}
      />

      <ImportCSV
        open={showImportCSV}
        onClose={() => setShowImportCSV(false)}
        onImport={handleImport}
      />
    </div>
  );
}
