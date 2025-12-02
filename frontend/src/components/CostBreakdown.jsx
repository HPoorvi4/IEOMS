import React, { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { energyAPI } from '../api/apiClient';

const CostBreakdown = ({ householdId }) => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const COLORS = ['#ef4444', '#f97316', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#ec4899', '#14b8a6'];

    useEffect(() => {
        fetchData();
    }, [householdId]);

    const fetchData = async () => {
        try {
            setLoading(true);
            const response = await energyAPI.getCostBreakdown(householdId, 30);
            setData(response.data);
            setError(null);
        } catch (err) {
            setError('Failed to load cost breakdown');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-xl p-6 shadow-2xl animate-pulse">
                <div className="h-6 bg-slate-700 rounded w-1/2 mb-4"></div>
                <div className="h-64 bg-slate-700 rounded"></div>
            </div>
        );
    }

    if (error || !data) {
        return (
            <div className="bg-gradient-to-br from-red-900 to-red-800 rounded-xl p-6 shadow-2xl">
                <p className="text-red-200">{error || 'No data available'}</p>
            </div>
        );
    }

    const chartData = data.breakdown.map(item => ({
        name: item.appliance,
        value: parseFloat(item.totalCost),
        percentage: parseFloat(item.percentage)
    }));

    return (
        <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-xl p-6 shadow-2xl border border-slate-700">
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
                <span>💰</span> Cost Breakdown
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Pie Chart */}
                <div>
                    <ResponsiveContainer width="100%" height={250}>
                        <PieChart>
                            <Pie
                                data={chartData}
                                cx="50%"
                                cy="50%"
                                labelLine={false}
                                label={({ percentage }) => `${percentage.toFixed(1)}%`}
                                outerRadius={80}
                                fill="#8884d8"
                                dataKey="value"
                            >
                                {chartData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: '#1e293b',
                                    border: '1px solid #475569',
                                    borderRadius: '8px'
                                }}
                            />
                        </PieChart>
                    </ResponsiveContainer>

                    <div className="mt-4 bg-gradient-to-r from-blue-900/50 to-purple-900/50 border border-blue-500/50 rounded-lg p-4">
                        <p className="text-blue-200 text-sm">Total Monthly Cost</p>
                        <p className="text-white text-3xl font-bold">${data.totalCost}</p>
                        <p className="text-blue-300 text-xs mt-1">Cost per kWh: ${data.costPerKwh}</p>
                    </div>
                </div>

                {/* Breakdown List */}
                <div className="space-y-2 max-h-80 overflow-y-auto">
                    {data.breakdown.map((item, index) => (
                        <div
                            key={index}
                            className="bg-slate-800/50 border border-slate-600 rounded-lg p-3 hover:bg-slate-700/50 transition-all duration-200"
                        >
                            <div className="flex items-center justify-between mb-1">
                                <div className="flex items-center gap-2">
                                    <div
                                        className="w-3 h-3 rounded-full"
                                        style={{ backgroundColor: COLORS[index % COLORS.length] }}
                                    ></div>
                                    <span className="text-white font-semibold text-sm">{item.appliance}</span>
                                </div>
                                <span className="text-emerald-400 font-bold">${item.totalCost}</span>
                            </div>
                            <div className="flex justify-between text-xs text-slate-400">
                                <span>{item.totalKwh} kWh</span>
                                <span>{item.percentage}% of total</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default CostBreakdown;
