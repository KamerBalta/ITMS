import { useNavigate } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import type { VelocityItem } from '../types/dashboard';

export function VelocityChart({ data }: { data: VelocityItem[] }) {
    const navigate = useNavigate();

    if (data.length === 0) return <p className="text-sm text-gray-400">Henüz tamamlanmış sprint yok.</p>;

    const chartData = data.map((d) => ({
        id: d.sprintId,
        name: d.sprintName,
        Taahhüt: d.committedPoints,
        Tamamlanan: d.completedPoints,
    }));

    return (
        <ResponsiveContainer width="100%" height={Math.max(200, data.length * 50)}>
            <BarChart
                data={chartData}
                layout="vertical"
                onClick={(e) => {
                    const point = e?.activePayload?.[0]?.payload;
                    if (point?.id) navigate(`/sprints/${point.id}`);
                }}
            >
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" />
                <YAxis type="category" dataKey="name" width={120} tick={{ fontSize: 12 }} />
                <Tooltip />
                <Legend />
                <Bar dataKey="Taahhüt" fill="#c7d2fe" cursor="pointer" />
                <Bar dataKey="Tamamlanan" fill="#4f46e5" cursor="pointer" />
            </BarChart>
        </ResponsiveContainer>
    );
}