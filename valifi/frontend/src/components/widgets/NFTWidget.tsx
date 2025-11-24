import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function NFTWidget() {
  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">NFT Gallery</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-center py-8 text-muted-foreground">
          <p>No NFTs found</p>
          <p className="text-sm mt-1">Connect a wallet to view your NFT collection</p>
        </div>
      </CardContent>
    </Card>
  );
}
