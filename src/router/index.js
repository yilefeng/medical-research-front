import { createRouter, createWebHistory } from 'vue-router'
import { getToken } from '@/utils/auth'
import { ElMessage } from 'element-plus'

// 导入组件
import Login from '@/views/login/Login.vue'
import Layout from '@/views/layout/Layout.vue'
import ExperimentPlan from '@/views/experiment/ExperimentPlan.vue'
import ResearchData from '@/views/research/ResearchData.vue'
import ReportManage from '@/views/report/ReportManage.vue'
import AnalysisManage from '@/views/report/AnalysisManage.vue'
import UserCenter from '@/views/user/UserCenter.vue'
import SysUser from '@/views/system/SysUser.vue'
import SysRole from '@/views/system/SysRole.vue'
import SysOperLog from '@/views/system/SysOperLog.vue'

// 路由规则
const routes = [
    {
        path: '/',
        redirect: '/login'
    },
    {
        path: '/login',
        name: 'Login',
        component: Login
    },
    {
        path: '/home',
        name: 'Layout',
        component: Layout,
        children: [
            { path: 'experiment/plan', name: 'ExperimentPlan', component: ExperimentPlan, meta: { title: '实验方案管理' } },
            { path: 'research/data', name: 'ResearchData', component: ResearchData, meta: { title: '科研数据管理' } },
            { path: 'analysis/manage', name: 'AnalysisManage', component: AnalysisManage, meta: { title: '统计分析' } },
            { path: 'report/manage', name: 'ReportManage', component: ReportManage, meta: { title: '报告管理' } },
            { path: 'user/center', name: 'UserCenter', component: UserCenter, meta: { title: '个人中心' }},
            { path: 'sys/user', name: 'SysUser', component: SysUser, meta: { title: '用户管理' } },
            // { path: 'sys/role', name: 'SysRole', component: SysRole, meta: { title: '角色管理' } },
            { path: 'sys/oper/log', name: 'SysOperLog', component: SysOperLog, meta: { title: '操作日志' } }
        ]
    }
]

// 创建路由实例
const router = createRouter({
    history: createWebHistory(),
    routes
})

// 路由守卫
router.beforeEach((to, from, next) => {
    // 设置页面标题
    if (to.meta.title) {
        document.title = to.meta.title + ' - 深睿科研统计分析系统'
    } else {
        document.title = '深睿科研统计分析系统'
    }

    // 登录验证
    if (to.path !== '/login') {
        const token = getToken()
        if (!token) {
            ElMessage.warning('请先登录')
            next('/login')
        } else {
            next()
        }
    } else {
        next()
    }
})

export default router