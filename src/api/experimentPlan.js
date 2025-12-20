import request from '@/utils/request'

// 分页查询实验方案
export const getPlanPage = (params) => {
    return request({
        url: '/experiment/plan/page',
        method: 'get',
        params
    })
}

// 查询实验方案详情
export const getPlanById = (id) => {
    return request({
        url: `/experiment/plan/${id}`,
        method: 'get'
    })
}

// 新增实验方案
export const createPlan = (data) => {
    return request({
        url: '/experiment/plan',
        method: 'post',
        data
    })
}

// 修改实验方案
export const updatePlan = (id, data) => {
    return request({
        url: `/experiment/plan/${id}`,
        method: 'put',
        data
    })
}

// 删除实验方案
export const deletePlan = (id) => {
    return request({
        url: `/experiment/plan/${id}`,
        method: 'delete'
    })
}

// 更新实验状态
export const updatePlanStatus = (id, status) => {
    return request({
        url: `/experiment/plan/status/${id}`,
        method: 'put',
        params: { status }
    })
}