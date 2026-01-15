import request from '@/utils/request'

// 分页查询用户
export const getUserPage = (params) => {
    return request({
        url: '/sys/user/page',
        method: 'get',
        params
    })
}

// 查询用户详情
export const getUserById = (id) => {
    return request({
        url: `/sys/user/${id}`,
        method: 'get'
    })
}

// 新增用户
export const createUser = (data) => {
    return request({
        url: '/sys/user',
        method: 'post',
        data
    })
}

// 修改用户
export const updateUser = (id, data) => {
    return request({
        url: `/sys/user/${id}`,
        method: 'put',
        data
    })
}

// 删除用户
export const deleteUser = (id) => {
    return request({
        url: `/sys/user/${id}`,
        method: 'delete'
    })
}

// 重置密码
export const resetPassword = (id) => {
    return request({
        url: `/sys/user/reset/password/${id}`,
        method: 'put'
    })
}

export const changePassword = (data) => {
    return request({
        url: '/sys/user/change/password',
        method: 'post',
        data
    })
}

export const getUserInfo = () => {
    return request({
        url: '/sys/user/info',
        method: 'get'
    })
}

export const updateUserInfo = (data) => {
    return request({
        url: '/sys/user/info',
        method: 'put',
        data
    })
}