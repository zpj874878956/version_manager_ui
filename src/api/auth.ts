import apiClient from './index';

// 认证相关接口
export interface LoginCredentials {
  username: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: {
    id: number;
    username: string;
    email: string;
    is_admin: boolean;
  };
}

// 认证API服务
export default {
  // 用户登录
  login(credentials: LoginCredentials) {
    return apiClient.post<LoginResponse>('/auth/login', credentials);
  },

  // 用户登出
  logout() {
    return apiClient.post('/auth/logout');
  },

  // 获取当前用户信息
  getCurrentUser() {
    return apiClient.get('/auth/me');
  },

  // 检查token是否有效
  checkToken() {
    return apiClient.get('/auth/check');
  }
}; 