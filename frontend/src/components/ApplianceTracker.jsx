import React, { useState, useEffect } from 'react';
import { energyAPI } from '../api/apiClient';

const ApplianceTracker = ({ householdId }) => {
    const [rawData, setRawData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [filter, setFilter] = useState('all');
    const [sortBy, setSortBy] = useState('cost');

    useEffect(() => {
        fetchData();
    }, [householdId]);

    const fetchData = async () => {
        try {
            setLoading(true);
            // Fetch both consumption and cost breakdown data
            const [consumptionRes, costRes] = await Promise.all([
                energyAPI.getConsumption(householdId, 24),
                energyAPI.getCostBreakdown(householdId, 30)
            ]);

            // Combine the data
            const consumption = consumptionRes.data;
            const costData = costRes.data;

            // Group consumption by appliance and usage_label
            const applianceData = {};
            consumption.forEach(item => {
                const key = `${item.appliance_type}_${item.usage_label}`;
                if (!applianceData[key]) {
                    applianceData[key] = {
                        appliance: item.appliance_type,
                        usageLabel: item.usage_label,
                        totalKwh: 0,
                        totalCost: 0,
                        count: 0
                    };
                }
                applianceData[key].totalKwh += parseFloat(item.avg_energy_kwh || 0);
                applianceData[key].totalCost += parseFloat(item.avg_cost_usd || 0);
                applianceData[key].count += 1;
            });

            // Convert to array and calculate percentages
            const applianceArray = Object.values(applianceData);
            const totalCost = applianceArray.reduce((sum, item) => sum + item.totalCost, 0);

            applianceArray.forEach(item => {
                item.percentage = totalCost > 0 ? ((item.totalCost / totalCost) * 100).toFixed(1) : 0;
                item.totalKwh = item.totalKwh.toFixed(2);
                item.totalCost = item.totalCost.toFixed(2);
            });

            setRawData({ breakdown: applianceArray, totalCost: totalCost.toFixed(2) });
            setError(null);
        } catch (err) {
            setError('Failed to load appliance data');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-xl p-6 shadow-2xl animate-pulse">
                <div className="h-6 bg-slate-700 rounded w-1/2 mb-4"></div>
                <div className="h-48 bg-slate-700 rounded"></div>
            </div>
        );
    }

    if (error || !rawData) {
        return (
            <div className="bg-gradient-to-br from-red-900 to-red-800 rounded-xl p-6 shadow-2xl">
                <p className="text-red-200">{error || 'No data available'}</p>
            </div>
        );
    }

    // Apply filter
    const filteredData = rawData.breakdown.filter(appliance => {
        if (filter === 'all') return true;
        if (filter === 'peak') return appliance.usageLabel === 'Peak';
        if (filter === 'normal') return appliance.usageLabel === 'Normal';
        if (filter === 'off-peak') return appliance.usageLabel === 'Off-Peak';
        return true;
    });

    // Apply sort
    const sortedData = [...filteredData].sort((a, b) => {
        if (sortBy === 'cost') return parseFloat(b.totalCost) - parseFloat(a.totalCost);
        if (sortBy === 'kwh') return parseFloat(b.totalKwh) - parseFloat(a.totalKwh);
        return 0;
    });

    return (
        <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-xl p-6 shadow-2xl border border-slate-700">
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
                <span>🔌</span> Appliance Tracker
            </h2>

            {/* Filters */}
            <div className="flex flex-wrap gap-4 mb-6">
                <div className="flex gap-2">
                    <button
                        onClick={() => setFilter('all')}
                        className={`px-3 py-1 rounded-lg text-sm transition-all duration-200 ${filter === 'all'
                            ? 'bg-blue-600 text-white shadow-lg'
                            : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                            }`}
                    >
                        All ({rawData.breakdown.length})
                    </button>
                    <button
                        onClick={() => setFilter('peak')}
                        className={`px-3 py-1 rounded-lg text-sm transition-all duration-200 ${filter === 'peak'
                            ? 'bg-red-600 text-white shadow-lg'
                            : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                            }`}
                    >
                        Peak ({rawData.breakdown.filter(a => a.usageLabel === 'Peak').length})
                    </button>
                    <button
                        onClick={() => setFilter('normal')}
                        className={`px-3 py-1 rounded-lg text-sm transition-all duration-200 ${filter === 'normal'
                            ? 'bg-orange-600 text-white shadow-lg'
                            : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                            }`}
                    >
                        Normal ({rawData.breakdown.filter(a => a.usageLabel === 'Normal').length})
                    </button>
                    <button
                        onClick={() => setFilter('off-peak')}
                        className={`px-3 py-1 rounded-lg text-sm transition-all duration-200 ${filter === 'off-peak'
                            ? 'bg-green-600 text-white shadow-lg'
                            : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                            }`}
                    >
                        Off-Peak ({rawData.breakdown.filter(a => a.usageLabel === 'Off-Peak').length})
                    </button>
                </div>

                <div className="ml-auto flex gap-2">
                    <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value)}
                        className="px-3 py-1 bg-slate-700 text-slate-300 rounded-lg text-sm border border-slate-600 focus:outline-none focus:border-blue-500 cursor-pointer"
                    >
                        <option value="cost">Sort by Cost</option>
                        <option value="kwh">Sort by kWh</option>
                    </select>
                </div>
            </div>

            {/* Results count */}
            <p className="text-slate-400 text-sm mb-4">
                Showing {sortedData.length} appliance{sortedData.length !== 1 ? 's' : ''}
                {filter !== 'all' && ` in ${filter} hours`}
            </p>

            {/* Appliance List */}
            <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
                {sortedData.length === 0 ? (
                    <div className="text-center text-slate-400 py-8">
                        No appliances found for this filter
                    </div>
                ) : (
                    sortedData.map((appliance, index) => (
                        <div
                            key={index}
                            className="bg-slate-800/50 border border-slate-600 rounded-lg p-4 hover:bg-slate-700/50 hover:border-blue-500/50 transition-all duration-200 cursor-pointer"
                        >
                            <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center text-xl">
                                        {appliance.appliance.includes('Heater') ? '🔥' :
                                            appliance.appliance.includes('Conditioning') ? '❄️' :
                                                appliance.appliance.includes('Dishwasher') ? '🍽️' :
                                                    appliance.appliance.includes('Washer') ? '👕' :
                                                        appliance.appliance.includes('Dryer') ? '🌀' :
                                                            appliance.appliance.includes('Refrigerator') ? '🧊' :
                                                                appliance.appliance.includes('Oven') ? '🍳' : '⚡'}
                                    </div>
                                    <div>
                                        <h3 className="text-white font-semibold">{appliance.appliance}</h3>
                                        <div className="flex items-center gap-2">
                                            <span className={`text-xs px-2 py-0.5 rounded ${appliance.usageLabel === 'Peak' ? 'bg-red-900/50 text-red-300' :
                                                appliance.usageLabel === 'Normal' ? 'bg-orange-900/50 text-orange-300' :
                                                    'bg-green-900/50 text-green-300'
                                                }`}>
                                                {appliance.usageLabel}
                                            </span>
                                            <span className="text-slate-400 text-xs">{appliance.count} readings</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="text-right">
                                    <p className="text-emerald-400 font-bold text-lg">${appliance.totalCost}</p>
                                    <p className="text-slate-400 text-xs">{appliance.totalKwh} kWh</p>
                                </div>
                            </div>

                            {/* Progress bar */}
                            <div className="mt-2">
                                <div className="w-full bg-slate-700 rounded-full h-2">
                                    <div
                                        className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-300"
                                        style={{ width: `${appliance.percentage}%` }}
                                    ></div>
                                </div>
                                <p className="text-slate-400 text-xs mt-1">{appliance.percentage}% of total cost</p>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default ApplianceTracker;
