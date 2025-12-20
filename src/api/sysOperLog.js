import request from '@/utils/request'

// 分页查询操作日志
export const getOperLogPage = (params) => {
    return request({
        url: '/sys/oper/log/page',
        method: 'get',
        params
    })
}