import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function P2POrdersWidget() {
  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">P2P Orders</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-center py-8 text-muted-foreground">
          <p>No active P2P orders</p>
          <p className="text-sm mt-1">Visit P2P Trading to create or accept offers</p>
        </div>
      </CardContent>
    </Card>
  );
}
