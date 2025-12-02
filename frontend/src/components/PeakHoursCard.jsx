import React, { useState, useEffect } from 'react';
import { energyAPI } from '../api/apiClient';

const PeakHoursCard = ({ householdId }) => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchData();
    }, [householdId]);

    const fetchData = async () => {
        try {
            setLoading(true);
            const response = await energyAPI.getPeakHours(householdId);
            setData(response.data);
            setError(null);
        } catch (err) {
            setError('Failed to load peak hours data');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const getPeakRange = (hours) => {
        if (!hours || hours.length === 0) return 'No data';

        const topHours = hours
            .sort((a, b) => b.frequency - a.frequency)
            .slice(0, 5)
            .map(h => h.hour)
            .sort((a, b) => a - b);

        if (topHours.length === 0) return 'No data';

        const ranges = [];
        let start = topHours[0];
        let end = topHours[0];

        for (let i = 1; i < topHours.length; i++) {
            if (topHours[i] === end + 1) {
                end = topHours[i];
            } else {
                ranges.push(`${start}:00-${end}:00`);
                start = topHours[i];
                end = topHours[i];
            }
        }
        ranges.push(`${start}:00-${end}:00`);

        return ranges.join(', ');
    };

    const getAvgConsumption = (hours) => {
        if (!hours || hours.length === 0) return 0;
        const total = hours.reduce((sum, h) => sum + h.avgEnergy, 0);
        return (total / hours.length).toFixed(2);
    };

    const getMaxConsumption = () => {
        if (!data) return 0;
        const allAvg = [
            parseFloat(getAvgConsumption(data.peak)),
            parseFloat(getAvgConsumption(data.normal)),
            parseFloat(getAvgConsumption(data.offPeak))
        ];
        return Math.max(...allAvg);
    };

    if (loading) {
        return (
            <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-6 shadow-2xl border border-slate-700 animate-pulse">
                <div className="h-6 bg-slate-700 rounded w-2/3 mb-6"></div>
                <div className="space-y-4">
                    <div className="h-20 bg-slate-700 rounded-xl"></div>
                    <div className="h-20 bg-slate-700 rounded-xl"></div>
                    <div className="h-20 bg-slate-700 rounded-xl"></div>
                </div>
            </div>
        );
    }

    if (error || !data) {
        return (
            <div className="bg-gradient-to-br from-red-900 to-red-800 rounded-2xl p-6 shadow-2xl">
                <p className="text-red-200">{error || 'No data available'}</p>
            </div>
        );
    }

    const maxConsumption = getMaxConsumption();

    const periods = [
        {
            id: 'peak',
            label: 'Peak Hours',
            icon: '🔴',
            data: data.peak,
            gradient: 'from-red-600 to-red-500',
            bgGradient: 'from-red-900/40 to-red-800/20',
            borderColor: 'border-red-500/30',
            textColor: 'text-red-300',
            valueColor: 'text-red-100',
            barColor: 'bg-gradient-to-r from-red-500 to-pink-500'
        },
        {
            id: 'normal',
            label: 'Normal Hours',
            icon: '🟡',
            data: data.normal,
            gradient: 'from-orange-600 to-orange-500',
            bgGradient: 'from-orange-900/40 to-orange-800/20',
            borderColor: 'border-orange-500/30',
            textColor: 'text-orange-300',
            valueColor: 'text-orange-100',
            barColor: 'bg-gradient-to-r from-orange-500 to-yellow-500'
        },
        {
            id: 'offpeak',
            label: 'Off-Peak Hours',
            icon: '🟢',
            data: data.offPeak,
            gradient: 'from-green-600 to-green-500',
            bgGradient: 'from-green-900/40 to-green-800/20',
            borderColor: 'border-green-500/30',
            textColor: 'text-green-300',
            valueColor: 'text-green-100',
            barColor: 'bg-gradient-to-r from-green-500 to-emerald-500'
        }
    ];

    return (
        <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-2xl p-6 shadow-2xl border border-slate-700 hover:border-slate-600 transition-all duration-300">
            {/* Header */}
            <div className="mb-6">
                <h2 className="text-2xl font-bold text-white mb-1 flex items-center gap-2">
                    <span className="text-2xl">⚡</span>
                    <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                        Peak Hours Analysis
                    </span>
                </h2>
                <p className="text-slate-400 text-sm">Energy consumption patterns throughout the day</p>
            </div>

            {/* Period Cards */}
            <div className="space-y-3">
                {periods.map((period) => {
                    const avg = parseFloat(getAvgConsumption(period.data));
                    const percentage = maxConsumption > 0 ? (avg / maxConsumption) * 100 : 0;

                    return (
                        <div
                            key={period.id}
                            className={`relative overflow-hidden rounded-xl border ${period.borderColor} bg-gradient-to-br ${period.bgGradient} backdrop-blur-sm transition-all duration-300 hover:scale-[1.02] hover:shadow-lg hover:${period.borderColor.replace('/30', '/60')}`}
                        >
                            <div className="p-4">
                                {/* Header Row */}
                                <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center gap-2">
                                        <span className="text-xl">{period.icon}</span>
                                        <h3 className={`font-semibold ${period.textColor}`}>
                                            {period.label}
                                        </h3>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className={`px-3 py-1 rounded-full bg-gradient-to-r ${period.gradient} text-white text-xs font-bold shadow-lg`}>
                                            {avg} kWh
                                        </div>
                                    </div>
                                </div>

                                {/* Time Range */}
                                <div className="mb-3">
                                    <div className="flex items-center gap-2">
                                        <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        <span className={`font-mono text-sm ${period.valueColor} font-medium`}>
                                            {getPeakRange(period.data)}
                                        </span>
                                    </div>
                                </div>

                                {/* Energy Bar */}
                                <div className="relative">
                                    <div className="w-full h-2 bg-slate-800/50 rounded-full overflow-hidden">
                                        <div
                                            className={`h-full ${period.barColor} transition-all duration-500 ease-out shadow-lg`}
                                            style={{ width: `${percentage}%` }}
                                        >
                                            <div className="w-full h-full opacity-50 animate-pulse"></div>
                                        </div>
                                    </div>
                                    <div className="flex justify-between mt-1">
                                        <span className="text-xs text-slate-500">0 kWh</span>
                                        <span className="text-xs text-slate-500">{maxConsumption.toFixed(2)} kWh</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Savings Tip */}
            <div className="mt-4 bg-gradient-to-r from-blue-900/30 to-purple-900/30 border border-blue-500/30 rounded-xl p-4 backdrop-blur-sm">
                <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
                        <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                    </div>
                    <div className="flex-1">
                        <h4 className="text-blue-300 font-semibold text-sm mb-1">💡 Energy Saving Tip</h4>
                        <p className="text-blue-200 text-xs leading-relaxed">
                            Shift high-energy appliances like washing machines and dishwashers to <span className="font-bold text-green-300">off-peak hours</span> to reduce costs by up to 30%
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PeakHoursCard;
