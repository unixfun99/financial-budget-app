import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EnvelopeCategory } from "@/components/EnvelopeCategory";
import { CategoryForm } from "@/components/CategoryForm";
import { Plus } from "lucide-react";
import { useState } from "react";

//todo: remove mock functionality
const mockCategories = [
  { id: "1", name: "Groceries", budgeted: 500, spent: 423.50, available: 76.50, subcategories: [
    { id: "1-1", name: "Weekly Shopping", budgeted: 300, spent: 250, available: 50 },
    { id: "1-2", name: "Organic Produce", budgeted: 200, spent: 173.50, available: 26.50 },
  ]},
  { id: "2", name: "Dining Out", budgeted: 200, spent: 145.30, available: 54.70, subcategories: [
    { id: "2-1", name: "Restaurants", budgeted: 150, spent: 120, available: 30 },
    { id: "2-2", name: "Coffee Shops", budgeted: 50, spent: 25.30, available: 24.70 },
  ]},
  { id: "3", name: "Transportation", budgeted: 300, spent: 245.00, available: 55.00, subcategories: [
    { id: "3-1", name: "Gas", budgeted: 200, spent: 180, available: 20 },
    { id: "3-2", name: "Public Transit", budgeted: 100, spent: 65, available: 35 },
  ]},
  { id: "4", name: "Utilities", budgeted: 250, spent: 189.50, available: 60.50, subcategories: [] },
  { id: "5", name: "Entertainment", budgeted: 150, spent: 78.99, available: 71.01, subcategories: [] },
  { id: "6", name: "Healthcare", budgeted: 200, spent: 0, available: 200, subcategories: [] },
  { id: "7", name: "Savings Goal", budgeted: 1000, spent: 0, available: 1000, subcategories: [] },
];

export default function BudgetView() {
  const [categories, setCategories] = useState(mockCategories);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [showCategoryForm, setShowCategoryForm] = useState(false);

  const toggleExpand = (id: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedCategories(newExpanded);
  };

  const handleBudgetChange = (id: string, newAmount: number) => {
    setCategories(categories.map(cat => {
      if (cat.id === id) {
        return {
          ...cat,
          budgeted: newAmount,
          available: newAmount - cat.spent
        };
      }
      return cat;
    }));
  };

  const handleSubcategoryBudgetChange = (parentId: string, subcategoryId: string, newAmount: number) => {
    setCategories(categories.map(cat => {
      if (cat.id === parentId && cat.subcategories) {
        return {
          ...cat,
          subcategories: cat.subcategories.map((sub: any) => {
            if (sub.id === subcategoryId) {
              return {
                ...sub,
                budgeted: newAmount,
                available: newAmount - sub.spent
              };
            }
            return sub;
          })
        };
      }
      return cat;
    }));
  };

  const handleAddCategory = (categoryData: { name: string; budgeted: number; isSubcategory?: boolean; parentCategoryName?: string }) => {
    if (categoryData.isSubcategory) {
      // Add as subcategory
      setCategories(categories.map(cat => {
        if (cat.name === categoryData.parentCategoryName) {
          return {
            ...cat,
            subcategories: [
              ...(cat.subcategories || []),
              {
                id: Date.now().toString(),
                name: categoryData.name,
                budgeted: categoryData.budgeted,
                spent: 0,
                available: categoryData.budgeted,
              },
            ],
          };
        }
        return cat;
      }));
    } else {
      // Add as main category
      const newCategory = {
        id: Date.now().toString(),
        name: categoryData.name,
        budgeted: categoryData.budgeted,
        spent: 0,
        available: categoryData.budgeted,
        subcategories: [],
      };
      setCategories([...categories, newCategory]);
    }
  };

  const totalBudgeted = categories.reduce((sum, cat) => sum + cat.budgeted, 0);
  const totalSpent = categories.reduce((sum, cat) => sum + cat.spent, 0);
  const totalAvailable = categories.reduce((sum, cat) => sum + cat.available, 0);

  return (
    <div className="flex flex-col gap-6 p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold">Budget</h1>
          <p className="text-muted-foreground mt-1">Envelope-style budget management</p>
        </div>
        <Button onClick={() => setShowCategoryForm(true)} data-testid="button-add-category">
          <Plus className="h-4 w-4 mr-2" />
          Add Category
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Budgeted</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-mono font-semibold tracking-tight" data-testid="text-total-budgeted">
              ${totalBudgeted.toFixed(2)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Spent</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-mono font-semibold tracking-tight text-destructive" data-testid="text-total-spent">
              ${totalSpent.toFixed(2)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Available</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-mono font-semibold tracking-tight text-primary" data-testid="text-total-available">
              ${totalAvailable.toFixed(2)}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4 flex-1">
              <span className="font-medium w-48">Category</span>
            </div>
            <div className="flex items-center gap-4 shrink-0">
              <span className="w-40 text-center text-sm font-medium text-muted-foreground">Budgeted</span>
              <span className="w-24 text-center text-sm font-medium text-muted-foreground">Spent</span>
              <span className="w-24 text-right text-sm font-medium text-muted-foreground">Available</span>
            </div>
          </div>
        </CardHeader>
      </Card>

      <div className="flex flex-col gap-2">
        {categories.map((category) => (
          <div key={category.id} className="flex flex-col gap-2">
            <EnvelopeCategory
              {...category}
              isExpanded={expandedCategories.has(category.id)}
              onBudgetChange={(amount) => handleBudgetChange(category.id, amount)}
              onExpand={() => toggleExpand(category.id)}
            />
            {expandedCategories.has(category.id) && category.subcategories && category.subcategories.length > 0 && (
              <div className="ml-12 flex flex-col gap-2">
                {category.subcategories.map((sub: any) => (
                  <EnvelopeCategory
                    key={sub.id}
                    {...sub}
                    onBudgetChange={(amount) => handleSubcategoryBudgetChange(category.id, sub.id, amount)}
                  />
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      <CategoryForm
        open={showCategoryForm}
        onOpenChange={setShowCategoryForm}
        onSave={handleAddCategory}
        parentCategories={categories.map(cat => ({ id: cat.id, name: cat.name }))}
      />
    </div>
  );
}
