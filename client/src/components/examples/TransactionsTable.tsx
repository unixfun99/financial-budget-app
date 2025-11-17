import { TransactionsTable } from "../TransactionsTable";

const mockTransactions = [
  { id: "1", date: "2024-01-15", payee: "Whole Foods", category: "Groceries", account: "Checking", amount: -145.32 },
  { id: "2", date: "2024-01-14", payee: "Monthly Salary", category: "Income", account: "Checking", amount: 4500.00 },
  { id: "3", date: "2024-01-13", payee: "Electric Company", category: "Utilities", account: "Checking", amount: -89.50 },
];

export default function TransactionsTableExample() {
  return (
    <div className="p-6">
      <TransactionsTable
        transactions={mockTransactions}
        onEdit={(t) => console.log("Edit:", t)}
        onDelete={(id) => console.log("Delete:", id)}
      />
    </div>
  );
}
