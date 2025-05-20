import apiClient from './index';

// 产品相关接口
export interface Product {
  id?: number;
  name: string;
  description?: string;
  code: string;
  status?: string;
}

// 产品API服务
export default {
  // 获取产品列表
  getProducts(params?: { page?: number; per_page?: number; status?: string }) {
    return apiClient.get('/products', { params });
  },

  // 创建新产品
  createProduct(productData: Product) {
    return apiClient.post('/products', productData);
  },

  // 获取产品详情
  getProduct(productId: number | string) {
    return apiClient.get(`/products/${productId}`);
  },

  // 更新产品信息
  updateProduct(productId: number | string, productData: Partial<Product>) {
    return apiClient.put(`/products/${productId}`, productData);
  },

  // 删除产品
  deleteProduct(productId: number | string) {
    return apiClient.delete(`/products/${productId}`);
  },

  // 获取产品的版本历史
  getProductVersions(productId: number | string, params?: { page?: number; per_page?: number; status?: string }) {
    return apiClient.get(`/products/${productId}/versions`, { params });
  }
};