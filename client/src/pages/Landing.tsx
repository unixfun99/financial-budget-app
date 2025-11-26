import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Wallet, TrendingUp, Shield, Users } from "lucide-react";

export default function Landing() {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-primary">Budget Planner</h1>
          <Button asChild data-testid="button-login">
            <a href="/api/login">Log In with Google</a>
          </Button>
        </div>
      </header>

      <main className="flex-1">
        <section className="container mx-auto px-6 py-20 text-center">
          <h2 className="text-5xl font-bold mb-6">
            Take Control of Your Finances
          </h2>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Envelope-style budgeting made simple. Track accounts, manage transactions,
            and share budgets with financial planners.
          </p>
          <Button size="lg" asChild data-testid="button-get-started">
            <a href="/api/login">Get Started with Google</a>
          </Button>
        </section>

        <section className="bg-muted/30 py-20">
          <div className="container mx-auto px-6">
            <h3 className="text-3xl font-semibold text-center mb-12">Features</h3>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardContent className="p-6">
                  <Wallet className="h-12 w-12 text-primary mb-4" />
                  <h4 className="text-lg font-semibold mb-2">Account Management</h4>
                  <p className="text-sm text-muted-foreground">
                    Track all your accounts in one place - checking, savings, credit cards, and investments.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <TrendingUp className="h-12 w-12 text-primary mb-4" />
                  <h4 className="text-lg font-semibold mb-2">Envelope Budgeting</h4>
                  <p className="text-sm text-muted-foreground">
                    Allocate your money to categories and see exactly where every dollar goes.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <Shield className="h-12 w-12 text-primary mb-4" />
                  <h4 className="text-lg font-semibold mb-2">Secure & Private</h4>
                  <p className="text-sm text-muted-foreground">
                    Your financial data is encrypted and secure. We never share your information.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <Users className="h-12 w-12 text-primary mb-4" />
                  <h4 className="text-lg font-semibold mb-2">Planner Sharing</h4>
                  <p className="text-sm text-muted-foreground">
                    Share your budget with financial planners for expert guidance and support.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        <section className="container mx-auto px-6 py-20 text-center">
          <h3 className="text-3xl font-semibold mb-6">Ready to Start Budgeting?</h3>
          <p className="text-lg text-muted-foreground mb-8 max-w-xl mx-auto">
            Join thousands of users who have taken control of their finances with our envelope-style budgeting system.
          </p>
          <Button size="lg" asChild>
            <a href="/api/login">Get Started with Google</a>
          </Button>
        </section>
      </main>

      <footer className="border-t py-8">
        <div className="container mx-auto px-6 text-center text-sm text-muted-foreground">
          <p>&copy; 2024 Budget Planner. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
