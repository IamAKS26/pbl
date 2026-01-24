import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';

const PerformanceChart = ({ data }) => {
    if (!data || data.length === 0) {
        return (
            <div className="h-48 flex items-center justify-center text-gray-400 text-sm italic">
                No performance data available yet. Complete a task to see your growth!
            </div>
        );
    }

    return (
        <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                        <linearGradient id="colorXp" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                            <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                        </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                    <XAxis
                        dataKey="date"
                        stroke="#9CA3AF"
                        fontSize={11}
                        tickLine={false}
                        axisLine={false}
                        tickMargin={10}
                        tickFormatter={(value) => {
                            try {
                                const date = new Date(value);
                                return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
                            } catch (e) {
                                return value;
                            }
                        }}
                    />
                    <YAxis
                        stroke="#9CA3AF"
                        fontSize={11}
                        tickLine={false}
                        axisLine={false}
                        tickMargin={10}
                    />
                    <Tooltip
                        contentStyle={{
                            backgroundColor: 'rgba(255, 255, 255, 0.95)',
                            borderRadius: '12px',
                            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                            border: 'none',
                            fontSize: '12px',
                            padding: '12px'
                        }}
                        formatter={(value) => [<span className="font-bold text-emerald-600">+{value} XP</span>, 'Total XP']}
                        labelFormatter={(label) => {
                            try {
                                return new Date(label).toLocaleString(undefined, {
                                    weekday: 'short',
                                    month: 'short',
                                    day: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                });
                            } catch (e) {
                                return label;
                            }
                        }}
                    />
                    <Area
                        type="monotone"
                        dataKey="xp"
                        stroke="#059669"
                        fillOpacity={1}
                        fill="url(#colorXp)"
                        strokeWidth={3}
                        activeDot={{ r: 6, strokeWidth: 0, fill: '#059669' }}
                        animationDuration={1500}
                    />
                </AreaChart>
            </ResponsiveContainer>
        </div>
    );

};

export default PerformanceChart;
