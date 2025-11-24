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
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface AccountFormProps {
  open: boolean;
  onClose: () => void;
}

export function AccountForm({ open, onClose }: AccountFormProps) {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    name: "",
    type: "checking" as "checking" | "savings" | "credit" | "investment" | "other",
    balance: "0",
    connectionType: "none" as "none" | "simplefin" | "plaid",
  });

  const createAccountMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const res = await apiRequest("POST", "/api/accounts", data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/accounts'] });
      toast({
        title: "Account created",
        description: "Your account has been successfully created.",
      });
      onClose();
      setFormData({
        name: "",
        type: "checking",
        balance: "0",
        connectionType: "none",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create account.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createAccountMutation.mutate(formData);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Add Account</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Account Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Checking Account"
                data-testid="input-account-name"
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="type">Account Type</Label>
              <Select
                value={formData.type}
                onValueChange={(value: any) => setFormData({ ...formData, type: value })}
              >
                <SelectTrigger id="type" data-testid="select-account-type">
                  <SelectValue placeholder="Select account type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="checking">Checking</SelectItem>
                  <SelectItem value="savings">Savings</SelectItem>
                  <SelectItem value="credit">Credit Card</SelectItem>
                  <SelectItem value="investment">Investment</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="balance">Initial Balance</Label>
              <Input
                id="balance"
                type="number"
                step="0.01"
                value={formData.balance}
                onChange={(e) => setFormData({ ...formData, balance: e.target.value })}
                placeholder="0.00"
                data-testid="input-balance"
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="connection">Bank Connection</Label>
              <Select
                value={formData.connectionType}
                onValueChange={(value: any) => setFormData({ ...formData, connectionType: value })}
              >
                <SelectTrigger id="connection" data-testid="select-connection-type">
                  <SelectValue placeholder="Select connection type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Manual Account (No Connection)</SelectItem>
                  <SelectItem value="simplefin">SimpleFIN Bank Sync</SelectItem>
                  <SelectItem value="plaid">Plaid Bank Sync</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {formData.connectionType !== "none" && (
              <div className="p-3 bg-muted rounded-md text-sm">
                <p className="text-muted-foreground">
                  {formData.connectionType === "simplefin" 
                    ? "SimpleFIN will sync your transactions automatically. Setup available in Import & Sync page."
                    : "Plaid will connect your bank account securely. Setup available in Import & Sync page."
                  }
                </p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} data-testid="button-cancel">
              Cancel
            </Button>
            <Button type="submit" disabled={createAccountMutation.isPending} data-testid="button-save">
              {createAccountMutation.isPending ? "Creating..." : "Create Account"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
