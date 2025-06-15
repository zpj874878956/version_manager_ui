import apiClient from './index';

export default {
  // 获取角色列表
  getRoles() {
    return apiClient.get('/roles');
  }
}; 