import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

const data = [
  { name: 'BTC', value: 2.5, usd: 175000 },
  { name: 'ETH', value: 10, usd: 35000 },
  { name: 'SOL', value: 100, usd: 15000 },
  { name: 'DOGE', value: 100000, usd: 12000 },
];

export default function AdvancedPortfolioWidget() {
  return (
    <Card className="h-full flex flex-col bg-gray-800 text-white">
      <CardHeader>
        <CardTitle>Advanced Portfolio</CardTitle>
      </CardHeader>
      <CardContent className="flex-grow">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#444" />
            <XAxis dataKey="name" stroke="#fff" />
            <YAxis stroke="#fff" />
            <Tooltip
              contentStyle={{ backgroundColor: '#333', border: 'none' }}
              labelStyle={{ color: '#fff' }}
            />
            <Legend wrapperStyle={{ color: '#fff' }} />
            <Bar dataKey="usd" fill="#82ca9d" name="USD Value" />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
