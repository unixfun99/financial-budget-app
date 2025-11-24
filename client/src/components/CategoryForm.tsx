import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState, useEffect } from "react";

interface CategoryFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave?: (category: { name: string; budgeted: number; isSubcategory?: boolean; parentCategoryName?: string }) => void;
  initialCategory?: { name: string; budgeted: number } | null;
  parentCategories?: Array<{ id: string; name: string }>;
}

export function CategoryForm({ open, onOpenChange, onSave, initialCategory, parentCategories = [] }: CategoryFormProps) {
  const [tab, setTab] = useState("parent");
  const [formData, setFormData] = useState({
    name: "",
    budgeted: "",
    parentCategory: "",
  });

  useEffect(() => {
    if (!open) return;
    
    if (initialCategory) {
      setFormData({
        name: initialCategory.name,
        budgeted: initialCategory.budgeted.toString(),
        parentCategory: "",
      });
    } else {
      setFormData({
        name: "",
        budgeted: "0",
        parentCategory: "",
      });
    }
    setTab("parent");
  }, [open, initialCategory]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parentCat = parentCategories.find(cat => cat.id === formData.parentCategory);
    onSave?.({
      name: formData.name,
      budgeted: parseFloat(formData.budgeted) || 0,
      isSubcategory: tab === "sub",
      parentCategoryName: parentCat?.name,
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent data-testid="dialog-category-form">
        <DialogHeader>
          <DialogTitle>{initialCategory ? "Edit Category" : "Add Category"}</DialogTitle>
        </DialogHeader>
        <Tabs value={tab} onValueChange={setTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="parent">Main Category</TabsTrigger>
            <TabsTrigger value="sub">Sub-Category</TabsTrigger>
          </TabsList>
          <TabsContent value="parent">
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="name">Category Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Groceries"
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
                  Add Category
                </Button>
              </div>
            </form>
          </TabsContent>
          <TabsContent value="sub">
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="parent">Parent Category</Label>
                <select
                  id="parent"
                  value={formData.parentCategory}
                  onChange={(e) => setFormData({ ...formData, parentCategory: e.target.value })}
                  className="w-full px-3 py-2 border border-input rounded-md bg-background"
                  data-testid="select-parent-category"
                  required
                >
                  <option value="">Select parent category</option>
                  {parentCategories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="sub-name">Sub-Category Name</Label>
                <Input
                  id="sub-name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Weekly Shopping"
                  data-testid="input-subcategory-name"
                  required
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="sub-budgeted">Budgeted Amount</Label>
                <Input
                  id="sub-budgeted"
                  type="number"
                  step="0.01"
                  value={formData.budgeted}
                  onChange={(e) => setFormData({ ...formData, budgeted: e.target.value })}
                  placeholder="0.00"
                  data-testid="input-subcategory-budgeted"
                  required
                />
              </div>
              <div className="flex gap-2 justify-end">
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)} data-testid="button-cancel">
                  Cancel
                </Button>
                <Button type="submit" data-testid="button-save-subcategory">
                  Add Sub-Category
                </Button>
              </div>
            </form>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
