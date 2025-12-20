import request from '@/utils/request'

// 分页查询角色
export const getRolePage = (params) => {
    return request({
        url: '/sys/role/page',
        method: 'get',
        params
    })
}

// 查询所有角色
export const getRoleList = () => {
    return request({
        url: '/sys/role/list',
        method: 'get'
    })
}

// 查询角色详情
export const getRoleById = (id) => {
    return request({
        url: `/sys/role/${id}`,
        method: 'get'
    })
}

// 新增角色
export const createRole = (data) => {
    return request({
        url: '/sys/role',
        method: 'post',
        data
    })
}

// 修改角色
export const updateRole = (id, data) => {
    return request({
        url: `/sys/role/${id}`,
        method: 'put',
        data
    })
}

// 删除角色
export const deleteRole = (id) => {
    return request({
        url: `/sys/role/${id}`,
        method: 'delete'
    })
}