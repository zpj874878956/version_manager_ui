import apiClient from './index';

// 操作日志接口类型定义
export interface OperationLog {
  id: number;
  operation_time: string;
  operation_type: string;
  object_type: string;
  object_name: string;
  object_id: string;
  operator_id: number;
  operator_name: string;
  details: string;
}

// 操作日志API服务
export default {
  // 获取操作日志列表
  async getOperationLogs(params?: { 
    page?: number; 
    page_size?: number; 
    operation_type?: string; 
    object_type?: string; 
    operator_name?: string;
    start_date?: string;
    end_date?: string;
  }) {
    try {
      const response = await apiClient.get('/operation-logs', { params });
      return response.data;
    } catch (error) {
      console.error('获取操作日志列表失败:', error);
      throw error;
    }
  },

  // 获取操作日志详情
  async getOperationLogDetail(logId: number | string) {
    try {
      const response = await apiClient.get(`/operation-logs/${logId}`);
      return response.data;
    } catch (error) {
      console.error(`获取操作日志 ${logId} 详情失败:`, error);
      throw error;
    }
  },

  // 导出操作日志
  async exportOperationLogs(params?: { 
    operation_type?: string; 
    object_type?: string; 
    operator_name?: string;
    start_date?: string;
    end_date?: string;
  }) {
    try {
      const response = await apiClient.get('/operation-logs/export', { 
        params,
        responseType: 'blob' // 指定响应类型为二进制数据
      });
      return response;
    } catch (error) {
      console.error('导出操作日志失败:', error);
      throw error;
    }
  }
}; 