import apiClient from './index';

// 产品相关接口
export interface Product {
  id?: number;
  name: string;
  description?: string;
  code: string;
  status?: string;
  
  // 后端返回的额外字段
  created_at?: string;
  updated_at?: string;
  create_time?: string;
  update_time?: string;
  createTime?: string;
  updateTime?: string;
  owner?: string;
  owner_name?: string;
}

// 产品API服务
export default {
  // 获取产品列表
  async getProducts(params?: { page?: number; per_page?: number; status?: string; name?: string; code?: string }) {
    try {
      const response = await apiClient.get('/products', { params });
      console.log('产品列表原始响应:', response);
      return response.data; // 返回响应中的数据部分
    } catch (error) {
      console.error('获取产品列表失败:', error);
      throw error;
    }
  },

  // 创建新产品
  async createProduct(productData: Product) {
    try {
      const response = await apiClient.post('/products', productData);
      return response.data;
    } catch (error) {
      console.error('创建产品失败:', error);
      throw error;
    }
  },

  // 获取产品详情
  async getProduct(productId: number | string) {
    try {
      const response = await apiClient.get(`/products/${productId}`);
      return response.data;
    } catch (error) {
      console.error(`获取产品 ${productId} 详情失败:`, error);
      throw error;
    }
  },

  // 更新产品信息
  async updateProduct(productId: number | string, productData: Partial<Product>) {
    try {
      const response = await apiClient.put(`/products/${productId}`, productData);
      return response.data;
    } catch (error) {
      console.error(`更新产品 ${productId} 失败:`, error);
      throw error;
    }
  },

  // 删除产品
  async deleteProduct(productId: number | string) {
    try {
      const response = await apiClient.delete(`/products/${productId}`);
      return response.data;
    } catch (error) {
      console.error(`删除产品 ${productId} 失败:`, error);
      throw error;
    }
  },

  // 获取产品的版本历史
  async getProductVersions(productId: number | string, params?: { page?: number; per_page?: number; status?: string; version?: string }) {
    try {
      const response = await apiClient.get(`/products/${productId}/versions`, { params });
      return response.data;
    } catch (error) {
      console.error(`获取产品 ${productId} 版本列表失败:`, error);
      throw error;
    }
  }
};