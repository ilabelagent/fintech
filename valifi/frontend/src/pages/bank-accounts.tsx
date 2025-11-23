import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Landmark, Plus, CheckCircle, Clock, AlertCircle } from "lucide-react";

export default function BankAccountsPage() {
  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Bank Accounts</h1>
        <p className="text-muted-foreground">
          Link your bank accounts for seamless deposits and withdrawals
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Linked Accounts</CardTitle>
            <Landmark className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">Active connections</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Verified</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">Ready to use</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Clock className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">Awaiting verification</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Add Bank Account</CardTitle>
          <CardDescription>
            Connect your bank account for easy funding
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-start gap-3 p-4 border rounded-lg bg-amber-50 dark:bg-amber-950/20">
            <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-500 mt-0.5" />
            <div className="flex-1">
              <h4 className="font-semibold text-amber-900 dark:text-amber-100">
                KYC Required
              </h4>
              <p className="text-sm text-amber-700 dark:text-amber-300">
                Complete your KYC verification before linking bank accounts.
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <div className="p-4 border rounded-lg">
              <h4 className="font-semibold mb-2">Supported Countries</h4>
              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary">United States</Badge>
                <Badge variant="secondary">United Kingdom</Badge>
                <Badge variant="secondary">European Union</Badge>
                <Badge variant="secondary">Canada</Badge>
                <Badge variant="secondary">Australia</Badge>
                <Badge variant="secondary">Singapore</Badge>
              </div>
            </div>

            <div className="p-4 border rounded-lg">
              <h4 className="font-semibold mb-2">Supported Account Types</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  Checking Accounts
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  Savings Accounts
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  IBAN (Europe)
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  ACH (United States)
                </li>
              </ul>
            </div>
          </div>

          <Button className="w-full" disabled>
            <Plus className="h-4 w-4 mr-2" />
            Add Bank Account
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Linked Accounts</CardTitle>
          <CardDescription>Manage your connected bank accounts</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            No bank accounts linked
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Wire Transfer Instructions</CardTitle>
          <CardDescription>
            For large deposits, use wire transfer
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm">
            <div className="grid grid-cols-2 gap-2">
              <span className="text-muted-foreground">Bank Name:</span>
              <span className="font-medium">Valifi Partner Bank</span>
              
              <span className="text-muted-foreground">Account Name:</span>
              <span className="font-medium">Valifi Holdings</span>
              
              <span className="text-muted-foreground">Account Number:</span>
              <span className="font-medium">••••••••1234</span>
              
              <span className="text-muted-foreground">Routing Number:</span>
              <span className="font-medium">026009593</span>
              
              <span className="text-muted-foreground">SWIFT/BIC:</span>
              <span className="font-medium">VALIFIUS33</span>
            </div>
            
            <div className="p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
              <p className="text-xs text-blue-700 dark:text-blue-300">
                <strong>Reference:</strong> Include your Valifi username in the wire reference for faster processing
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
