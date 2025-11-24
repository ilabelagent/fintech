import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function BotPerformanceWidget() {
  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">Bot Performance</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-center py-8 text-muted-foreground">
          <p>No active trading bots</p>
          <p className="text-sm mt-1">Configure trading bots to see performance metrics</p>
        </div>
      </CardContent>
    </Card>
  );
}
