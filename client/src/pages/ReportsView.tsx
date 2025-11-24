import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from "recharts";
import { useState } from "react";

//todo: remove mock functionality
const allMonthlyData = [
  { month: "Feb '24", income: 4200, expenses: 3100 },
  { month: "Mar '24", income: 4500, expenses: 3300 },
  { month: "Apr '24", income: 4400, expenses: 3200 },
  { month: "May '24", income: 4600, expenses: 3400 },
  { month: "Jun '24", income: 4500, expenses: 3250 },
  { month: "Jul '24", income: 4500, expenses: 3200 },
  { month: "Aug '24", income: 4500, expenses: 3450 },
  { month: "Sep '24", income: 4800, expenses: 3100 },
  { month: "Oct '24", income: 4500, expenses: 3600 },
  { month: "Nov '24", income: 4500, expenses: 3300 },
  { month: "Dec '24", income: 5200, expenses: 4100 },
  { month: "Jan '25", income: 4500, expenses: 2950 },
];

const getFilteredData = (period: string) => {
  const now = new Date();
  const currentMonth = now.getMonth(); // 0-11 (Jan = 0)
  const currentYear = now.getFullYear();
  
  switch(period) {
    case "mtd": // Month to date - just current month
      return allMonthlyData.slice(-1);
    case "ytd": // Year to date - last 7 months (simulating Jul-Jan)
      return allMonthlyData.slice(-7);
    case "last6": // Last 6 months
      return allMonthlyData.slice(-6);
    case "last12": // Last 12 months
      return allMonthlyData;
    default:
      return allMonthlyData.slice(-7);
  }
};

const getCategoryData = (period: string) => {
  // Simulate different spending patterns for different periods
  const baseData = [
    { name: "Groceries", color: "hsl(var(--chart-1))" },
    { name: "Dining Out", color: "hsl(var(--chart-2))" },
    { name: "Transportation", color: "hsl(var(--chart-3))" },
    { name: "Utilities", color: "hsl(var(--chart-4))" },
    { name: "Entertainment", color: "hsl(var(--chart-5))" },
  ];
  
  const multipliers: Record<string, number> = {
    mtd: 0.2,  // One month
    ytd: 1,    // 7 months
    last6: 0.86, // 6 months
    last12: 1.7, // 12 months
  };
  
  const multiplier = multipliers[period] || 1;
  
  return baseData.map(cat => ({
    ...cat,
    value: Math.round((
      cat.name === "Groceries" ? 500 :
      cat.name === "Dining Out" ? 200 :
      cat.name === "Transportation" ? 300 :
      cat.name === "Utilities" ? 250 :
      150
    ) * multiplier)
  }));
};

const getNetWorthData = (period: string) => {
  const allData = [
    { month: "Feb '24", value: 39500 },
    { month: "Mar '24", value: 40200 },
    { month: "Apr '24", value: 40800 },
    { month: "May '24", value: 41500 },
    { month: "Jun '24", value: 42000 },
    { month: "Jul '24", value: 42500 },
    { month: "Aug '24", value: 43200 },
    { month: "Sep '24", value: 45000 },
    { month: "Oct '24", value: 44500 },
    { month: "Nov '24", value: 46800 },
    { month: "Dec '24", value: 48200 },
    { month: "Jan '25", value: 51230 },
  ];
  
  switch(period) {
    case "mtd":
      return allData.slice(-1);
    case "ytd":
      return allData.slice(-7);
    case "last6":
      return allData.slice(-6);
    case "last12":
      return allData;
    default:
      return allData.slice(-7);
  }
};

export default function ReportsView() {
  const [selectedPeriod, setSelectedPeriod] = useState("ytd");
  
  const monthlyData = getFilteredData(selectedPeriod);
  const categoryData = getCategoryData(selectedPeriod);
  const netWorthData = getNetWorthData(selectedPeriod);
  
  const totalIncome = monthlyData.reduce((sum, m) => sum + m.income, 0);
  const totalExpenses = monthlyData.reduce((sum, m) => sum + m.expenses, 0);
  const netSavings = totalIncome - totalExpenses;
  const savingsRate = totalIncome > 0 ? ((netSavings / totalIncome) * 100).toFixed(0) : 0;
  
  const periodLabel = {
    mtd: "This month",
    ytd: "Last 7 months",
    last6: "Last 6 months",
    last12: "Last 12 months",
  }[selectedPeriod] || "Selected period";

  return (
    <div className="flex flex-col gap-6 p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold">Reports</h1>
          <p className="text-muted-foreground mt-1">Financial insights and analytics</p>
        </div>
        <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
          <SelectTrigger className="w-[180px]" data-testid="select-period">
            <SelectValue placeholder="Select period" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="mtd">Month to Date</SelectItem>
            <SelectItem value="ytd">Year to Date</SelectItem>
            <SelectItem value="last6">Last 6 Months</SelectItem>
            <SelectItem value="last12">Last 12 Months</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview" data-testid="tab-overview">Overview</TabsTrigger>
          <TabsTrigger value="categories" data-testid="tab-categories">Categories</TabsTrigger>
          <TabsTrigger value="trends" data-testid="tab-trends">Trends</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Income vs Expenses</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={350}>
                <BarChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="income" fill="hsl(var(--chart-1))" name="Income" />
                  <Bar dataKey="expenses" fill="hsl(var(--chart-5))" name="Expenses" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Total Income</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-mono font-semibold tracking-tight text-primary" data-testid="text-total-income">
                  ${totalIncome.toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground mt-1">{periodLabel}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-mono font-semibold tracking-tight text-destructive" data-testid="text-total-expenses">
                  ${totalExpenses.toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground mt-1">{periodLabel}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Net Savings</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-mono font-semibold tracking-tight text-primary" data-testid="text-net-savings">
                  ${netSavings.toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground mt-1">{savingsRate}% savings rate</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="categories" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Spending by Category</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-center">
                <ResponsiveContainer width="100%" height={350}>
                  <PieChart>
                    <Pie
                      data={categoryData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={120}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {categoryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-4 md:grid-cols-2">
            {categoryData.map((category) => (
              <Card key={category.name}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className="h-3 w-3 rounded-full"
                        style={{ backgroundColor: category.color }}
                      />
                      <span className="font-medium">{category.name}</span>
                    </div>
                    <span className="font-mono font-semibold">${category.value}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="trends" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Net Worth Over Time</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={350}>
                <LineChart data={netWorthData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="value"
                    stroke="hsl(var(--chart-1))"
                    strokeWidth={2}
                    name="Net Worth"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
