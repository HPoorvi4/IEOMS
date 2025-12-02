import React from 'react';

const SmartInsights = () => {
    const insights = [
        {
            icon: '📈',
            title: 'Peak Hour Usage',
            message: 'You consume 23% more energy during peak hours',
            color: 'from-red-900/40 to-orange-900/40 border-red-500/50'
        },
        {
            icon: '💡',
            title: 'Savings Opportunity',
            message: 'Shifting dishwasher to 2 AM saves $12/month',
            color: 'from-blue-900/40 to-cyan-900/40 border-blue-500/50'
        },
        {
            icon: '🌡️',
            title: 'Temperature Insight',
            message: 'Your heating pattern suggests optimal temp is 22°C',
            color: 'from-purple-900/40 to-pink-900/40 border-purple-500/50'
        },
        {
            icon: '⚡',
            title: 'Efficiency Score',
            message: 'You are using 15% less energy than similar households',
            color: 'from-green-900/40 to-emerald-900/40 border-green-500/50'
        }
    ];

    return (
        <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-xl p-6 shadow-2xl border border-slate-700">
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
                <span>💎</span> Smart Insights
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {insights.map((insight, index) => (
                    <div
                        key={index}
                        className={`bg-gradient-to-br ${insight.color} border rounded-lg p-4 hover:scale-105 transition-transform duration-200 cursor-pointer`}
                    >
                        <div className="flex items-start gap-3">
                            <div className="text-3xl">{insight.icon}</div>
                            <div className="flex-1">
                                <h3 className="text-white font-semibold text-sm mb-1">
                                    {insight.title}
                                </h3>
                                <p className="text-slate-200 text-xs">
                                    {insight.message}
                                </p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="mt-6 bg-gradient-to-r from-yellow-900/40 to-orange-900/40 border border-yellow-500/50 rounded-lg p-4">
                <div className="flex items-center gap-2">
                    <span className="text-2xl">⭐</span>
                    <div>
                        <h3 className="text-yellow-200 font-semibold text-sm">Weekly Achievement</h3>
                        <p className="text-yellow-100 text-xs mt-1">
                            You've saved 47 kWh this week compared to last week! Keep it up! 🎉
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SmartInsights;
