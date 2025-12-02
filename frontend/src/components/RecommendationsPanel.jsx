import React, { useState, useEffect } from 'react';
import { energyAPI } from '../api/apiClient';

const RecommendationsPanel = ({ householdId }) => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchData();
    }, [householdId]);

    const fetchData = async () => {
        try {
            setLoading(true);
            const response = await energyAPI.getRecommendations(householdId);
            setData(response.data);
            setError(null);
        } catch (err) {
            setError('Failed to load recommendations');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const getPriorityColor = (priority) => {
        switch (priority?.toLowerCase()) {
            case 'high':
                return 'border-red-500/50 bg-red-900/30';
            case 'medium':
                return 'border-yellow-500/50 bg-yellow-900/30';
            case 'low':
                return 'border-green-500/50 bg-green-900/30';
            default:
                return 'border-blue-500/50 bg-blue-900/30';
        }
    };

    const getPriorityIcon = (priority) => {
        switch (priority?.toLowerCase()) {
            case 'high':
                return '🔴';
            case 'medium':
                return '🟡';
            case 'low':
                return '🟢';
            default:
                return '🔵';
        }
    };

    if (loading) {
        return (
            <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-xl p-6 shadow-2xl">
                <div className="animate-pulse">
                    <div className="h-6 bg-slate-700 rounded w-1/2 mb-4"></div>
                    <div className="h-20 bg-slate-700 rounded mb-3"></div>
                    <div className="h-20 bg-slate-700 rounded mb-3"></div>
                    <div className="h-20 bg-slate-700 rounded"></div>
                </div>
            </div>
        );
    }

    if (error || !data) {
        return (
            <div className="bg-gradient-to-br from-red-900 to-red-800 rounded-xl p-6 shadow-2xl">
                <p className="text-red-200">{error || 'No recommendations available'}</p>
                <button
                    onClick={fetchData}
                    className="mt-4 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-all duration-200"
                >
                    Retry
                </button>
            </div>
        );
    }

    return (
        <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-xl p-6 shadow-2xl border border-slate-700">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                    <span>🤖</span> AI Recommendations
                </h2>
                <button
                    onClick={fetchData}
                    className="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl text-sm"
                >
                    Generate New
                </button>
            </div>

            <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
                {data.recommendations.map((rec, index) => (
                    <div
                        key={rec.id || index}
                        className={`border rounded-lg p-4 hover:shadow-lg transition-all duration-200 ${getPriorityColor(rec.priority)}`}
                    >
                        <div className="flex items-start justify-between mb-2">
                            <div className="flex items-start gap-2 flex-1">
                                <span className="text-2xl">{getPriorityIcon(rec.priority)}</span>
                                <div className="flex-1">
                                    <h3 className="text-white font-semibold text-sm mb-1">
                                        {rec.action}
                                    </h3>
                                    {rec.steps && rec.steps.length > 0 && (
                                        <ul className="text-slate-300 text-xs space-y-1 mt-2">
                                            {rec.steps.slice(0, 3).map((step, i) => (
                                                <li key={i} className="flex items-start gap-1">
                                                    <span className="text-blue-400">•</span>
                                                    <span>{step}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    )}
                                </div>
                            </div>

                            <div className="text-right ml-4">
                                <div className="bg-emerald-900/50 border border-emerald-500/50 rounded px-2 py-1">
                                    <p className="text-emerald-300 text-xs">Savings</p>
                                    <p className="text-white font-bold text-sm">
                                        ${rec.savings_usd || (rec.savings_kwh * 0.12).toFixed(2)}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-2 mt-3">
                            <button className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded transition-all duration-200">
                                Learn More
                            </button>
                            <button className="px-3 py-1 bg-slate-700 hover:bg-slate-600 text-white text-xs rounded transition-all duration-200">
                                Schedule Later
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {data.recommendations.length === 0 && (
                <div className="text-center py-8 text-slate-400">
                    <p>No recommendations available at this time.</p>
                    <button
                        onClick={fetchData}
                        className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-all duration-200"
                    >
                        Generate Recommendations
                    </button>
                </div>
            )}
        </div>
    );
};

export default RecommendationsPanel;
