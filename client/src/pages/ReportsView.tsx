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
const monthlyData = [
  { month: "Jul", income: 4500, expenses: 3200 },
  { month: "Aug", income: 4500, expenses: 3450 },
  { month: "Sep", income: 4800, expenses: 3100 },
  { month: "Oct", income: 4500, expenses: 3600 },
  { month: "Nov", income: 4500, expenses: 3300 },
  { month: "Dec", income: 5200, expenses: 4100 },
  { month: "Jan", income: 4500, expenses: 2950 },
];

//todo: remove mock functionality
const categoryData = [
  { name: "Groceries", value: 500, color: "hsl(var(--chart-1))" },
  { name: "Dining Out", value: 200, color: "hsl(var(--chart-2))" },
  { name: "Transportation", value: 300, color: "hsl(var(--chart-3))" },
  { name: "Utilities", value: 250, color: "hsl(var(--chart-4))" },
  { name: "Entertainment", value: 150, color: "hsl(var(--chart-5))" },
];

//todo: remove mock functionality
const netWorthData = [
  { month: "Jul", value: 42000 },
  { month: "Aug", value: 43200 },
  { month: "Sep", value: 45000 },
  { month: "Oct", value: 44500 },
  { month: "Nov", value: 46800 },
  { month: "Dec", value: 48200 },
  { month: "Jan", value: 51230 },
];

export default function ReportsView() {
  const [selectedPeriod, setSelectedPeriod] = useState("ytd");

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
                <div className="text-2xl font-mono font-semibold tracking-tight text-primary">
                  $32,500
                </div>
                <p className="text-xs text-muted-foreground mt-1">Last 7 months</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-mono font-semibold tracking-tight text-destructive">
                  $23,700
                </div>
                <p className="text-xs text-muted-foreground mt-1">Last 7 months</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Net Savings</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-mono font-semibold tracking-tight text-primary">
                  $8,800
                </div>
                <p className="text-xs text-muted-foreground mt-1">27% savings rate</p>
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
