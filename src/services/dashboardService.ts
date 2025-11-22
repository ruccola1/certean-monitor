import { api } from './api';
import type { ApiResponse } from '@/types/api';

export interface DashboardSummary {
  text: string;
  generatedAt: string;
}

export interface UpcomingUpdate {
  id: string;
  title: string;
  date: string;
  type: string;
  complianceElement: string;
  daysUntil: number;
}

export interface ChartData {
  date: string;
  legislation: number;
  standard: number;
  marking: number;
}

export const dashboardService = {
  // Get AI-generated compliance summary
  async getSummary(): Promise<ApiResponse<DashboardSummary>> {
    const { data } = await api.get('/api/dashboard/summary');
    return data;
  },

  // Get upcoming compliance deadlines (< 3 months)
  async getUpcomingUpdates(): Promise<ApiResponse<UpcomingUpdate[]>> {
    const { data } = await api.get('/api/dashboard/upcoming-updates');
    return data;
  },

  // Get compliance updates chart data
  async getChartData(): Promise<ApiResponse<ChartData[]>> {
    const { data } = await api.get('/api/dashboard/chart-data');
    return data;
  },
};


