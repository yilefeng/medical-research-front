import axios from 'axios'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getToken, removeToken } from '@/utils/auth'
import router from '@/router'

// 创建axios实例
const service = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
    timeout: 10000
})

// 请求拦截器
service.interceptors.request.use(
    config => {
        // 添加token
        const token = getToken()
        if (token) {
            config.headers['token'] = token
        }
        return config
    },
    error => {
        console.error('请求错误:', error)
        return Promise.reject(error)
    }
)

// 响应拦截器
service.interceptors.response.use(
    response => {

        // 处理 Blob 类型响应（如文件下载）
        if (response.data instanceof Blob) {
            // 检查是否是错误响应（通过 Content-Type 或其他方式判断）
            const contentType = response.headers['content-type'];
            if (contentType && contentType.includes('application/json')) {
                // 可能是错误响应，需要进一步处理
                return new Promise((resolve, reject) => {
                    const reader = new FileReader();
                    reader.onload = () => {
                        try {
                            const errorMsg = JSON.parse(reader.result);
                            if (errorMsg.code !== 200) {
                                ElMessage.error(errorMsg.msg || '操作失败');
                                reject(errorMsg);
                            } else {
                                resolve(response.data);
                            }
                        } catch (e) {
                            resolve(response.data);
                        }
                    };
                    reader.onerror = () => {
                        resolve(response.data);
                    };
                    reader.readAsText(response.data);
                });
            }
            // 正常的 Blob 响应直接返回
            return response.data;
        }

        const res = response.data
        // 业务错误处理
        if (res.code !== 200) {
            ElMessage.error(res.msg || '操作失败')
            // token失效
            if (res.code === 401) {
                ElMessageBox.confirm(
                    '登录已过期，请重新登录',
                    '提示',
                    {
                        confirmButtonText: '重新登录',
                        cancelButtonText: '取消',
                        type: 'warning'
                    }
                ).then(() => {
                    removeToken()
                    router.push('/login')
                })
            }
            return Promise.reject(res)
        } else {
            return res
        }
    },
    error => {
        console.error('响应错误:', error)
        ElMessage.error(error.msg || '系统异常')
        return Promise.reject(error)
    }
)

export default service