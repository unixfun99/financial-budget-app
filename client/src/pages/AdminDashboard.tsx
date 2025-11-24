import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Eye, TrendingUp, TrendingDown, Users } from "lucide-react";
import { useState } from "react";

//todo: remove mock functionality
const mockClients = [
  {
    id: "1",
    name: "John Smith",
    email: "john.smith@example.com",
    budgetHealth: 85,
    netWorth: 45230.50,
    change: 1234.50,
    lastActive: "2024-01-15",
    sharedAccess: true,
  },
  {
    id: "2",
    name: "Sarah Johnson",
    email: "sarah.j@example.com",
    budgetHealth: 72,
    netWorth: 32890.00,
    change: -456.20,
    lastActive: "2024-01-14",
    sharedAccess: true,
  },
  {
    id: "3",
    name: "Michael Chen",
    email: "m.chen@example.com",
    budgetHealth: 91,
    netWorth: 78340.25,
    change: 2345.75,
    lastActive: "2024-01-15",
    sharedAccess: true,
  },
  {
    id: "4",
    name: "Emily Davis",
    email: "emily.d@example.com",
    budgetHealth: 65,
    netWorth: 18750.00,
    change: -123.45,
    lastActive: "2024-01-13",
    sharedAccess: false,
  },
];

export default function AdminDashboard() {
  const [selectedClient, setSelectedClient] = useState<string | null>(null);

  const handleViewClient = (clientId: string, hasAccess: boolean) => {
    if (!hasAccess) return;
    setSelectedClient(clientId);
    // TODO: Implement client budget view - navigate to dedicated page or open modal with client's budget data
    // For now, just tracking the selected client
  };

  const getHealthColor = (score: number) => {
    if (score >= 80) return "text-primary";
    if (score >= 60) return "text-chart-4";
    return "text-destructive";
  };

  const getHealthBadge = (score: number) => {
    if (score >= 80) return { variant: "default" as const, label: "Excellent" };
    if (score >= 60) return { variant: "secondary" as const, label: "Good" };
    return { variant: "destructive" as const, label: "Needs Attention" };
  };

  return (
    <div className="flex flex-col gap-6 p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold">Financial Planner Dashboard</h1>
          <p className="text-muted-foreground mt-1">Monitor and review client budgets</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Clients</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold" data-testid="text-total-clients">
              {mockClients.length}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {mockClients.filter(c => c.sharedAccess).length} with shared access
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Health Score</CardTitle>
            <TrendingUp className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold" data-testid="text-avg-health">
              {Math.round(mockClients.reduce((sum, c) => sum + c.budgetHealth, 0) / mockClients.length)}%
            </div>
            <p className="text-xs text-muted-foreground mt-1">Across all clients</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Assets Under Management</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-mono font-semibold tracking-tight" data-testid="text-total-aum">
              ${mockClients.reduce((sum, c) => sum + c.netWorth, 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Combined net worth</p>
          </CardContent>
        </Card>
      </div>

      {selectedClient && (
        <Card className="p-6 bg-muted/50">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">Selected Client</h3>
              <p className="text-sm text-muted-foreground">
                Client ID: {selectedClient}
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                TODO: Implement full client budget view with detailed financial data, transactions, and budget categories
              </p>
            </div>
            <Button variant="outline" onClick={() => setSelectedClient(null)}>
              Close
            </Button>
          </div>
        </Card>
      )}

      <div>
        <h2 className="text-xl font-semibold mb-4">Client Overview</h2>
        <div className="grid gap-4">
          {mockClients.map((client) => {
            const healthBadge = getHealthBadge(client.budgetHealth);
            const isPositive = client.change >= 0;

            return (
              <Card
                key={client.id}
                className="hover-elevate cursor-pointer"
                onClick={() => setSelectedClient(client.id)}
                data-testid={`card-client-${client.id}`}
              >
                <CardContent className="p-6">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                      <Avatar>
                        <AvatarImage src="" />
                        <AvatarFallback>
                          {client.name.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold">{client.name}</h3>
                          {!client.sharedAccess && (
                            <Badge variant="outline" className="text-xs">
                              No Access
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">{client.email}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-6 shrink-0">
                      <div className="text-right">
                        <div className="text-sm font-medium text-muted-foreground">Budget Health</div>
                        <div className="flex items-center gap-2">
                          <span className={`text-lg font-semibold ${getHealthColor(client.budgetHealth)}`}>
                            {client.budgetHealth}%
                          </span>
                          <Badge variant={healthBadge.variant} className="text-xs">
                            {healthBadge.label}
                          </Badge>
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="text-sm font-medium text-muted-foreground">Net Worth</div>
                        <div className="font-mono font-semibold">
                          ${client.netWorth.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </div>
                        <div className="flex items-center justify-end gap-1 text-sm">
                          {isPositive ? (
                            <TrendingUp className="h-3 w-3 text-primary" />
                          ) : (
                            <TrendingDown className="h-3 w-3 text-destructive" />
                          )}
                          <span className={isPositive ? "text-primary" : "text-destructive"}>
                            {isPositive ? "+" : ""}${Math.abs(client.change).toFixed(2)}
                          </span>
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="text-sm font-medium text-muted-foreground">Last Active</div>
                        <div className="text-sm">{client.lastActive}</div>
                      </div>

                      <Button
                        size="sm"
                        variant="outline"
                        disabled={!client.sharedAccess}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleViewClient(client.id, client.sharedAccess);
                        }}
                        data-testid={`button-view-${client.id}`}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        View
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
