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

export const getTitleList = () => {
    return request({
        url: '/dit/title/list',
        method: 'get'
    })
}

export const getDepartmentList = () => {
    return request({
        url: '/dit/department/list',
        method: 'get'
    })
}

let DEPARTMENT_OPTIONS = []

export const initDepartmentOptions = async () => {
    try {
        const response = await getDepartmentList()
        DEPARTMENT_OPTIONS = response.data.map((item, index) => ({
            label: item.name || item.label,
            value: item.id || item.value || index + 1
        }))
        return DEPARTMENT_OPTIONS
    } catch (error) {
        console.error('获取科室列表失败:', error)
        return []
    }
}

let TITLE_OPTIONS = []

// 获取并初始化职称选项
export const initTitleOptions = async () => {
    try {
        const response = await getTitleList()
        TITLE_OPTIONS = response.data.map((item, index) => ({
            label: item.name || item.label,
            value: item.id || item.value || index + 1
        }))
        return TITLE_OPTIONS
    } catch (error) {
        console.error('获取职称列表失败:', error)
        return []
    }
}

export const ROLE_OPTIONS = [
    { label: "管理员", value: 1 },
    { label: "科研人员", value: 2 }
];

export const getRoleName = (roleId) => {
    const role = ROLE_OPTIONS.find(item => item.value === roleId)
    return role ? role.label : ''
}

export const getDepartmentName = (departmentCode) => {
    const dept = DEPARTMENT_OPTIONS.find(item => item.value === departmentCode)
    return dept ? dept.label : ''
}

export const getTitleName = (titleCode) => {
    const title = TITLE_OPTIONS.find(item => item.value === titleCode)
    return title ? title.label : ''
}