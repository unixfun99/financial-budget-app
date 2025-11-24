import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";
import { useLocation } from "wouter";

export default function PricingPage() {
  const [, navigate] = useLocation();

  const plans = [
    {
      name: "Free",
      price: "$0",
      period: "forever",
      description: "Get started with basic budgeting",
      features: [
        "Basic budget tracking",
        "Manual transaction entry",
        "CSV import",
        "Up to 5 categories",
      ],
      cta: "Get Started",
      highlight: false,
      id: "free",
    },
    {
      name: "Personal",
      price: "$1",
      period: "per month",
      description: "Full budgeting and bank syncing",
      features: [
        "Unlimited categories & subcategories",
        "SimpleFIN & Plaid bank sync",
        "Unlimited transactions",
        "Advanced reports & analytics",
        "YNAB & Actual Budget imports",
        "Transaction management",
      ],
      cta: "Start Free Trial",
      highlight: true,
      id: "user",
    },
    {
      name: "Financial Planner",
      price: "$5",
      period: "per month",
      description: "Manage multiple client budgets",
      features: [
        "Everything in Personal",
        "Client budget access",
        "Multi-user budget sharing",
        "Client management dashboard",
        "Bulk client setup",
        "Priority support",
      ],
      cta: "Upgrade to Planner",
      highlight: false,
      id: "planner",
    },
  ];

  return (
    <div className="flex flex-col gap-8 p-6 max-w-6xl mx-auto">
      <div className="text-center space-y-2">
        <h1 className="text-4xl font-bold">Simple, Transparent Pricing</h1>
        <p className="text-muted-foreground text-lg">
          Choose the plan that works for you. No hidden fees.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {plans.map((plan) => (
          <Card 
            key={plan.id} 
            className={`flex flex-col ${plan.highlight ? "ring-2 ring-primary" : ""}`}
            data-testid={`card-plan-${plan.id}`}
          >
            <CardHeader>
              <CardTitle className="text-2xl">{plan.name}</CardTitle>
              <p className="text-sm text-muted-foreground mt-2">{plan.description}</p>
              <div className="mt-4 flex items-baseline gap-1">
                <span className="text-4xl font-bold">{plan.price}</span>
                <span className="text-muted-foreground">/{plan.period}</span>
              </div>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col">
              <ul className="space-y-3 mb-6 flex-1">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                    <span className="text-sm">{feature}</span>
                  </li>
                ))}
              </ul>
              <Button
                onClick={() => navigate("/signup?plan=" + plan.id)}
                variant={plan.highlight ? "default" : "outline"}
                className="w-full"
                data-testid={`button-cta-${plan.id}`}
              >
                {plan.cta}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="bg-muted">
        <CardContent className="pt-6">
          <h3 className="font-semibold mb-2">Have a coupon code?</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Enter your coupon code during signup to get a discount or free trial.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
