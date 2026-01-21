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

// 在 script 部分顶部定义常量
export const DEPARTMENT_OPTIONS = [
    { label: "信息科", value: 1 },
    { label: "心血管内科", value: 2 },
    { label: "消化内科", value: 3 },
    { label: "肾内科", value: 4 },
    { label: "呼吸内科", value: 5 },
    { label: "内分泌科", value: 6 },
    { label: "神经内科", value: 7 },
    { label: "高压氧科", value: 8 },
    { label: "血液科", value: 9 },
    { label: "普通外科", value: 10 },
    { label: "心血管外科", value: 11 },
    { label: "胸外科", value: 12 },
    { label: "肝胆外科", value: 13 },
    { label: "神经外科", value: 14 },
    { label: "泌尿科", value: 15 },
    { label: "骨科", value: 16 },
    { label: "麻醉医学科", value: 17 },
    { label: "整形美容科", value: 18 },
    { label: "妇产科", value: 19 },
    { label: "皮肤性病科", value: 20 },
    { label: "口腔科", value: 21 },
    { label: "儿科", value: 22 },
    { label: "耳鼻咽喉头颈外科", value: 23 },
    { label: "眼科", value: 24 },
    { label: "中医科", value: 25 },
    { label: "康复医学科", value: 26 },
    { label: "营养科", value: 27 },
    { label: "全科医学科", value: 28 },
    { label: "放射科", value: 29 },
    { label: "超声科", value: 30 },
    { label: "病理科", value: 31 },
    { label: "检验科", value: 32 },
    { label: "输血科", value: 33 },
    { label: "药剂科", value: 34 },
    { label: "药学部", value: 35 },
    { label: "急诊科", value: 36 },
    { label: "医工科", value: 37 },
    { label: "药理基地", value: 38 },
    { label: "体检中心", value: 39 },
    { label: "老年医学科", value: 40 },
    { label: "门诊部", value: 41 },
    { label: "机关部门", value: 42 },
    { label: "其他", value: 43 }
];

export const TITLE_OPTIONS = [
    { label: "住院医师", value: 1 },
    { label: "主治医师", value: 2 },
    { label: "副主任医师", value: 3 },
    { label: "主任医师", value: 4 },
    { label: "护师", value: 5 },
    { label: "主管护师", value: 6 },
    { label: "副主任护师", value: 7 },
    { label: "主任护师", value: 8 },
    { label: "技师", value: 9 },
    { label: "主管技师", value: 10 },
    { label: "副主任技师", value: 11 },
    { label: "主任技师", value: 12 },
    { label: "药师", value: 13 },
    { label: "主管药师", value: 14 },
    { label: "副主任药师", value: 15 },
    { label: "主任药师", value: 16 },
    { label: "助教", value: 17 },
    { label: "讲师", value: 18 },
    { label: "副教授", value: 19 },
    { label: "教授", value: 20 },
    { label: "科员", value: 21 },
    { label: "副主任", value: 22 },
    { label: "主任", value: 23 },
    { label: "副处长", value: 24 },
    { label: "处长", value: 25 },
    { label: "副院长", value: 26 },
    { label: "院长", value: 27 },
    { label: "研究实习员", value: 28 },
    { label: "助理研究员", value: 29 },
    { label: "副研究员", value: 30 },
    { label: "研究员", value: 31 },
    { label: "助理实验师", value: 32 },
    { label: "中级实验师", value: 33 },
    { label: "高级实验师", value: 34 },
    { label: "助理工程师", value: 35 },
    { label: "工程师", value: 36 },
    { label: "高级工程师", value: 37 },
    { label: "正高级工程师", value: 38 },
    { label: "专科生", value: 39 },
    { label: "本科生", value: 40 },
    { label: "硕士生", value: 41 },
    { label: "博士生", value: 42 },
    { label: "博士后", value: 43 },
    { label: "规培生", value: 44 },
    { label: "其他", value: 45 }
];

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