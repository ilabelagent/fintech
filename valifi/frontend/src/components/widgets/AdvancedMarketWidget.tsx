import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

const data = [
  { name: 'Jan', BTC: 4000, ETH: 2400 },
  { name: 'Feb', BTC: 3000, ETH: 1398 },
  { name: 'Mar', BTC: 2000, ETH: 9800 },
  { name: 'Apr', BTC: 2780, ETH: 3908 },
  { name: 'May', BTC: 1890, ETH: 4800 },
  { name: 'Jun', BTC: 2390, ETH: 3800 },
  { name: 'Jul', BTC: 3490, ETH: 4300 },
];

export default function AdvancedMarketWidget() {
  return (
    <Card className="h-full flex flex-col bg-gray-800 text-white">
      <CardHeader>
        <CardTitle>Advanced Market</CardTitle>
      </CardHeader>
      <CardContent className="flex-grow">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#444" />
            <XAxis dataKey="name" stroke="#fff" />
            <YAxis stroke="#fff" />
            <Tooltip
              contentStyle={{ backgroundColor: '#333', border: 'none' }}
              labelStyle={{ color: '#fff' }}
            />
            <Legend wrapperStyle={{ color: '#fff' }} />
            <Line type="monotone" dataKey="BTC" stroke="#8884d8" name="Bitcoin" />
            <Line type="monotone" dataKey="ETH" stroke="#82ca9d" name="Ethereum" />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
