import request from '@/utils/request'

// 分页查询科研数据
export const getDataPage = (params) => {
    return request({
        url: '/research/data/page',
        method: 'get',
        params
    })
}

// 查询科研数据详情
export const getDataById = (id) => {
    return request({
        url: `/research/data/${id}`,
        method: 'get'
    })
}

// 新增科研数据
export const createData = (data) => {
    return request({
        url: '/research/data',
        method: 'post',
        data
    })
}

// 修改科研数据
export const updateData = (id, data) => {
    return request({
        url: `/research/data/${id}`,
        method: 'put',
        data
    })
}

// 删除科研数据
export const deleteData = (id) => {
    return request({
        url: `/research/data/${id}`,
        method: 'delete'
    })
}

// Excel导入科研数据
export const importResearchData = (data) => {
    return request({
        url: '/research/data/import',
        method: 'post',
        headers: {
            'Content-Type': 'multipart/form-data'
        },
        data
    })
}

// Excel导出科研数据
export const exportResearchData = (params) => {
    return request({
        url: '/research/data/export',
        method: 'get',
        params,
        responseType: 'blob'
    })
}

// 获取可视化数据
export const getVisualData = (experimentNo) => {
    return request({
        url: '/research/data/visual',
        method: 'get',
        params: { experimentNo }
    })
}