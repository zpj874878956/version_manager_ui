import apiClient from './index';

// 版本相关接口
export interface Version {
  id?: number;
  product_id: number;
  version_number: string;
  description?: string;
  release_notes?: string;
  author_id: number;
  status?: string;
  created_at?: string;
  updated_at?: string;
  lock_status?: boolean;
}

// 版本API服务
export default {
  // 获取版本列表（按产品）
  getVersions(params: { product_id: number; page?: number; per_page?: number; status?: string }) {
    return apiClient.get('/versions', { params });
  },

  // 创建新版本
  createVersion(versionData: Version) {
    return apiClient.post('/versions', versionData);
  },

  // 获取版本详情
  getVersion(versionId: number | string) {
    return apiClient.get(`/versions/${versionId}`);
  },

  // 更新版本信息
  updateVersion(versionId: number | string, versionData: Partial<Omit<Version, 'product_id' | 'author_id'>>) {
    return apiClient.put(`/versions/${versionId}`, versionData);
  },

  // 删除版本
  deleteVersion(versionId: number | string) {
    return apiClient.delete(`/versions/${versionId}`);
  },

  // 获取版本状态变更历史
  getVersionStatusHistory(versionId: number | string) {
    return apiClient.get(`/versions/${versionId}/status-history`);
  }
};