import React from 'react';

const HeatmapChart = ({ householdId }) => {
    // Simplified heatmap - shows placeholder structure
    // In production, this would fetch hourly data for each day of the week

    const hours = Array.from({ length: 24 }, (_, i) => i);
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    // Mock data - in production this would come from API
    const getIntensity = (day, hour) => {
        // Simulate peak hours (evening) and off-peak (night)
        if (hour >= 18 && hour <= 22) return 'high';
        if (hour >= 0 && hour <= 6) return 'low';
        return 'medium';
    };

    const getColor = (intensity) => {
        switch (intensity) {
            case 'high':
                return 'bg-red-500';
            case 'medium':
                return 'bg-orange-500';
            case 'low':
                return 'bg-green-500';
            default:
                return 'bg-slate-600';
        }
    };

    return (
        <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-xl p-6 shadow-2xl border border-slate-700">
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
                <span>🗓️</span> Usage Pattern Heatmap
            </h2>

            <div className="overflow-x-auto">
                <div className="inline-block min-w-full">
                    {/* Hour labels */}
                    <div className="flex mb-2">
                        <div className="w-12"></div>
                        {hours.map(hour => (
                            <div key={hour} className="w-6 text-xs text-slate-400 text-center">
                                {hour % 6 === 0 ? hour : ''}
                            </div>
                        ))}
                    </div>

                    {/* Heatmap grid */}
                    {days.map(day => (
                        <div key={day} className="flex items-center mb-1">
                            <div className="w-12 text-sm text-slate-300 font-semibold">{day}</div>
                            {hours.map(hour => {
                                const intensity = getIntensity(day, hour);
                                return (
                                    <div
                                        key={`${day}-${hour}`}
                                        className={`w-6 h-6 ${getColor(intensity)} rounded-sm mr-0.5 hover:scale-110 transition-transform cursor-pointer`}
                                        title={`${day} ${hour}:00 - ${intensity}`}
                                    ></div>
                                );
                            })}
                        </div>
                    ))}
                </div>
            </div>

            {/* Legend */}
            <div className="mt-6 flex items-center justify-center gap-6">
                <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-green-500 rounded"></div>
                    <span className="text-slate-300 text-sm">Low (Off-Peak)</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-orange-500 rounded"></div>
                    <span className="text-slate-300 text-sm">Medium (Normal)</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-red-500 rounded"></div>
                    <span className="text-slate-300 text-sm">High (Peak)</span>
                </div>
            </div>
        </div>
    );
};

export default HeatmapChart;
