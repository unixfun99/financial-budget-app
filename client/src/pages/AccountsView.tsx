import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AccountCard } from "@/components/AccountCard";
import { TransactionsTable, type Transaction } from "@/components/TransactionsTable";
import { AccountForm } from "@/components/AccountForm";
import { Plus } from "lucide-react";
import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { Account, Transaction as DBTransaction } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

export default function AccountsView() {
  const [selectedAccount, setSelectedAccount] = useState<string | null>(null);
  const [showAccountForm, setShowAccountForm] = useState(false);
  const { toast } = useToast();

  const { data: accounts = [], isLoading: accountsLoading } = useQuery<Account[]>({
    queryKey: ['/api/accounts'],
  });

  const { data: allTransactions = [], isLoading: transactionsLoading } = useQuery<DBTransaction[]>({
    queryKey: ['/api/transactions'],
  });

  const deleteAccountMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest('DELETE', `/api/accounts/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/accounts'] });
      toast({
        title: "Account deleted",
        description: "The account has been successfully deleted.",
      });
      setSelectedAccount(null);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete account.",
        variant: "destructive",
      });
    },
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

  if (accountsLoading || transactionsLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading accounts...</p>
        </div>
      </div>
    );
  }

  const filteredTransactions = selectedAccount
    ? allTransactions.filter(t => t.accountId === selectedAccount)
    : allTransactions;

  const displayTransactions: Transaction[] = filteredTransactions.map(t => ({
    id: t.id,
    date: new Date(t.date).toISOString().split('T')[0],
    payee: t.payee,
    category: t.categoryId || '',
    account: t.accountId,
    amount: parseFloat(t.amount),
  }));

  const totalBalance = accounts.reduce((sum, acc) => sum + parseFloat(acc.balance), 0);

  const displayAccounts = accounts.map(acc => ({
    id: acc.id,
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
          <h1 className="text-3xl font-semibold">Accounts</h1>
          <p className="text-muted-foreground mt-1">Manage your accounts and view transactions</p>
        </div>
        <Button onClick={() => setShowAccountForm(true)} data-testid="button-add-account">
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
        {accounts.length === 0 ? (
          <Card className="p-12 text-center">
            <p className="text-muted-foreground mb-4">No accounts yet. Add your first account to get started!</p>
            <Button onClick={() => setShowAccountForm(true)} data-testid="button-add-first-account">
              <Plus className="h-4 w-4 mr-2" />
              Add Account
            </Button>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {displayAccounts.map((account) => (
              <div
                key={account.id}
                onClick={() => setSelectedAccount(account.id)}
                className="cursor-pointer"
              >
                <AccountCard {...account} />
              </div>
            ))}
          </div>
        )}
      </div>

      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">
            {selectedAccount ? `Account Transactions` : "All Transactions"}
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
        {filteredTransactions.length === 0 ? (
          <Card className="p-12 text-center">
            <p className="text-muted-foreground">No transactions found for this account.</p>
          </Card>
        ) : (
          <TransactionsTable
            transactions={displayTransactions}
            onEdit={(t) => console.log("Edit transaction:", t)}
            onDelete={(id) => deleteTransactionMutation.mutate(id)}
          />
        )}
      </div>

      <AccountForm
        open={showAccountForm}
        onClose={() => setShowAccountForm(false)}
      />
    </div>
  );
}
