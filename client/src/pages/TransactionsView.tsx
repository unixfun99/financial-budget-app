import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TransactionsTable, type Transaction } from "@/components/TransactionsTable";
import { TransactionForm } from "@/components/TransactionForm";
import { ImportCSV } from "@/components/ImportCSV";
import { Plus, Upload, Search } from "lucide-react";
import { useState } from "react";

//todo: remove mock functionality
const mockTransactions: Transaction[] = [
  { id: "1", date: "2024-01-15", payee: "Whole Foods", category: "Groceries", account: "Checking", amount: -145.32 },
  { id: "2", date: "2024-01-14", payee: "Monthly Salary", category: "Income", account: "Checking", amount: 4500.00 },
  { id: "3", date: "2024-01-13", payee: "Electric Company", category: "Utilities", account: "Checking", amount: -89.50 },
  { id: "4", date: "2024-01-12", payee: "Netflix", category: "Entertainment", account: "Credit Card", amount: -15.99 },
  { id: "5", date: "2024-01-11", payee: "Gas Station", category: "Transportation", account: "Credit Card", amount: -45.00 },
  { id: "6", date: "2024-01-10", payee: "Target", category: "Shopping", account: "Credit Card", amount: -89.99 },
  { id: "7", date: "2024-01-09", payee: "Starbucks", category: "Dining Out", account: "Checking", amount: -12.50 },
  { id: "8", date: "2024-01-08", payee: "Transfer to Savings", category: "Transfer", account: "Savings", amount: 500.00 },
  { id: "9", date: "2024-01-07", payee: "Gym Membership", category: "Healthcare", account: "Checking", amount: -45.00 },
  { id: "10", date: "2024-01-06", payee: "Amazon", category: "Shopping", account: "Credit Card", amount: -124.99 },
];

export default function TransactionsView() {
  const [showTransactionForm, setShowTransactionForm] = useState(false);
  const [showImportCSV, setShowImportCSV] = useState(false);
  const [transactions, setTransactions] = useState<Transaction[]>(mockTransactions);
  const [searchQuery, setSearchQuery] = useState("");
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);

  const filteredTransactions = transactions.filter(t =>
    t.payee.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSaveTransaction = (transaction: any) => {
    if (transaction.id) {
      // Update existing transaction
      setTransactions(transactions.map(t => 
        t.id === transaction.id ? { ...transaction, amount: transaction.amount } : t
      ));
    } else {
      // Create new transaction
      const newTransaction: Transaction = {
        id: Date.now().toString(),
        ...transaction,
      };
      setTransactions([newTransaction, ...transactions]);
    }
  };

  const handleEditTransaction = (transaction: Transaction) => {
    // Set the transaction first, then open the form to avoid race condition
    setEditingTransaction(transaction);
    // Use setTimeout to ensure state update completes before opening dialog
    setTimeout(() => setShowTransactionForm(true), 0);
  };

  const handleDeleteTransaction = (id: string) => {
    setTransactions(transactions.filter(t => t.id !== id));
  };

  return (
    <div className="flex flex-col gap-6 p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold">Transactions</h1>
          <p className="text-muted-foreground mt-1">View and manage all your transactions</p>
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

      <Card className="p-4">
        <div className="flex items-center gap-2">
          <Search className="h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search transactions..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="border-0 focus-visible:ring-0"
            data-testid="input-search"
          />
        </div>
      </Card>

      <TransactionsTable
        transactions={filteredTransactions}
        onEdit={handleEditTransaction}
        onDelete={handleDeleteTransaction}
      />

      <TransactionForm
        open={showTransactionForm}
        onClose={() => {
          setShowTransactionForm(false);
          setEditingTransaction(null);
        }}
        initialTransaction={editingTransaction}
        onSave={handleSaveTransaction}
      />

      <ImportCSV
        open={showImportCSV}
        onClose={() => setShowImportCSV(false)}
        onImport={(file) => console.log("Import CSV:", file.name)}
      />
    </div>
  );
}
