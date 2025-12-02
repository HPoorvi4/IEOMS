import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { energyAPI } from '../api/apiClient';

const ForecastPanel = ({ householdId }) => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchData();
    }, [householdId]);

    const fetchData = async () => {
        try {
            setLoading(true);
            const response = await energyAPI.getForecasts(householdId, 7);
            setData(response.data);
            setError(null);
        } catch (err) {
            setError('Failed to load forecast data');
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

    const chartData = data.forecasts.map(day => ({
        date: new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        predicted: parseFloat(day.totalPredicted).toFixed(2)
    }));

    return (
        <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-xl p-6 shadow-2xl border border-slate-700">
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
                <span>📊</span> Energy Forecast (Next 7 Days)
            </h2>

            <div className="mb-6">
                <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                        <XAxis
                            dataKey="date"
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
                        />
                        <Bar dataKey="predicted" fill="#3b82f6" radius={[8, 8, 0, 0]} />
                    </BarChart>
                </ResponsiveContainer>
            </div>

            {/* Metrics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-blue-900/30 border border-blue-500/50 rounded-lg p-3">
                    <p className="text-blue-300 text-xs mb-1">Total Predicted</p>
                    <p className="text-white text-xl font-bold">{data.summary.totalPredicted} kWh</p>
                </div>

                <div className="bg-green-900/30 border border-green-500/50 rounded-lg p-3">
                    <p className="text-green-300 text-xs mb-1">R² Score</p>
                    <p className="text-white text-xl font-bold">{data.metrics.r2}</p>
                </div>

                <div className="bg-purple-900/30 border border-purple-500/50 rounded-lg p-3">
                    <p className="text-purple-300 text-xs mb-1">MAE</p>
                    <p className="text-white text-xl font-bold">{data.metrics.mae}</p>
                </div>

                <div className="bg-pink-900/30 border border-pink-500/50 rounded-lg p-3">
                    <p className="text-pink-300 text-xs mb-1">RMSE</p>
                    <p className="text-white text-xl font-bold">{data.metrics.rmse}</p>
                </div>
            </div>

            {/* Model Info */}
            <div className="bg-gradient-to-r from-indigo-900/50 to-purple-900/50 border border-indigo-500/50 rounded-lg p-4">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-indigo-200 text-sm">Model Version</p>
                        <p className="text-white font-semibold">{data.summary.modelVersion}</p>
                    </div>
                    <div className="text-right">
                        <p className="text-indigo-200 text-sm">Confidence</p>
                        <p className="text-white font-semibold">{(parseFloat(data.summary.avgConfidence) * 100).toFixed(0)}%</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ForecastPanel;
