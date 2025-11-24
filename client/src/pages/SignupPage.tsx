import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";

export default function SignupPage() {
  const [location, navigate] = useLocation();
  const { toast } = useToast();
  
  const searchParams = new URLSearchParams(location.substring(location.indexOf("?") + 1));
  const planParam = searchParams.get("plan") || "free";

  const [formData, setFormData] = useState({
    email: "",
    couponCode: "",
    agreeToTerms: false,
  });

  const [selectedPlan, setSelectedPlan] = useState(planParam);
  const [appliedCoupon, setAppliedCoupon] = useState<{
    code: string;
    discount: string;
    durationMonths: number;
  } | null>(null);

  const planDetails: Record<string, { name: string; price: string; description: string }> = {
    free: {
      name: "Free Plan",
      price: "$0",
      description: "Get started with basic budgeting",
    },
    user: {
      name: "Personal Plan",
      price: "$1/month",
      description: "Full budgeting with bank syncing",
    },
    planner: {
      name: "Financial Planner Plan",
      price: "$5/month",
      description: "Manage multiple client budgets",
    },
  };

  const handleApplyCoupon = () => {
    if (!formData.couponCode) {
      toast({
        title: "Error",
        description: "Please enter a coupon code",
        variant: "destructive",
      });
      return;
    }

    // TODO: Validate coupon code with backend API
    toast({
      title: "Coupon Applied",
      description: `Coupon code "${formData.couponCode}" has been applied (demo)`,
    });

    setAppliedCoupon({
      code: formData.couponCode,
      discount: "100% off",
      durationMonths: 3,
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.email) {
      toast({
        title: "Error",
        description: "Please enter an email address",
        variant: "destructive",
      });
      return;
    }

    if (!formData.agreeToTerms) {
      toast({
        title: "Error",
        description: "Please agree to the terms and conditions",
        variant: "destructive",
      });
      return;
    }

    // TODO: Integrate with Stripe for payment processing
    // TODO: Create subscription in backend
    toast({
      title: "Signup Successful!",
      description: `Welcome to ${planDetails[selectedPlan].name}. Redirecting to dashboard...`,
    });

    // Redirect after a short delay
    setTimeout(() => {
      navigate("/");
    }, 2000);
  };

  return (
    <div className="flex flex-col gap-6 p-6 max-w-4xl mx-auto">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">Create Your Account</h1>
        <p className="text-muted-foreground">Join thousands managing their budgets smarter</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Plan Selection */}
        <div>
          <h2 className="text-lg font-semibold mb-4">Select Your Plan</h2>
          <div className="space-y-2">
            {Object.entries(planDetails).map(([key, plan]) => (
              <button
                key={key}
                onClick={() => setSelectedPlan(key)}
                className={`w-full p-4 rounded-lg border-2 text-left transition-colors ${
                  selectedPlan === key
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/50"
                }`}
                data-testid={`button-select-plan-${key}`}
              >
                <div className="font-semibold">{plan.name}</div>
                <div className="text-sm text-muted-foreground">{plan.description}</div>
                <div className="text-sm font-mono font-bold mt-2">{plan.price}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Signup Form */}
        <Card>
          <CardHeader>
            <CardTitle>Account Details</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="you@example.com"
                  data-testid="input-signup-email"
                  required
                />
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="coupon">Coupon Code (Optional)</Label>
                <div className="flex gap-2">
                  <Input
                    id="coupon"
                    value={formData.couponCode}
                    onChange={(e) => setFormData({ ...formData, couponCode: e.target.value })}
                    placeholder="Enter coupon code"
                    data-testid="input-coupon-code"
                    disabled={!!appliedCoupon}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleApplyCoupon}
                    disabled={!!appliedCoupon}
                    data-testid="button-apply-coupon"
                  >
                    Apply
                  </Button>
                </div>
              </div>

              {appliedCoupon && (
                <div className="p-3 bg-green-50 border border-green-200 rounded-md">
                  <p className="text-sm font-medium text-green-900">
                    ✓ Coupon "{appliedCoupon.code}" applied - {appliedCoupon.discount}
                  </p>
                  <p className="text-xs text-green-700">
                    for {appliedCoupon.durationMonths} months
                  </p>
                </div>
              )}

              <div className="flex items-start gap-2">
                <input
                  type="checkbox"
                  id="terms"
                  checked={formData.agreeToTerms}
                  onChange={(e) => setFormData({ ...formData, agreeToTerms: e.target.checked })}
                  data-testid="checkbox-terms"
                  className="mt-1"
                />
                <Label htmlFor="terms" className="text-sm font-normal">
                  I agree to the Terms of Service and Privacy Policy
                </Label>
              </div>

              <Button type="submit" className="w-full" data-testid="button-signup-submit">
                Continue to Payment
              </Button>

              <p className="text-xs text-center text-muted-foreground">
                {selectedPlan === "free" 
                  ? "No credit card required"
                  : "Secure payment powered by Stripe"
                }
              </p>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
