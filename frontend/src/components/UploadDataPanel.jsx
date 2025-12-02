import React, { useState } from 'react';
import axios from 'axios';

const UploadDataPanel = () => {
    const [file, setFile] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [result, setResult] = useState(null);
    const [error, setError] = useState(null);
    const [dragActive, setDragActive] = useState(false);

    const handleDrag = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true);
        } else if (e.type === "dragleave") {
            setDragActive(false);
        }
    };

    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);

        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleFile(e.dataTransfer.files[0]);
        }
    };

    const handleFileInput = (e) => {
        if (e.target.files && e.target.files[0]) {
            handleFile(e.target.files[0]);
        }
    };

    const handleFile = (selectedFile) => {
        if (!selectedFile.name.endsWith('.csv')) {
            setError('Please select a CSV file');
            return;
        }
        setFile(selectedFile);
        setError(null);
        setResult(null);
    };

    const handleUpload = async () => {
        if (!file) {
            setError('Please select a file first');
            return;
        }

        setUploading(true);
        setError(null);
        setResult(null);

        const formData = new FormData();
        formData.append('file', file);

        try {
            const response = await axios.post('http://localhost:5000/api/upload/energy-data', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            setResult(response.data);
            setFile(null);

            // Refresh page after 2 seconds to show new data
            setTimeout(() => {
                window.location.reload();
            }, 2000);
        } catch (err) {
            setError(err.response?.data?.error || 'Upload failed. Please try again.');
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-2xl p-6 shadow-2xl border border-slate-700">
            <div className="mb-4">
                <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                    <span>📤</span>
                    <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                        Upload New Energy Data
                    </span>
                </h2>
                <p className="text-slate-400 text-sm mt-1">Upload 24-hour CSV data to update dashboard</p>
            </div>

            {/* Upload Zone */}
            <div
                className={`relative border-2 border-dashed rounded-xl p-8 transition-all duration-300 ${dragActive
                        ? 'border-blue-500 bg-blue-900/20'
                        : 'border-slate-600 bg-slate-800/50 hover:border-slate-500'
                    }`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
            >
                <input
                    type="file"
                    accept=".csv"
                    onChange={handleFileInput}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />

                <div className="text-center">
                    <div className="text-6xl mb-4">📁</div>
                    <p className="text-white font-semibold mb-2">
                        {file ? file.name : 'Drag & drop your CSV file here'}
                    </p>
                    <p className="text-slate-400 text-sm mb-4">
                        or click to browse
                    </p>
                    {file && (
                        <div className="text-slate-300 text-sm">
                            Size: {(file.size / 1024).toFixed(2)} KB
                        </div>
                    )}
                </div>
            </div>

            {/* Upload Button */}
            <button
                onClick={handleUpload}
                disabled={!file || uploading}
                className="w-full mt-4 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 disabled:from-slate-600 disabled:to-slate-600 text-white font-semibold rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
                {uploading ? (
                    <>
                        <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <span>Processing...</span>
                    </>
                ) : (
                    <>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                        </svg>
                        <span>Upload & Process Data</span>
                    </>
                )}
            </button>

            {/* Success Message */}
            {result && (
                <div className="mt-4 bg-green-900/30 border border-green-500/50 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                        <span className="text-2xl">✅</span>
                        <div className="flex-1">
                            <p className="text-green-300 font-semibold mb-2">{result.message}</p>
                            <div className="text-sm text-green-200 space-y-1">
                                <p>• Rows inserted: {result.stats.rowsInserted}</p>
                                <p>• Forecasts generated: {result.stats.forecastsGenerated}</p>
                                <p>• Date range: {result.stats.dateRange.from} → {result.stats.dateRange.to}</p>
                            </div>
                            <p className="text-green-400 text-xs mt-2">Dashboard will refresh in 2 seconds...</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Error Message */}
            {error && (
                <div className="mt-4 bg-red-900/30 border border-red-500/50 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                        <span className="text-2xl">❌</span>
                        <div>
                            <p className="text-red-300 font-semibold">Upload Failed</p>
                            <p className="text-red-200 text-sm mt-1">{error}</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Required Format Info */}
            <div className="mt-4 bg-slate-800/50 border border-slate-600 rounded-lg p-4">
                <p className="text-slate-300 font-semibold mb-2 text-sm">📋 CSV Format Required:</p>
                <div className="text-slate-400 text-xs space-y-1 font-mono">
                    <p>timestamp, appliance_type, energy_kwh, cost_usd</p>
                    <p className="text-slate-500">2025-01-29 00:00:00, Heater, 1.8, 0.216</p>
                </div>
            </div>
        </div>
    );
};

export default UploadDataPanel;
