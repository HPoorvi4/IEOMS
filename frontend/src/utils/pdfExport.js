import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export const generatePDFReport = async (householdId, dashboardData) => {
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    let yPos = 20;

    // Helper function to add page if needed
    const checkPageBreak = (requiredHeight) => {
        if (yPos + requiredHeight > pageHeight - 20) {
            pdf.addPage();
            yPos = 20;
            return true;
        }
        return false;
    };

    // ========== HEADER ==========
    pdf.setFillColor(30, 58, 138);
    pdf.rect(0, 0, pageWidth, 40, 'F');

    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(24);
    pdf.setFont('helvetica', 'bold');
    pdf.text('IEOMS ENERGY REPORT', pageWidth / 2, 20, { align: 'center' });

    pdf.setFontSize(11);
    pdf.setFont('helvetica', 'normal');
    pdf.text('Intelligent Energy Optimization Management System', pageWidth / 2, 28, { align: 'center' });

    pdf.setTextColor(200, 200, 200);
    pdf.setFontSize(9);
    const reportDate = new Date().toLocaleDateString('en-US', {
        year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
    });
    pdf.text(`Generated: ${reportDate}`, pageWidth / 2, 35, { align: 'center' });

    yPos = 50;

    // ========== HOUSEHOLD INFO ==========
    pdf.setFillColor(241, 245, 249);
    pdf.roundedRect(15, yPos, pageWidth - 30, 18, 3, 3, 'F');

    pdf.setTextColor(51, 65, 85);
    pdf.setFontSize(11);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Household Information', 20, yPos + 7);

    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(10);
    pdf.text(`Household ID: ${householdId}`, 20, yPos + 14);
    pdf.text('Report Period: Last 30 Days', pageWidth - 75, yPos + 14);

    yPos += 25;

    // ========== EXECUTIVE SUMMARY ==========
    checkPageBreak(50);
    pdf.setFillColor(30, 58, 138);
    pdf.rect(15, yPos, 4, 8, 'F');
    pdf.setTextColor(30, 58, 138);
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Executive Summary', 22, yPos + 6);
    yPos += 14;

    if (dashboardData.costBreakdown) {
        const totalKwh = dashboardData.costBreakdown.breakdown.reduce((sum, item) => sum + parseFloat(item.totalKwh), 0).toFixed(2);
        const summary = [
            { label: 'Total Energy Cost', value: `$${dashboardData.costBreakdown.totalCost}`, color: [220, 38, 38] },
            { label: 'Total Consumption', value: `${totalKwh} kWh`, color: [234, 179, 8] },
            { label: 'Active Appliances', value: dashboardData.costBreakdown.breakdown.length.toString(), color: [34, 197, 94] },
            { label: 'Cost per kWh', value: `$${dashboardData.costBreakdown.costPerKwh}`, color: [59, 130, 246] }
        ];

        summary.forEach((item, index) => {
            const xStart = 15 + (index % 2) * ((pageWidth - 30) / 2);
            const yStart = yPos + Math.floor(index / 2) * 20;

            pdf.setFillColor(248, 250, 252);
            pdf.roundedRect(xStart, yStart, (pageWidth - 35) / 2, 16, 2, 2, 'F');
            pdf.setDrawColor(226, 232, 240);
            pdf.roundedRect(xStart, yStart, (pageWidth - 35) / 2, 16, 2, 2, 'S');

            pdf.setTextColor(100, 116, 139);
            pdf.setFontSize(8);
            pdf.setFont('helvetica', 'normal');
            pdf.text(item.label, xStart + 4, yStart + 5);

            pdf.setTextColor(...item.color);
            pdf.setFontSize(13);
            pdf.setFont('helvetica', 'bold');
            pdf.text(item.value, xStart + 4, yStart + 12);
        });
        yPos += 45;
    }

    // ========== COST BREAKDOWN TABLE ==========
    checkPageBreak(60);
    pdf.setFillColor(30, 58, 138);
    pdf.rect(15, yPos, 4, 8, 'F');
    pdf.setTextColor(30, 58, 138);
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Cost Breakdown by Appliance', 22, yPos + 6);
    yPos += 14;

    if (dashboardData.costBreakdown && dashboardData.costBreakdown.breakdown) {
        const tableData = dashboardData.costBreakdown.breakdown.map(item => [
            item.appliance,
            `${item.totalKwh} kWh`,
            `$${item.totalCost}`,
            `${item.percentage}%`
        ]);

        autoTable(pdf, {
            startY: yPos,
            head: [['Appliance', 'Energy (kWh)', 'Cost (USD)', '% of Total']],
            body: tableData,
            theme: 'grid',
            headStyles: { fillColor: [30, 58, 138], textColor: 255, fontStyle: 'bold', fontSize: 10 },
            bodyStyles: { fontSize: 9, textColor: [51, 65, 85] },
            alternateRowStyles: { fillColor: [248, 250, 252] },
            margin: { left: 15, right: 15 },
            columnStyles: {
                0: { cellWidth: 70 },
                1: { cellWidth: 35, halign: 'right' },
                2: { cellWidth: 35, halign: 'right' },
                3: { cellWidth: 30, halign: 'right' }
            }
        });

        yPos = pdf.lastAutoTable.finalY + 15;
    }

    // ========== PEAK HOURS ANALYSIS ==========
    checkPageBreak(60);
    pdf.setFillColor(30, 58, 138);
    pdf.rect(15, yPos, 4, 8, 'F');
    pdf.setTextColor(30, 58, 138);
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Peak Hours Analysis', 22, yPos + 6);
    yPos += 14;

    if (dashboardData.peakHours) {
        const peakData = [
            { label: 'PEAK HOURS', data: dashboardData.peakHours.peak, bgColor: [220, 38, 38] },
            { label: 'NORMAL HOURS', data: dashboardData.peakHours.normal, bgColor: [234, 179, 8] },
            { label: 'OFF-PEAK HOURS', data: dashboardData.peakHours.offPeak, bgColor: [34, 197, 94] }
        ];

        peakData.forEach((period) => {
            if (period.data && period.data.length > 0) {
                const avgEnergy = (period.data.reduce((sum, h) => sum + h.avgEnergy, 0) / period.data.length).toFixed(2);
                const hours = period.data.slice(0, 5).map(h => h.hour).sort((a, b) => a - b);
                const timeRange = `${Math.min(...hours)}:00 - ${Math.max(...hours)}:00`;

                // Header bar
                pdf.setFillColor(...period.bgColor);
                pdf.roundedRect(15, yPos, pageWidth - 30, 8, 1, 1, 'F');
                pdf.setTextColor(255, 255, 255);
                pdf.setFontSize(10);
                pdf.setFont('helvetica', 'bold');
                pdf.text(period.label, 20, yPos + 6);

                // Info box
                pdf.setFillColor(248, 250, 252);
                pdf.rect(15, yPos + 8, pageWidth - 30, 10, 'F');
                pdf.setDrawColor(226, 232, 240);
                pdf.rect(15, yPos + 8, pageWidth - 30, 10, 'S');

                pdf.setTextColor(51, 65, 85);
                pdf.setFontSize(9);
                pdf.setFont('helvetica', 'normal');
                pdf.text(`Time: ${timeRange}`, 20, yPos + 14);

                pdf.setTextColor(34, 197, 94);
                pdf.setFont('helvetica', 'bold');
                pdf.text(`Avg: ${avgEnergy} kWh`, pageWidth - 45, yPos + 14);

                yPos += 22;
            }
        });
    }

    // ========== AI RECOMMENDATIONS ==========
    checkPageBreak(60);
    pdf.setFillColor(30, 58, 138);
    pdf.rect(15, yPos, 4, 8, 'F');
    pdf.setTextColor(30, 58, 138);
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    pdf.text('AI-Powered Recommendations', 22, yPos + 6);
    yPos += 14;

    if (dashboardData.recommendations && dashboardData.recommendations.recommendations && dashboardData.recommendations.recommendations.length > 0) {
        dashboardData.recommendations.recommendations.slice(0, 5).forEach((rec, index) => {
            checkPageBreak(38);

            const priorityColors = {
                high: [220, 38, 38],
                medium: [234, 179, 8],
                low: [34, 197, 94]
            };
            const color = priorityColors[rec.priority?.toLowerCase()] || [100, 116, 139];

            // Box
            pdf.setFillColor(248, 250, 252);
            pdf.roundedRect(15, yPos, pageWidth - 30, 35, 2, 2, 'F');
            pdf.setDrawColor(226, 232, 240);
            pdf.roundedRect(15, yPos, pageWidth - 30, 35, 2, 2, 'S');

            // Priority badge
            pdf.setFillColor(...color);
            pdf.roundedRect(20, yPos + 5, 24, 7, 1, 1, 'F');
            pdf.setTextColor(255, 255, 255);
            pdf.setFontSize(8);
            pdf.setFont('helvetica', 'bold');
            pdf.text((rec.priority || 'MEDIUM').toUpperCase(), 32, yPos + 10, { align: 'center' });

            // Number
            pdf.setTextColor(100, 116, 139);
            pdf.setFontSize(16);
            pdf.text(`#${index + 1}`, pageWidth - 25, yPos + 10, { align: 'right' });

            // Recommendation text
            pdf.setTextColor(51, 65, 85);
            pdf.setFontSize(10);
            pdf.setFont('helvetica', 'bold');
            const lines = pdf.splitTextToSize(rec.action || 'No recommendation', pageWidth - 55);
            pdf.text(lines.slice(0, 2), 20, yPos + 18);

            // Divider
            pdf.setDrawColor(226, 232, 240);
            pdf.setLineWidth(0.3);
            pdf.line(20, yPos + 27, pageWidth - 20, yPos + 27);

            // Savings
            pdf.setTextColor(100, 116, 139);
            pdf.setFontSize(8);
            pdf.setFont('helvetica', 'normal');
            pdf.text('SAVINGS:', 20, yPos + 32);

            const savingsKwh = rec.savings_kwh || 0;
            const savingsUsd = rec.savings_usd || (savingsKwh * 0.12).toFixed(2);

            pdf.setTextColor(34, 197, 94);
            pdf.setFontSize(9);
            pdf.setFont('helvetica', 'bold');
            pdf.text(`${savingsKwh} kWh/month  =  $${savingsUsd}/month`, 48, yPos + 32);

            yPos += 39;
        });
    } else {
        pdf.setTextColor(100, 116, 139);
        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'italic');
        pdf.text('No AI recommendations available.', 20, yPos + 8);
        yPos += 20;
    }

    // ========== FOOTER ==========
    const totalPages = pdf.internal.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
        pdf.setPage(i);
        pdf.setFillColor(241, 245, 249);
        pdf.rect(0, pageHeight - 12, pageWidth, 12, 'F');

        pdf.setTextColor(100, 116, 139);
        pdf.setFontSize(8);
        pdf.setFont('helvetica', 'normal');
        pdf.text('Powered by XGBoost ML & Google Gemini AI', pageWidth / 2, pageHeight - 6, { align: 'center' });
        pdf.text(`Page ${i} of ${totalPages}`, pageWidth - 20, pageHeight - 6, { align: 'right' });
        pdf.text('(c) 2024 IEOMS', 20, pageHeight - 6);
    }

    // ========== SAVE ==========
    const filename = `IEOMS_Report_Household_${householdId}_${new Date().toISOString().split('T')[0]}.pdf`;
    pdf.save(filename);

    return filename;
};
