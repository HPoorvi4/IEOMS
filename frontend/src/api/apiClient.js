import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api';

const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

export const energyAPI = {
    getConsumption: (householdId, hours = 24) =>
        api.get(`/energy/consumption/${householdId}?hours=${hours}`),

    getPeakHours: (householdId) =>
        api.get(`/energy/peak-hours/${householdId}`),

    getCostBreakdown: (householdId, days = 30) =>
        api.get(`/energy/cost-breakdown/${householdId}?days=${days}`),

    getForecasts: (householdId, days = 7) =>
        api.get(`/forecasts/${householdId}?days=${days}`),

    getRecommendations: (householdId) =>
        api.get(`/recommendations/${householdId}`)
};

export default api;
