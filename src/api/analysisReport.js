import request from '@/utils/request'

// 分页查询分析报告
export const getReportPage = (params) => {
    return request({
        url: '/analysis/report/page',
        method: 'get',
        params
    })
}

// 查询报告详情
export const getReportById = (id) => {
    return request({
        url: `/analysis/report/${id}`,
        method: 'get'
    })
}

// 生成分析报告
export const createReport = (data) => {
    return request({
        url: '/analysis/report/generate',
        method: 'post',
        data
    })
}

// 导出PDF
export const exportReportPdf = (id) => {
    return request({
        url: `/analysis/report/export/pdf/${id}`,
        method: 'get',
        responseType: 'blob'
    })
}

// 作废报告
export const invalidReport = (id) => {
    return request({
        url: `/analysis/report/invalid/${id}`,
        method: 'put'
    })
}