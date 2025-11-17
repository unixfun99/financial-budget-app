import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown } from "lucide-react";

interface AccountCardProps {
  name: string;
  type: string;
  balance: number;
  change?: number;
  changePercent?: number;
}

export function AccountCard({ name, type, balance, change, changePercent }: AccountCardProps) {
  const isPositive = (change || 0) >= 0;

  return (
    <Card className="hover-elevate" data-testid={`card-account-${name.toLowerCase().replace(/\s+/g, "-")}`}>
      <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
        <CardTitle className="text-base font-medium">{name}</CardTitle>
        <Badge variant="secondary" className="text-xs">
          {type}
        </Badge>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-1">
          <div className="text-2xl font-mono font-semibold tracking-tight" data-testid={`text-balance-${name.toLowerCase().replace(/\s+/g, "-")}`}>
            ${balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          {change !== undefined && (
            <div className="flex items-center gap-1 text-sm">
              {isPositive ? (
                <TrendingUp className="h-4 w-4 text-primary" />
              ) : (
                <TrendingDown className="h-4 w-4 text-destructive" />
              )}
              <span className={isPositive ? "text-primary" : "text-destructive"}>
                {isPositive ? "+" : ""}${Math.abs(change).toFixed(2)}
              </span>
              <span className="text-muted-foreground">
                ({changePercent?.toFixed(1)}%)
              </span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
