import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Plus, Minus, ChevronRight, ChevronDown } from "lucide-react";
import { useState } from "react";

interface EnvelopeCategoryProps {
  name: string;
  budgeted: number;
  spent: number;
  available: number;
  onBudgetChange?: (amount: number) => void;
  onExpand?: () => void;
  isExpanded?: boolean;
}

export function EnvelopeCategory({
  name,
  budgeted,
  spent,
  available,
  onBudgetChange,
  onExpand,
  isExpanded = false,
}: EnvelopeCategoryProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [tempBudget, setTempBudget] = useState(budgeted.toString());

  const percentUsed = budgeted > 0 ? (spent / budgeted) * 100 : 0;
  const isOverBudget = spent > budgeted;

  const handleBudgetSave = () => {
    const newAmount = parseFloat(tempBudget) || 0;
    onBudgetChange?.(newAmount);
    setIsEditing(false);
  };

  const quickAdjust = (amount: number) => {
    const newBudget = budgeted + amount;
    setTempBudget(newBudget.toString());
    onBudgetChange?.(newBudget);
  };

  return (
    <Card data-testid={`card-envelope-${name.toLowerCase().replace(/\s+/g, "-")}`}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            {onExpand && (
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 shrink-0"
                onClick={onExpand}
                data-testid={`button-expand-${name.toLowerCase().replace(/\s+/g, "-")}`}
              >
                {isExpanded ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
              </Button>
            )}
            {!onExpand && <div className="w-6 shrink-0" />}
            <span className="font-medium truncate">{name}</span>
          </div>

          <div className="flex items-center gap-4 shrink-0">
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => quickAdjust(-100)}
                data-testid={`button-decrease-${name.toLowerCase().replace(/\s+/g, "-")}`}
              >
                <Minus className="h-3 w-3" />
              </Button>
              {isEditing ? (
                <Input
                  type="number"
                  value={tempBudget}
                  onChange={(e) => setTempBudget(e.target.value)}
                  onBlur={handleBudgetSave}
                  onKeyDown={(e) => e.key === "Enter" && handleBudgetSave()}
                  className="w-24 h-8 text-right font-mono"
                  data-testid={`input-budget-${name.toLowerCase().replace(/\s+/g, "-")}`}
                  autoFocus
                />
              ) : (
                <div
                  className="w-24 text-right font-mono font-semibold cursor-pointer"
                  onClick={() => setIsEditing(true)}
                  data-testid={`text-budgeted-${name.toLowerCase().replace(/\s+/g, "-")}`}
                >
                  ${budgeted.toFixed(0)}
                </div>
              )}
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => quickAdjust(100)}
                data-testid={`button-increase-${name.toLowerCase().replace(/\s+/g, "-")}`}
              >
                <Plus className="h-3 w-3" />
              </Button>
            </div>

            <div className="w-24 text-right">
              <div className="font-mono text-sm" data-testid={`text-spent-${name.toLowerCase().replace(/\s+/g, "-")}`}>
                ${spent.toFixed(0)}
              </div>
              <div className="w-full mt-1">
                <Progress
                  value={Math.min(percentUsed, 100)}
                  className="h-1.5"
                  data-testid={`progress-${name.toLowerCase().replace(/\s+/g, "-")}`}
                />
              </div>
            </div>

            <div
              className={`w-24 text-right font-mono font-semibold ${
                isOverBudget ? "text-destructive" : available > 0 ? "text-primary" : "text-muted-foreground"
              }`}
              data-testid={`text-available-${name.toLowerCase().replace(/\s+/g, "-")}`}
            >
              ${available.toFixed(0)}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
