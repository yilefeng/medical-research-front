import request from '@/utils/request'

// 分页查询数据源
export const getSourcePage = (params) => {
    return request({
        url: '/data/source/page',
        method: 'get',
        params
    })
}

// 查询数据源详情
export const getSourceById = (id) => {
    return request({
        url: `/data/source/${id}`,
        method: 'get'
    })
}

// 新增Excel数据源
export const createExcelSource = (data) => {
    return request({
        url: '/data/source/excel',
        method: 'post',
        headers: {
            'Content-Type': 'multipart/form-data'
        },
        data
    })
}

// 新增数据库数据源
export const createDbSource = (data) => {
    return request({
        url: '/data/source/database',
        method: 'post',
        data
    })
}

// 修改数据源
export const updateSource = (id, data) => {
    return request({
        url: `/data/source/${id}`,
        method: 'put',
        data
    })
}

// 删除数据源
export const deleteSource = (id) => {
    return request({
        url: `/data/source/${id}`,
        method: 'delete'
    })
}

// 测试数据库连接
export const testDbConnection = (data) => {
    return request({
        url: '/data/source/test/connection',
        method: 'post',
        data
    })
}