import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Link2, Upload, RefreshCw, Trash2, AlertCircle, CheckCircle2, XCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import type { SimplefinConnection, ImportLog } from "@shared/schema";

export default function ImportSyncView() {
  const { toast } = useToast();
  const [setupToken, setSetupToken] = useState("");
  const [ynabJsonContent, setYnabJsonContent] = useState("");
  const [ynabCsvContent, setYnabCsvContent] = useState("");
  const [ynabAccountName, setYnabAccountName] = useState("");
  const [actualBudgetContent, setActualBudgetContent] = useState("");
  const [confirmDialog, setConfirmDialog] = useState<{ open: boolean; action: () => void; title: string; description: string }>({
    open: false,
    action: () => {},
    title: "",
    description: "",
  });

  const { data: connections, isLoading: connectionsLoading } = useQuery<SimplefinConnection[]>({
    queryKey: ["/api/simplefin/connections"],
  });

  const { data: importLogs, isLoading: logsLoading } = useQuery<ImportLog[]>({
    queryKey: ["/api/import/logs"],
  });

  const setupMutation = useMutation({
    mutationFn: async (token: string) => {
      const res = await apiRequest("POST", "/api/simplefin/setup", { setupToken: token });
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "SimpleFIN Connected",
        description: "Your bank account has been successfully connected.",
      });
      setSetupToken("");
      queryClient.invalidateQueries({ queryKey: ["/api/simplefin/connections"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Connection Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const syncMutation = useMutation({
    mutationFn: async (connectionId: string) => {
      const res = await apiRequest("POST", `/api/simplefin/sync/${connectionId}`);
      return await res.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Sync Complete",
        description: `Imported ${data.accountsImported} accounts and ${data.transactionsImported} transactions.`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/accounts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/transactions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/simplefin/connections"] });
      queryClient.invalidateQueries({ queryKey: ["/api/import/logs"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Sync Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (connectionId: string) => {
      const res = await apiRequest("DELETE", `/api/simplefin/connections/${connectionId}`);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Connection Removed",
        description: "SimpleFIN connection has been removed.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/simplefin/connections"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Delete Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const ynabJsonMutation = useMutation({
    mutationFn: async ({ budgetData, fileName }: { budgetData: any; fileName: string }) => {
      const res = await apiRequest("POST", "/api/import/ynab-json", { budgetData, fileName });
      return await res.json();
    },
    onSuccess: (data) => {
      toast({
        title: "YNAB Import Complete",
        description: `Imported ${data.accountsImported} accounts, ${data.transactionsImported} transactions, and ${data.categoriesImported} categories.`,
      });
      setYnabJsonContent("");
      queryClient.invalidateQueries({ queryKey: ["/api/accounts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/transactions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/categories"] });
      queryClient.invalidateQueries({ queryKey: ["/api/import/logs"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Import Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const ynabCsvMutation = useMutation({
    mutationFn: async ({ csvContent, accountName, fileName }: { csvContent: string; accountName: string; fileName: string }) => {
      const res = await apiRequest("POST", "/api/import/ynab-csv", { csvContent, accountName, fileName });
      return await res.json();
    },
    onSuccess: (data) => {
      toast({
        title: "YNAB CSV Import Complete",
        description: `Imported ${data.accountsImported} accounts and ${data.transactionsImported} transactions.`,
      });
      setYnabCsvContent("");
      setYnabAccountName("");
      queryClient.invalidateQueries({ queryKey: ["/api/accounts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/transactions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/import/logs"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Import Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const actualBudgetMutation = useMutation({
    mutationFn: async ({ budgetData, fileName }: { budgetData: any; fileName: string }) => {
      const res = await apiRequest("POST", "/api/import/actual-budget", { budgetData, fileName });
      return await res.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Actual Budget Import Complete",
        description: `Imported ${data.accountsImported} accounts, ${data.transactionsImported} transactions, and ${data.categoriesImported} categories.`,
      });
      setActualBudgetContent("");
      queryClient.invalidateQueries({ queryKey: ["/api/accounts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/transactions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/categories"] });
      queryClient.invalidateQueries({ queryKey: ["/api/import/logs"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Import Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const openConfirmDialog = (title: string, description: string, action: () => void) => {
    setConfirmDialog({ open: true, title, description, action });
  };

  const handleSimplefinSetup = () => {
    const trimmedToken = setupToken.trim();
    if (!trimmedToken) {
      toast({
        title: "Error",
        description: "Please enter a setup token",
        variant: "destructive",
      });
      return;
    }
    if (trimmedToken.length < 20) {
      toast({
        title: "Error",
        description: "Setup token appears to be invalid (too short)",
        variant: "destructive",
      });
      return;
    }
    setupMutation.mutate(trimmedToken);
  };

  const handleSync = (connectionId: string) => {
    openConfirmDialog(
      "Sync Bank Account",
      "This will fetch the latest transactions from your bank. Continue?",
      () => syncMutation.mutate(connectionId)
    );
  };

  const handleDelete = (connectionId: string) => {
    openConfirmDialog(
      "Remove Connection",
      "This will remove the bank connection. Your existing transactions will not be deleted. Continue?",
      () => deleteMutation.mutate(connectionId)
    );
  };

  const handleYnabJsonImport = () => {
    if (!ynabJsonContent.trim()) {
      toast({
        title: "Error",
        description: "Please paste YNAB JSON data",
        variant: "destructive",
      });
      return;
    }

    try {
      const budgetData = JSON.parse(ynabJsonContent);
      ynabJsonMutation.mutate({ budgetData, fileName: "ynab-import.json" });
    } catch (error) {
      toast({
        title: "Error",
        description: "Invalid JSON format",
        variant: "destructive",
      });
    }
  };

  const handleYnabCsvImport = () => {
    if (!ynabCsvContent.trim() || !ynabAccountName.trim()) {
      toast({
        title: "Error",
        description: "Please provide both CSV content and account name",
        variant: "destructive",
      });
      return;
    }
    ynabCsvMutation.mutate({ csvContent: ynabCsvContent, accountName: ynabAccountName, fileName: "ynab-import.csv" });
  };

  const handleActualBudgetImport = () => {
    if (!actualBudgetContent.trim()) {
      toast({
        title: "Error",
        description: "Please paste Actual Budget JSON data",
        variant: "destructive",
      });
      return;
    }

    try {
      const budgetData = JSON.parse(actualBudgetContent);
      actualBudgetMutation.mutate({ budgetData, fileName: "actual-budget-import.json" });
    } catch (error) {
      toast({
        title: "Error",
        description: "Invalid JSON format",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="container max-w-7xl px-6 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-semibold mb-2">Import & Sync</h1>
        <p className="text-muted-foreground">Connect your bank accounts or import data from other budgeting apps</p>
      </div>

      <Tabs defaultValue="simplefin" className="space-y-6">
        <TabsList>
          <TabsTrigger value="simplefin" data-testid="tab-simplefin">SimpleFIN Bank Sync</TabsTrigger>
          <TabsTrigger value="ynab" data-testid="tab-ynab">YNAB Import</TabsTrigger>
          <TabsTrigger value="actual" data-testid="tab-actual-budget">Actual Budget Import</TabsTrigger>
          <TabsTrigger value="history" data-testid="tab-history">Import History</TabsTrigger>
        </TabsList>

        <TabsContent value="simplefin" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Link2 className="h-5 w-5" />
                Connect Bank Account
              </CardTitle>
              <CardDescription>
                SimpleFIN provides secure bank account syncing for $1.50/month. Get your setup token from bridge.simplefin.org
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <strong>How to get started:</strong>
                  <ol className="list-decimal list-inside mt-2 space-y-1">
                    <li>Visit <a href="https://bridge.simplefin.org" target="_blank" rel="noopener noreferrer" className="underline">bridge.simplefin.org</a></li>
                    <li>Create an account and link your bank ($1.50/month)</li>
                    <li>Copy the setup token and paste it below</li>
                  </ol>
                </AlertDescription>
              </Alert>
              <div className="space-y-2">
                <Label htmlFor="setup-token">Setup Token</Label>
                <Input
                  id="setup-token"
                  data-testid="input-simplefin-token"
                  placeholder="Paste your SimpleFIN setup token here"
                  value={setupToken}
                  onChange={(e) => setSetupToken(e.target.value)}
                  disabled={setupMutation.isPending}
                />
              </div>
              <Button
                onClick={handleSimplefinSetup}
                disabled={setupMutation.isPending}
                data-testid="button-simplefin-setup"
              >
                {setupMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Connecting...
                  </>
                ) : (
                  <>
                    <Link2 className="h-4 w-4" />
                    Connect Bank
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {connectionsLoading ? (
            <Card>
              <CardContent className="py-8">
                <div className="flex items-center justify-center">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              </CardContent>
            </Card>
          ) : connections && connections.length > 0 ? (
            <Card>
              <CardHeader>
                <CardTitle>Connected Banks</CardTitle>
                <CardDescription>Manage your SimpleFIN bank connections</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {connections.map((connection) => (
                  <div
                    key={connection.id}
                    className="flex items-center justify-between p-4 border rounded-md"
                    data-testid={`connection-${connection.id}`}
                  >
                    <div>
                      <p className="font-medium" data-testid={`text-connection-name-${connection.id}`}>
                        {connection.connectionName || 'Bank Connection'}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Last synced: {connection.lastSync ? new Date(connection.lastSync).toLocaleDateString() : "Never"}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleSync(connection.id)}
                        disabled={syncMutation.isPending || deleteMutation.isPending}
                        data-testid={`button-sync-${connection.id}`}
                      >
                        {syncMutation.isPending ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <RefreshCw className="h-4 w-4" />
                        )}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDelete(connection.id)}
                        disabled={syncMutation.isPending || deleteMutation.isPending}
                        data-testid={`button-delete-${connection.id}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          ) : null}
        </TabsContent>

        <TabsContent value="ynab" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5" />
                Import from YNAB (JSON)
              </CardTitle>
              <CardDescription>
                Import your budget data from YNAB using JSON format (from API export)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="ynab-json">YNAB JSON Data</Label>
                <Textarea
                  id="ynab-json"
                  data-testid="input-ynab-json"
                  placeholder='Paste your YNAB JSON data here (e.g., {"budget": {...}})'
                  value={ynabJsonContent}
                  onChange={(e) => setYnabJsonContent(e.target.value)}
                  rows={10}
                  className="font-mono text-sm"
                  disabled={ynabJsonMutation.isPending}
                />
              </div>
              <Button
                onClick={handleYnabJsonImport}
                disabled={ynabJsonMutation.isPending}
                data-testid="button-ynab-json-import"
              >
                {ynabJsonMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Importing...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4" />
                    Import YNAB JSON
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5" />
                Import from YNAB (CSV)
              </CardTitle>
              <CardDescription>
                Import transactions from YNAB CSV format (Date, Payee, Memo, Amount)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="account-name">Account Name</Label>
                <Input
                  id="account-name"
                  data-testid="input-ynab-account-name"
                  placeholder="Enter account name for these transactions"
                  value={ynabAccountName}
                  onChange={(e) => setYnabAccountName(e.target.value)}
                  disabled={ynabCsvMutation.isPending}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ynab-csv">YNAB CSV Data</Label>
                <Textarea
                  id="ynab-csv"
                  data-testid="input-ynab-csv"
                  placeholder="Date,Payee,Memo,Amount&#10;2024-01-01,Grocery Store,Weekly shopping,-50.00"
                  value={ynabCsvContent}
                  onChange={(e) => setYnabCsvContent(e.target.value)}
                  rows={10}
                  className="font-mono text-sm"
                  disabled={ynabCsvMutation.isPending}
                />
              </div>
              <Button
                onClick={handleYnabCsvImport}
                disabled={ynabCsvMutation.isPending}
                data-testid="button-ynab-csv-import"
              >
                {ynabCsvMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Importing...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4" />
                    Import YNAB CSV
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="actual" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5" />
                Import from Actual Budget
              </CardTitle>
              <CardDescription>
                Import your budget data from Actual Budget using JSON format
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="actual-json">Actual Budget JSON Data</Label>
                <Textarea
                  id="actual-json"
                  data-testid="input-actual-budget-json"
                  placeholder='Paste your Actual Budget JSON data here'
                  value={actualBudgetContent}
                  onChange={(e) => setActualBudgetContent(e.target.value)}
                  rows={10}
                  className="font-mono text-sm"
                  disabled={actualBudgetMutation.isPending}
                />
              </div>
              <Button
                onClick={handleActualBudgetImport}
                disabled={actualBudgetMutation.isPending}
                data-testid="button-actual-budget-import"
              >
                {actualBudgetMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Importing...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4" />
                    Import Actual Budget
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Import History</CardTitle>
              <CardDescription>View your past import operations</CardDescription>
            </CardHeader>
            <CardContent>
              {logsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : importLogs && importLogs.length > 0 ? (
                <div className="space-y-3">
                  {importLogs.map((log) => (
                    <div
                      key={log.id}
                      className="flex items-center justify-between p-4 border rounded-md"
                      data-testid={`import-log-${log.id}`}
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{log.fileName}</p>
                          <Badge variant={log.status === 'success' ? 'default' : 'destructive'}>
                            {log.status}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          Source: {log.source} • {log.createdAt ? new Date(log.createdAt).toLocaleString() : 'N/A'}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Accounts: {log.accountsImported} • Transactions: {log.transactionsImported} • Categories: {log.categoriesImported}
                        </p>
                        {log.errorMessage && (
                          <p className="text-sm text-destructive mt-1">{log.errorMessage}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-8">No import history yet</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <AlertDialog open={confirmDialog.open} onOpenChange={(open) => setConfirmDialog({ ...confirmDialog, open })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{confirmDialog.title}</AlertDialogTitle>
            <AlertDialogDescription>{confirmDialog.description}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                confirmDialog.action();
                setConfirmDialog({ ...confirmDialog, open: false });
              }}
              data-testid="button-confirm-action"
            >
              Continue
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
