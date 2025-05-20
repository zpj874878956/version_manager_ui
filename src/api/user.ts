import apiClient from './index';

// 用户相关接口
export interface User {
  id?: number;
  username: string;
  email: string;
  password?: string;
  is_admin?: boolean;
}

// 用户API服务
export default {
  // 获取所有用户
  getAllUsers() {
    return apiClient.get('/users');
  },

  // 创建新用户
  createUser(userData: User) {
    return apiClient.post('/users', userData);
  },

  // 获取用户信息
  getUser(userId: number | string) {
    return apiClient.get(`/users/${userId}`);
  },

  // 更新用户信息
  updateUser(userId: number | string, userData: Partial<User>) {
    return apiClient.put(`/users/${userId}`, userData);
  },

  // 删除用户
  deleteUser(userId: number | string) {
    return apiClient.delete(`/users/${userId}`);
  }
};