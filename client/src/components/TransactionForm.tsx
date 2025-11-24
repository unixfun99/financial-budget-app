import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useState, useEffect } from "react";

interface TransactionFormProps {
  open: boolean;
  onClose: () => void;
  onSave?: (transaction: any) => void;
  initialTransaction?: any | null;
}

export function TransactionForm({ open, onClose, onSave, initialTransaction }: TransactionFormProps) {
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    payee: "",
    category: "",
    account: "",
    amount: "",
    notes: "",
  });

  useEffect(() => {
    // Only reset form data when dialog first opens
    if (!open) return;
    
    if (initialTransaction) {
      // Map display values to form values
      const categoryMap: Record<string, string> = {
        'Groceries': 'groceries',
        'Dining Out': 'dining',
        'Transportation': 'transportation',
        'Utilities': 'utilities',
        'Entertainment': 'entertainment',
        'Income': 'income',
        'Healthcare': 'healthcare',
        'Shopping': 'shopping',
        'Transfer': 'transfer',
      };
      
      const accountMap: Record<string, string> = {
        'Checking': 'checking',
        'Checking Account': 'checking',
        'Savings': 'savings',
        'Savings Account': 'savings',
        'Credit Card': 'credit',
      };

      setFormData({
        date: initialTransaction.date || new Date().toISOString().split('T')[0],
        payee: initialTransaction.payee || "",
        category: categoryMap[initialTransaction.category] || "",
        account: accountMap[initialTransaction.account] || "",
        amount: Math.abs(initialTransaction.amount || 0).toString(),
        notes: initialTransaction.notes || "",
      });
    } else {
      // Only reset to empty if we're creating a new transaction (not editing)
      setFormData({
        date: new Date().toISOString().split('T')[0],
        payee: "",
        category: "",
        account: "",
        amount: "",
        notes: "",
      });
    }
  }, [open, initialTransaction]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave?.({
      ...(initialTransaction && { id: initialTransaction.id }),
      ...formData,
      amount: parseFloat(formData.amount),
    });
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{initialTransaction ? "Edit Transaction" : "Add Transaction"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="date">Date</Label>
              <Input
                id="date"
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                data-testid="input-date"
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="payee">Payee</Label>
              <Input
                id="payee"
                placeholder="Enter payee name"
                value={formData.payee}
                onChange={(e) => setFormData({ ...formData, payee: e.target.value })}
                data-testid="input-payee"
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="category">Category</Label>
              <Select
                value={formData.category}
                onValueChange={(value) => setFormData({ ...formData, category: value })}
                required
              >
                <SelectTrigger data-testid="select-category">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="groceries">Groceries</SelectItem>
                  <SelectItem value="dining">Dining Out</SelectItem>
                  <SelectItem value="transportation">Transportation</SelectItem>
                  <SelectItem value="utilities">Utilities</SelectItem>
                  <SelectItem value="entertainment">Entertainment</SelectItem>
                  <SelectItem value="income">Income</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="account">Account</Label>
              <Select
                value={formData.account}
                onValueChange={(value) => setFormData({ ...formData, account: value })}
                required
              >
                <SelectTrigger data-testid="select-account">
                  <SelectValue placeholder="Select account" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="checking">Checking Account</SelectItem>
                  <SelectItem value="savings">Savings Account</SelectItem>
                  <SelectItem value="credit">Credit Card</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="amount">Amount</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                placeholder="0.00"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                data-testid="input-amount"
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="notes">Notes (Optional)</Label>
              <Textarea
                id="notes"
                placeholder="Add notes..."
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                data-testid="input-notes"
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} data-testid="button-cancel">
              Cancel
            </Button>
            <Button type="submit" data-testid="button-save">
              Save Transaction
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
