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
import type { BurndownData } from '../types/dashboard';

export function BurndownChart({ data }: { data: BurndownData }) {
    const dateMap = new Map<
        string,
        {
            date: string;
            İdeal?: number;
            'Kalan SP'?: number;
        }
    >();

    data.idealLine.forEach((point) => {
        const date = point.date.slice(0, 10);

        dateMap.set(date, {
            ...(dateMap.get(date) ?? { date }),
            date,
            İdeal: point.remainingPoints,
        });
    });

    data.actualLine.forEach((point) => {
        const date = point.date.slice(0, 10);

        dateMap.set(date, {
            ...(dateMap.get(date) ?? { date }),
            date,
            'Kalan SP': point.remainingPoints,
        });
    });

    const chartData = Array.from(dateMap.values()).sort(
        (a, b) =>
            new Date(a.date).getTime() -
            new Date(b.date).getTime()
    );

    return (
        <ResponsiveContainer width="100%" height={220}>
            <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />

                <XAxis
                    dataKey="date"
                    tick={{ fontSize: 11 }}
                />

                <YAxis
                    tick={{ fontSize: 11 }}
                    domain={[0, 'auto']}
                    allowDecimals={false}
                    label={{
                        value: 'Remaining SP',
                        angle: -90,
                        position: 'insideLeft',
                        style: { fontSize: 11 },
                    }}
                />

                <Tooltip />

                <Legend />

                <Line
                    type="monotone"
                    dataKey="İdeal"
                    stroke="#c7d2fe"
                    strokeDasharray="4 4"
                    dot={false}
                />

                <Line
                    type="monotone"
                    dataKey="Kalan SP"
                    stroke="#4f46e5"
                    strokeWidth={2}
                    dot={{ r: 3 }}
                />
            </LineChart>
        </ResponsiveContainer>
    );
}