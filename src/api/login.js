import axios from 'axios'

// 1. 确认axios实例配置（无额外处理）
const service = axios.create({
    baseURL: '/',
    timeout: 5000,
    withCredentials: true,
    headers: {
        'Content-Type': 'application/json;charset=utf-8' // 必须是json格式
    }
})

// 2. 临时注释所有拦截器（先排除拦截器干扰）
// ❗ 若项目中有请求/响应拦截器，先全部注释，测试后再恢复
// service.interceptors.request.use(...)
// service.interceptors.response.use(...)

// 3. 登录请求函数：添加完整日志
export const login = async (params) => {
    console.log('API层接收的原始参数：', params); // 应该是扁平对象
    console.log('API层发送的请求体：', params);   // 应该和上面一致

    try {
        const res = await service.post('/api/login', params);
        console.log('API层接收的响应：', res.data);
        return res.data;
    } catch (err) {
        console.error('API层请求失败：', err);
        throw err; // 抛出错误，让组件层捕获
    }
}