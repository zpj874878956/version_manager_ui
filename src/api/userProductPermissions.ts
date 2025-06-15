import apiClient from './index';

export default {
  // 获取用户产品权限
  getUserProductPermissions(userId: string | number) {
    return apiClient.get('/user-product-permissions', { params: { user_id: userId } });
  },
  // 设置用户产品权限
  setUserProductPermission(data: { user_id: string | number, product_id: string | number, permission_type: string }) {
    return apiClient.post('/user-product-permissions', data);
  }
}; 