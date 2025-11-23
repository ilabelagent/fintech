import { Card } from "@/components/ui/card";

export function RecentTransactions() {
  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4">Recent Transactions</h3>
      <p className="text-sm text-gray-600">Your recent transactions will appear here</p>
    </Card>
  );
}
