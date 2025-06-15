import apiClient from './index';

// 文件相关接口
export interface File {
  id?: number;
  version_id: number;
  uploader_id: number;
  filename?: string;
  file_path?: string;
  file_size?: number;
  file_type?: string;
  upload_time?: string;
}

// 文件API服务
export default {
  // 上传文件
  uploadFile(formData: FormData) {
    return apiClient.post('/files/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
  },

  // 下载文件
  downloadFile(fileId: number | string) {
    return apiClient.get(`/files/download/${fileId}`, {
      responseType: 'blob'
    });
  },

  // 获取版本的所有文件
  getVersionFiles(versionId: number | string) {
    return apiClient.get('/files', {
      params: { version_id: versionId }
    });
  },

  // 删除文件
  deleteFile(fileId: number | string) {
    return apiClient.delete(`/files/${fileId}`);
  }
};