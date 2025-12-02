# 📄 PDF Export Feature

## Overview
The IEOMS Dashboard now includes a professional **PDF Export** feature that generates comprehensive energy analysis reports.

## Features

### 📊 Report Contents

The exported PDF includes:

1. **Executive Summary**
   - Total Energy Cost
   - Total Consumption (kWh)
   - Number of Active Appliances
   - Cost per kWh

2. **Cost Breakdown Table**
   - Detailed appliance-by-appliance analysis
   - Energy consumption (kWh)
   - Cost in USD
   - Percentage of total cost

3. **Peak Hours Analysis**
   - Peak Hours (🔴) - time ranges and average consumption
   - Normal Hours (🟡) - time ranges and average consumption
   - Off-Peak Hours (🟢) - time ranges and average consumption

4. **AI-Powered Recommendations**
   - Up to 5 personalized recommendations from Gemini AI
   - Priority levels (High/Medium/Low)
   - Potential savings in kWh and USD
   - Actionable implementation steps

### 🎨 Professional Design

- **Multi-page support** with automatic page breaks
- **Color-coded sections** for easy navigation
- **Professional header and footer** on every page
- **Tables and charts** with clean formatting
- **Priority badges** for recommendations
- **Page numbers** and branding

### 📥 How to Use

1. Click the **"Export PDF"** button in the dashboard header (green button with download icon)
2. Wait while the system:
   - Fetches all dashboard data
   - Generates the PDF report
   - Formats charts and tables
3. The PDF will automatically download with filename: `IEOMS_Report_Household_1_YYYY-MM-DD.pdf`
4. Success message will confirm the export

### 🔄 Loading States

- Button shows **spinning icon** while generating report
- Button is **disabled** during export to prevent duplicate requests
- Status changes from "Export PDF" to "Generating..." 

### ⚡ Technical Details

**Dependencies:**
- `jspdf` - PDF generation library
- `jspdf-autotable` - Table formatting
- `html2canvas` - Future chart capture support

**Data Sources:**
- Cost Breakdown API (`/api/energy/cost-breakdown/:householdId`)
- Peak Hours API (`/api/energy/peak-hours/:householdId`)
- Forecasts API (`/api/forecasts/:householdId`)
- Recommendations API (`/api/recommendations/:householdId`)

**File Location:** 
- Generated PDFs download to your browser's default download folder
- Filename format: `IEOMS_Report_Household_{ID}_{DATE}.pdf`

### 🎯 Use Cases

- **Monthly Reports** - Track energy usage trends
- **Cost Analysis** - Share with family/household members
- **Documentation** - Keep records for utility audits
- **Savings Tracking** - Monitor impact of implemented recommendations
- **Presentations** - Professional reports for stakeholders

## Example Output

The PDF report is fully formatted with:
- Clean typography using Helvetica font
- Professional color scheme (blues, greens, reds)
- Rounded corners and modern design
- Consistent spacing and alignment
- Multi-page automatic layout

---

**Note:** All data in the PDF report is **100% real** from your PostgreSQL database and AI-generated recommendations from Google Gemini!
