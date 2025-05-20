// 统一导出所有API服务
import apiClient from './index';
import userApi from './user';
import productApi from './product';
import versionApi from './version';
import fileApi from './file';

// 导出API客户端实例
export { apiClient };

// 导出各模块API服务
export const api = {
  user: userApi,
  product: productApi,
  version: versionApi,
  file: fileApi
};

// 默认导出所有API服务
export default api;