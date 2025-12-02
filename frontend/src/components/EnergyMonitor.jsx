import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { energyAPI } from '../api/apiClient';

const EnergyMonitor = ({ householdId }) => {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchData();
    }, [householdId]);

    const fetchData = async () => {
        try {
            setLoading(true);
            const response = await energyAPI.getConsumption(householdId, 24);

            // Transform data for chart
            const chartData = processChartData(response.data);
            setData(chartData);
            setError(null);
        } catch (err) {
            setError('Failed to load energy consumption data');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const processChartData = (rawData) => {
        const hourlyData = {};

        rawData.forEach(item => {
            const hour = new Date(item.hour).getHours();
            if (!hourlyData[hour]) {
                hourlyData[hour] = {
                    hour: `${hour}:00`,
                    peak: 0,
                    normal: 0,
                    offPeak: 0,
                };
            }

            const label = item.usage_label?.toLowerCase().replace('-', '');
            if (label === 'peak') {
                hourlyData[hour].peak += parseFloat(item.avg_energy_kwh);
            } else if (label === 'normal') {
                hourlyData[hour].normal += parseFloat(item.avg_energy_kwh);
            } else if (label === 'offpeak') {
                hourlyData[hour].offPeak += parseFloat(item.avg_energy_kwh);
            }
        });

        return Object.values(hourlyData).sort((a, b) =>
            parseInt(a.hour) - parseInt(b.hour)
        );
    };

    if (loading) {
        return (
            <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-xl p-6 shadow-2xl">
                <div className="animate-pulse">
                    <div className="h-8 bg-slate-700 rounded w-1/3 mb-4"></div>
                    <div className="h-64 bg-slate-700 rounded"></div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-gradient-to-br from-red-900 to-red-800 rounded-xl p-6 shadow-2xl">
                <p className="text-red-200">{error}</p>
            </div>
        );
    }

    return (
        <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-xl p-6 shadow-2xl border border-slate-700">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-white">⚡ Real-Time Energy Monitor</h2>
                <button
                    onClick={fetchData}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl"
                >
                    Refresh
                </button>
            </div>

            <ResponsiveContainer width="100%" height={300}>
                <LineChart data={data}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis
                        dataKey="hour"
                        stroke="#94a3b8"
                        style={{ fontSize: '12px' }}
                    />
                    <YAxis
                        stroke="#94a3b8"
                        style={{ fontSize: '12px' }}
                        label={{ value: 'kWh', angle: -90, position: 'insideLeft', fill: '#94a3b8' }}
                    />
                    <Tooltip
                        contentStyle={{
                            backgroundColor: '#1e293b',
                            border: '1px solid #475569',
                            borderRadius: '8px'
                        }}
                        labelStyle={{ color: '#e2e8f0' }}
                    />
                    <Legend
                        wrapperStyle={{ paddingTop: '20px' }}
                        iconType="line"
                    />
                    <Line
                        type="monotone"
                        dataKey="peak"
                        stroke="#ef4444"
                        strokeWidth={3}
                        name="Peak Hours"
                        dot={{ fill: '#ef4444', r: 4 }}
                        activeDot={{ r: 6 }}
                    />
                    <Line
                        type="monotone"
                        dataKey="normal"
                        stroke="#f97316"
                        strokeWidth={3}
                        name="Normal Hours"
                        dot={{ fill: '#f97316', r: 4 }}
                        activeDot={{ r: 6 }}
                    />
                    <Line
                        type="monotone"
                        dataKey="offPeak"
                        stroke="#22c55e"
                        strokeWidth={3}
                        name="Off-Peak Hours"
                        dot={{ fill: '#22c55e', r: 4 }}
                        activeDot={{ r: 6 }}
                    />
                </LineChart>
            </ResponsiveContainer>

            <div className="mt-6 grid grid-cols-3 gap-4">
                <div className="bg-red-900/30 border border-red-500/50 rounded-lg p-4">
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                        <span className="text-red-300 font-semibold">Peak</span>
                    </div>
                    <p className="text-white text-xl mt-2 font-bold">
                        {data.reduce((sum, d) => sum + d.peak, 0).toFixed(2)} kWh
                    </p>
                </div>

                <div className="bg-orange-900/30 border border-orange-500/50 rounded-lg p-4">
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                        <span className="text-orange-300 font-semibold">Normal</span>
                    </div>
                    <p className="text-white text-xl mt-2 font-bold">
                        {data.reduce((sum, d) => sum + d.normal, 0).toFixed(2)} kWh
                    </p>
                </div>

                <div className="bg-green-900/30 border border-green-500/50 rounded-lg p-4">
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                        <span className="text-green-300 font-semibold">Off-Peak</span>
                    </div>
                    <p className="text-white text-xl mt-2 font-bold">
                        {data.reduce((sum, d) => sum + d.offPeak, 0).toFixed(2)} kWh
                    </p>
                </div>
            </div>
        </div>
    );
};

export default EnergyMonitor;
