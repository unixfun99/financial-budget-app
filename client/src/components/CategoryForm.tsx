import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState, useEffect } from "react";

interface CategoryFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave?: (category: { name: string; budgeted: number }) => void;
  initialCategory?: { name: string; budgeted: number } | null;
}

export function CategoryForm({ open, onOpenChange, onSave, initialCategory }: CategoryFormProps) {
  const [formData, setFormData] = useState({
    name: "",
    budgeted: "",
  });

  useEffect(() => {
    if (!open) return;
    
    if (initialCategory) {
      setFormData({
        name: initialCategory.name,
        budgeted: initialCategory.budgeted.toString(),
      });
    } else {
      setFormData({
        name: "",
        budgeted: "0",
      });
    }
  }, [open, initialCategory]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave?.({
      name: formData.name,
      budgeted: parseFloat(formData.budgeted) || 0,
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent data-testid="dialog-category-form">
        <DialogHeader>
          <DialogTitle>{initialCategory ? "Edit Category" : "Add Category"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="name">Category Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Enter category name"
              data-testid="input-category-name"
              required
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="budgeted">Budgeted Amount</Label>
            <Input
              id="budgeted"
              type="number"
              step="0.01"
              value={formData.budgeted}
              onChange={(e) => setFormData({ ...formData, budgeted: e.target.value })}
              placeholder="0.00"
              data-testid="input-category-budgeted"
              required
            />
          </div>
          <div className="flex gap-2 justify-end">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} data-testid="button-cancel">
              Cancel
            </Button>
            <Button type="submit" data-testid="button-save-category">
              {initialCategory ? "Update" : "Add"} Category
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
