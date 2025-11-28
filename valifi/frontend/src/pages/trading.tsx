import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  TrendingUp,
  TrendingDown,
  Plus,
  Activity,
  DollarSign,
  BarChart3,
  RefreshCw,
  ShoppingCart,
} from 'lucide-react';
import { Switch } from '@/components/ui/switch';

const exchanges = [
  { value: 'binance', label: 'Binance' },
  { value: 'bybit', label: 'Bybit' },
  { value: 'kucoin', label: 'KuCoin' },
  { value: 'okx', label: 'OKX' },
  { value: 'coinbase', label: 'Coinbase' },
];

const marketAssets = [
  { symbol: 'BTC/USDT', type: 'crypto', name: 'Bitcoin' },
  { symbol: 'ETH/USDT', type: 'crypto', name: 'Ethereum' },
  { symbol: 'AAPL', type: 'stock', name: 'Apple Inc.' },
  { symbol: 'TSLA', type: 'stock', name: 'Tesla Inc.' },
  { symbol: 'EUR/USD', type: 'forex', name: 'Euro/US Dollar' },
  { symbol: 'gold', type: 'metal', name: 'Gold' },
  { symbol: 'silver', type: 'metal', name: 'Silver' },
];

const tradeOrderSchema = z.object({
  symbol: z.string().min(1, 'Symbol is required'),
  side: z.enum(['buy', 'sell']),
  type: z.enum(['market', 'limit']),
  quantity: z.string().min(1, 'Quantity is required'),
  price: z.string().optional(),
});

type TradeOrderFormValues = z.infer<typeof tradeOrderSchema>;

export default function TradingPage() {
  const { toast } = useToast();
  const [selectedAsset, setSelectedAsset] = useState<string>('BTC/USDT');
  const [tradeDialogOpen, setTradeDialogOpen] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);

  const { data: exchangeOrders, isLoading: ordersLoading } = useQuery({
    queryKey: ['/api/exchange/orders'],
    refetchInterval: autoRefresh ? 5000 : false,
  });

  const tradeForm = useForm<TradeOrderFormValues>({
    resolver: zodResolver(tradeOrderSchema),
    defaultValues: {
      symbol: selectedAsset,
      side: 'buy',
      type: 'market',
      quantity: '',
      price: '',
    },
  });

  const createOrderMutation = useMutation({
    mutationFn: async (data: TradeOrderFormValues) => {
      return apiRequest('/api/exchange/orders', {
        method: 'POST',
        body: JSON.stringify({
          ...data,
          quantity: parseFloat(data.quantity),
          price: data.price ? parseFloat(data.price) : undefined,
        }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/exchange/orders'] });
      toast({
        title: 'Order Placed',
        description: 'Your trading order has been submitted successfully.',
      });
      setTradeDialogOpen(false);
      tradeForm.reset();
    },
    onError: (error: Error) => {
      toast({
        title: 'Order Failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const cancelOrderMutation = useMutation({
    mutationFn: async (orderId: string) => {
      return apiRequest(`/api/exchange/orders/${orderId}`, { method: 'DELETE' });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/exchange/orders'] });
      toast({
        title: 'Order Cancelled',
        description: 'Your order has been cancelled successfully.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Cancellation Failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const handleTrade = (data: TradeOrderFormValues) => {
    createOrderMutation.mutate(data);
  };

  const getOrderStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-500';
      case 'pending':
        return 'bg-yellow-500';
      case 'cancelled':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Trading & Exchange</h1>
          <p className="text-muted-foreground">Trade crypto, stocks, forex, and precious metals</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Switch checked={autoRefresh} onCheckedChange={setAutoRefresh} />
            <span className="text-sm">Auto-refresh</span>
          </div>
          <Dialog open={tradeDialogOpen} onOpenChange={setTradeDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Place Order
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Place Trading Order</DialogTitle>
                <DialogDescription>
                  Create a new buy or sell order on the exchange.
                </DialogDescription>
              </DialogHeader>
              <Form {...tradeForm}>
                <form onSubmit={tradeForm.handleSubmit(handleTrade)} className="space-y-4">
                  <FormField
                    control={tradeForm.control}
                    name="symbol"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Asset</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select asset" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {marketAssets.map((asset) => (
                              <SelectItem key={asset.symbol} value={asset.symbol}>
                                {asset.name} ({asset.symbol})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={tradeForm.control}
                    name="side"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Side</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Buy or Sell" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="buy">Buy</SelectItem>
                            <SelectItem value="sell">Sell</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={tradeForm.control}
                    name="type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Order Type</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Market or Limit" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="market">Market</SelectItem>
                            <SelectItem value="limit">Limit</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={tradeForm.control}
                    name="quantity"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Quantity</FormLabel>
                        <FormControl>
                          <Input placeholder="Amount to trade" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  {tradeForm.watch('type') === 'limit' && (
                    <FormField
                      control={tradeForm.control}
                      name="price"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Limit Price</FormLabel>
                          <FormControl>
                            <Input placeholder="Price per unit" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                  <DialogFooter>
                    <Button type="submit" disabled={createOrderMutation.isPending}>
                      {createOrderMutation.isPending ? 'Placing...' : 'Place Order'}
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{exchangeOrders?.length || 0}</div>
            <p className="text-xs text-muted-foreground">Active and completed orders</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Orders</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {exchangeOrders?.filter((o: any) => o.status === 'pending').length || 0}
            </div>
            <p className="text-xs text-muted-foreground">Awaiting execution</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed Today</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {exchangeOrders?.filter((o: any) => o.status === 'completed').length || 0}
            </div>
            <p className="text-xs text-muted-foreground">Successful trades</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Your Orders</CardTitle>
          <CardDescription>View and manage your trading orders</CardDescription>
        </CardHeader>
        <CardContent>
          {ordersLoading ? (
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : exchangeOrders && exchangeOrders.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Symbol</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Side</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {exchangeOrders.map((order: any) => (
                  <TableRow key={order.id}>
                    <TableCell className="font-medium">{order.symbol}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{order.orderType}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={order.side === 'buy' ? 'default' : 'destructive'}>
                        {order.side}
                      </Badge>
                    </TableCell>
                    <TableCell>{order.quantity}</TableCell>
                    <TableCell>{order.price ? `$${order.price}` : 'Market'}</TableCell>
                    <TableCell>
                      <Badge className={getOrderStatusColor(order.status)}>{order.status}</Badge>
                    </TableCell>
                    <TableCell>
                      {order.status === 'pending' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => cancelOrderMutation.mutate(order.id)}
                          disabled={cancelOrderMutation.isPending}
                        >
                          Cancel
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No orders yet. Place your first order to get started.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
