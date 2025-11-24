import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Save } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

export default function SettingsView() {
  const { toast } = useToast();
  const [profileData, setProfileData] = useState({
    name: "John Doe",
    email: "john@example.com",
    phone: "",
  });
  const [sharingEnabled, setSharingEnabled] = useState(false);
  const [plannerEmail, setPlannerEmail] = useState("");
  const [budgetAlerts, setBudgetAlerts] = useState(true);
  const [transactionAlerts, setTransactionAlerts] = useState(false);
  const [monthlyReports, setMonthlyReports] = useState(true);

  const handleSaveProfile = () => {
    // TODO: Implement backend API call to persist profile changes
    toast({
      title: "Profile updated (not persisted)",
      description: "This is a UI-only demo. Backend integration needed to save changes.",
    });
  };

  const handleChangePassword = () => {
    // TODO: Implement backend API call for password change
    // TODO: Add validation for password strength and confirmation match
    toast({
      title: "Password updated (not persisted)",
      description: "This is a UI-only demo. Backend integration needed to change password.",
    });
  };

  const handleShareAccess = () => {
    if (!plannerEmail) {
      toast({
        title: "Error",
        description: "Please enter a planner email address.",
        variant: "destructive",
      });
      return;
    }
    // TODO: Implement backend API call to persist sharing permissions
    // TODO: Add validation for duplicate email addresses
    // TODO: Handle revoking access when sharing is disabled
    toast({
      title: "Sharing configured (not persisted)",
      description: `This is a UI-only demo. Backend integration needed to actually share budget with ${plannerEmail}.`,
    });
    setPlannerEmail("");
  };

  return (
    <div className="flex flex-col gap-6 p-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-3xl font-semibold">Settings</h1>
        <p className="text-muted-foreground mt-1">Manage your account and preferences</p>
      </div>

      <Tabs defaultValue="profile" className="space-y-4">
        <TabsList>
          <TabsTrigger value="profile" data-testid="tab-profile">Profile</TabsTrigger>
          <TabsTrigger value="sharing" data-testid="tab-sharing">Sharing</TabsTrigger>
          <TabsTrigger value="preferences" data-testid="tab-preferences">Preferences</TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
              <CardDescription>Update your account details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  placeholder="John Doe"
                  value={profileData.name}
                  onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                  data-testid="input-name"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="john@example.com"
                  value={profileData.email}
                  onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                  data-testid="input-email"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="+1 (555) 123-4567"
                  value={profileData.phone}
                  onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                  data-testid="input-phone"
                />
              </div>

              <Separator />

              <Button onClick={handleSaveProfile} data-testid="button-save-profile">
                <Save className="h-4 w-4 mr-2" />
                Save Changes
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Change Password</CardTitle>
              <CardDescription>Update your password</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="current-password">Current Password</Label>
                <Input id="current-password" type="password" data-testid="input-current-password" />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="new-password">New Password</Label>
                <Input id="new-password" type="password" data-testid="input-new-password" />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="confirm-password">Confirm New Password</Label>
                <Input id="confirm-password" type="password" data-testid="input-confirm-password" />
              </div>

              <Button onClick={handleChangePassword} data-testid="button-change-password">Update Password</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sharing" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Budget Sharing</CardTitle>
              <CardDescription>
                Share your budget with financial planners or advisors
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Enable Budget Sharing</Label>
                  <p className="text-sm text-muted-foreground">
                    Allow financial planners to view your budget
                  </p>
                </div>
                <Switch
                  checked={sharingEnabled}
                  onCheckedChange={setSharingEnabled}
                  data-testid="switch-enable-sharing"
                />
              </div>

              <Separator />

              <div className="grid gap-2">
                <Label htmlFor="planner-email">Financial Planner Email</Label>
                <div className="flex gap-2">
                  <Input
                    id="planner-email"
                    type="email"
                    placeholder="planner@example.com"
                    value={plannerEmail}
                    onChange={(e) => setPlannerEmail(e.target.value)}
                    disabled={!sharingEnabled}
                    data-testid="input-planner-email"
                  />
                  <Button
                    onClick={handleShareAccess}
                    disabled={!sharingEnabled}
                    data-testid="button-share"
                  >
                    Share Access
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Enter the email address of your financial planner to grant them view-only access to your budget.
                </p>
              </div>

              <Separator />

              <div className="space-y-2">
                <Label>Current Shared Access</Label>
                <div className="border rounded-md p-3">
                  <p className="text-sm text-muted-foreground">No planners have access yet</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="preferences" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Notification Preferences</CardTitle>
              <CardDescription>Configure how you receive notifications</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Budget Alerts</Label>
                  <p className="text-sm text-muted-foreground">
                    Get notified when you exceed budget limits
                  </p>
                </div>
                <Switch
                  checked={budgetAlerts}
                  onCheckedChange={setBudgetAlerts}
                  data-testid="switch-budget-alerts"
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Transaction Alerts</Label>
                  <p className="text-sm text-muted-foreground">
                    Receive notifications for new transactions
                  </p>
                </div>
                <Switch
                  checked={transactionAlerts}
                  onCheckedChange={setTransactionAlerts}
                  data-testid="switch-transaction-alerts"
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Monthly Reports</Label>
                  <p className="text-sm text-muted-foreground">
                    Get monthly budget summary reports
                  </p>
                </div>
                <Switch
                  checked={monthlyReports}
                  onCheckedChange={setMonthlyReports}
                  data-testid="switch-monthly-reports"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Display Preferences</CardTitle>
              <CardDescription>Customize how data is displayed</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="currency">Currency</Label>
                <Input id="currency" defaultValue="USD ($)" data-testid="input-currency" />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="date-format">Date Format</Label>
                <Input id="date-format" defaultValue="MM/DD/YYYY" data-testid="input-date-format" />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
