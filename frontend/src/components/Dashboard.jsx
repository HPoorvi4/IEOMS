import React, { useState } from 'react';
import EnergyMonitor from './EnergyMonitor';
import PeakHoursCard from './PeakHoursCard';
import CostBreakdown from './CostBreakdown';
import ForecastPanel from './ForecastPanel';
import RecommendationsPanel from './RecommendationsPanel';
import ApplianceTracker from './ApplianceTracker';
import SmartInsights from './SmartInsights';
import UploadDataPanel from './UploadDataPanel';
import { energyAPI } from '../api/apiClient';
import { generatePDFReport } from '../utils/pdfExport';

function Dashboard() {
    const [householdId] = useState(1);
    const [isDarkMode, setIsDarkMode] = useState(true);
    const [isExporting, setIsExporting] = useState(false);

    const handleExportPDF = async () => {
        try {
            setIsExporting(true);

            // Fetch all dashboard data
            const [costRes, peakRes, forecastRes, recommendationsRes] = await Promise.all([
                energyAPI.getCostBreakdown(householdId, 30),
                energyAPI.getPeakHours(householdId),
                energyAPI.getForecasts(householdId, 7),
                energyAPI.getRecommendations(householdId)
            ]);

            const dashboardData = {
                costBreakdown: costRes.data,
                peakHours: peakRes.data,
                forecasts: forecastRes.data,
                recommendations: recommendationsRes.data
            };

            // Generate PDF
            const filename = await generatePDFReport(householdId, dashboardData);

            // Show success message
            alert(`✅ Report exported successfully!\n\nFile: ${filename}`);
        } catch (error) {
            console.error('Error exporting PDF:', error);
            alert('❌ Failed to export PDF report. Please try again.');
        } finally {
            setIsExporting(false);
        }
    };


    return (
        <div className={`min-h-screen ${isDarkMode ? 'bg-slate-950' : 'bg-slate-100'} transition-colors duration-300`}>
            {/* Header */}
            <header className="bg-gradient-to-r from-blue-900 to-purple-900 border-b border-blue-700 shadow-2xl">
                <div className="container mx-auto px-4 py-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-lg flex items-center justify-center text-2xl shadow-lg">
                                ⚡
                            </div>
                            <div>
                                <h1 className="text-3xl font-bold text-white">
                                    IEOMS Dashboard
                                </h1>
                                <p className="text-blue-200 text-sm">
                                    Intelligent Energy Optimization Management System
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-4">
                            <div className="bg-blue-800/50 border border-blue-600 rounded-lg px-4 py-2">
                                <p className="text-blue-200 text-xs">House ID {householdId}</p>
                                {/* <p className="text-white font-bold"></p> */}
                            </div>

                            <button
                                onClick={handleExportPDF}
                                disabled={isExporting}
                                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500 disabled:from-slate-600 disabled:to-slate-600 text-white rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl disabled:cursor-not-allowed font-medium"
                            >
                                {isExporting ? (
                                    <>
                                        <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        <span>Generating...</span>
                                    </>
                                ) : (
                                    <>
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                        </svg>
                                        <span>Export PDF</span>
                                    </>
                                )}
                            </button>

                            <button
                                onClick={() => setIsDarkMode(!isDarkMode)}
                                className="p-3 bg-blue-800 hover:bg-blue-700 rounded-lg transition-all duration-200 text-white shadow-lg"
                            >
                                {isDarkMode ? '☀️' : '🌙'}
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Dashboard */}
            <main className="container mx-auto px-4 py-8">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left Column - Main Charts (2/3 width) */}
                    <div className="lg:col-span-2 space-y-6">
                        <EnergyMonitor householdId={householdId} />
                        <CostBreakdown householdId={householdId} />
                        <ApplianceTracker householdId={householdId} />
                        <ForecastPanel householdId={householdId} />
                    </div>

                    {/* Right Column - Cards & Info (1/3 width) */}
                    <div className="space-y-6">
                        <UploadDataPanel />
                        <PeakHoursCard householdId={householdId} />
                        <RecommendationsPanel householdId={householdId} />
                        <SmartInsights />
                    </div>
                </div>
            </main>

            {/* Footer */}
            <footer className="bg-gradient-to-r from-slate-900 to-slate-800 border-t border-slate-700 mt-12">
                <div className="container mx-auto px-4 py-6">
                    <div className="flex items-center justify-between">
                        <p className="text-slate-400 text-sm">
                            © 2024 IEOMS - Powered by XGBoost ML & Google Gemini AI
                        </p>
                        <div className="flex gap-4">
                            <span className="text-slate-400 text-xs bg-green-900/30 border border-green-500/50 px-3 py-1 rounded-full">
                                ✓ Model Accuracy: 99%
                            </span>
                            <span className="text-slate-400 text-xs bg-blue-900/30 border border-blue-500/50 px-3 py-1 rounded-full">
                                ✓ TimescaleDB Active
                            </span>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
}

export default Dashboard;
