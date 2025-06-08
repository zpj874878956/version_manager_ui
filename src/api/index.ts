import axios from 'axios';
import type { AxiosInstance, AxiosResponse, InternalAxiosRequestConfig } from 'axios';

// 创建axios实例
const apiClient: AxiosInstance = axios.create({
  baseURL: '/api/v1', // 使用相对路径，将通过 Vite 代理转发到后端
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  },
  withCredentials: true // 允许跨域请求携带凭证
});

// 请求拦截器
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // 可以在这里添加认证信息，例如从localStorage获取token
    const token = localStorage.getItem('token');
    if (token && config.headers) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 响应拦截器
apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    console.log('API原始响应:', response);
    // 直接返回响应数据，不做额外处理
    return response;
  },
  (error) => {
    // 处理错误响应
    if (error.response) {
      // 服务器返回错误状态码
      const { status } = error.response;
      console.error(`API错误: ${status}`, error.response.data);
      if (status === 401) {
        // 未授权，可以跳转到登录页
        // router.push('/login');
      } else if (status === 403) {
        // 权限不足
      } else if (status === 404) {
        // 资源不存在
      } else if (status === 500) {
        // 服务器错误
      }
    } else if (error.request) {
      // 请求发送但没有收到响应
      console.error('网络错误，请检查您的网络连接', error.request);
    } else {
      // 请求配置出错
      console.error('请求配置错误:', error.message);
    }
    return Promise.reject(error);
  }
);

export default apiClient;