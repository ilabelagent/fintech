import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CreditCard, Lock, DollarSign, AlertCircle, Eye, EyeOff } from "lucide-react";
import { useState } from "react";

export default function CardPage() {
  const [showCardNumber, setShowCardNumber] = useState(false);

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Valifi Card</h1>
        <p className="text-muted-foreground">
          Virtual and physical debit cards linked to your Valifi balance
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Card Status</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Not Applied</div>
            <p className="text-xs text-muted-foreground">Complete KYC to apply</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Available Balance</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">$0.00</div>
            <p className="text-xs text-muted-foreground">Card spending limit</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Virtual Card</CardTitle>
          <CardDescription>
            Instant virtual card for online purchases
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-gradient-to-br from-purple-600 via-blue-600 to-cyan-600 rounded-xl p-6 text-white shadow-xl">
            <div className="flex justify-between items-start mb-8">
              <div>
                <p className="text-xs opacity-80">Valifi Card</p>
                <p className="text-sm font-semibold">Virtual</p>
              </div>
              <CreditCard className="h-8 w-8 opacity-80" />
            </div>

            <div className="space-y-2 mb-6">
              <div className="flex items-center gap-2">
                <p className="text-lg font-mono tracking-wider">
                  {showCardNumber ? "•••• •••• •••• ••••" : "•••• •••• •••• ••••"}
                </p>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-6 w-6 p-0 text-white hover:bg-white/20"
                  onClick={() => setShowCardNumber(!showCardNumber)}
                >
                  {showCardNumber ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            <div className="flex justify-between items-end">
              <div>
                <p className="text-xs opacity-80">Cardholder</p>
                <p className="text-sm font-semibold">Not Applied</p>
              </div>
              <div>
                <p className="text-xs opacity-80">Expires</p>
                <p className="text-sm font-semibold">--/--</p>
              </div>
            </div>
          </div>

          <div className="flex items-start gap-3 p-4 border rounded-lg bg-amber-50 dark:bg-amber-950/20">
            <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-500 mt-0.5" />
            <div className="flex-1">
              <h4 className="font-semibold text-amber-900 dark:text-amber-100">
                KYC Required
              </h4>
              <p className="text-sm text-amber-700 dark:text-amber-300">
                Complete your KYC verification to apply for a Valifi Card.
              </p>
            </div>
          </div>

          <Button className="w-full" disabled>
            Apply for Virtual Card
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Physical Card</CardTitle>
          <CardDescription>
            Premium metal card delivered to your address
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 md:grid-cols-2">
            <div className="p-4 border rounded-lg">
              <h4 className="font-semibold mb-2">Standard</h4>
              <p className="text-2xl font-bold mb-1">Free</p>
              <p className="text-sm text-muted-foreground mb-3">Basic plastic card</p>
              <Badge variant="secondary">5-7 business days</Badge>
            </div>

            <div className="p-4 border rounded-lg border-yellow-500/50 bg-yellow-50 dark:bg-yellow-950/20">
              <h4 className="font-semibold mb-2 flex items-center gap-2">
                Premium
                <Lock className="h-4 w-4" />
              </h4>
              <p className="text-2xl font-bold mb-1">$49</p>
              <p className="text-sm text-muted-foreground mb-3">Metal card with perks</p>
              <Badge>3-5 business days</Badge>
            </div>
          </div>

          <Button className="w-full" variant="outline" disabled>
            Apply for Physical Card
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Card Controls</CardTitle>
          <CardDescription>
            Manage your card security and spending limits
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            No active cards
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
