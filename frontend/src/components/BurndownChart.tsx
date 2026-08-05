import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import type { BurndownData } from '../types/dashboard';

export function BurndownChart({ data }: { data: BurndownData }) {
    // Ideal ve actual noktalarini tarihe gore birlestiriyoruz -- Recharts tek bir data array bekliyor
    const dateMap = new Map<string, { date: string; İdeal?: number; Gerçekleşen?: number }>();

    data.idealLine.forEach((p) => {
        const key = new Date(p.date).toLocaleDateString('tr-TR');
        dateMap.set(key, { ...(dateMap.get(key) ?? { date: key }), date: key, İdeal: p.remainingPoints });
    });

    data.actualLine.forEach((p) => {
        const key = new Date(p.date).toLocaleDateString('tr-TR');
        dateMap.set(key, { ...(dateMap.get(key) ?? { date: key }), date: key, Gerçekleşen: p.remainingPoints });
    });

    const chartData = Array.from(dateMap.values()).sort(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    if (data.actualLine.length === 0) {
        return (
            <div>
                <ResponsiveContainer width="100%" height={220}>
                    <LineChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                        <YAxis tick={{ fontSize: 11 }} />
                        <Tooltip />
                        <Legend />
                        <Line type="monotone" dataKey="İdeal" stroke="#c7d2fe" strokeDasharray="4 4" dot={false} />
                    </LineChart>
                </ResponsiveContainer>
                <p className="text-xs text-gray-400 mt-1">
                    Gerçekleşen çizgi henüz veri toplamıyor — günlük anlık görüntüler birikmeye başladıkça görünecek.
                </p>
            </div>
        );
    }

    return (
        <ResponsiveContainer width="100%" height={220}>
            <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="İdeal" stroke="#c7d2fe" strokeDasharray="4 4" dot={false} />
                <Line type="monotone" dataKey="Gerçekleşen" stroke="#4f46e5" strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
        </ResponsiveContainer>
    );
}