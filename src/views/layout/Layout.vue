<template>
  <el-container style="height: 100%;">
    <el-aside width="200px" style="background-color: #2e3b4e;">
      <el-menu
          :default-active="activePath"
          class="el-menu-vertical-demo"
          background-color="#2e3b4e"
          text-color="#fff"
          active-text-color="#ffd04b"
          @select="handleMenuSelect"
      >
        <el-menu-item index="/home/experiment/plan">
          <el-icon><Document /></el-icon>
          <template #title>实验方案管理</template>
        </el-menu-item>
        <el-menu-item index="/home/research/data">
          <el-icon><DataAnalysis /></el-icon>
          <template #title>科研数据管理</template>
        </el-menu-item>
        <el-menu-item index="/home/analysis/manage">
          <el-icon><Files /></el-icon>
          <template #title>统计分析</template>
        </el-menu-item>
        <el-menu-item index="/home/report/manage">
          <el-icon><Files /></el-icon>
          <template #title>报告管理</template>
        </el-menu-item>
        <el-sub-menu index="system">
          <template #title>
            <el-icon><Setting /></el-icon>
            <span>系统管理</span>
          </template>
          <el-menu-item index="/home/sys/user">用户管理</el-menu-item>
          <el-menu-item index="/home/sys/role">角色管理</el-menu-item>
          <el-menu-item index="/home/sys/oper/log">操作日志</el-menu-item>
        </el-sub-menu>
        <el-menu-item index="logout" @click="handleLogout">
          <el-icon><SwitchButton /></el-icon>
          <template #title>退出登录</template>
        </el-menu-item>
      </el-menu>
    </el-aside>

    <el-container>
      <el-header style="text-align: right; font-size: 12px">
        <el-dropdown>
          <i class="el-icon-setting" style="margin-right: 15px"></i>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item>查看</el-dropdown-item>
              <el-dropdown-item>新增</el-dropdown-item>
              <el-dropdown-item>删除</el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
        <span>欢迎回来，管理员</span>
      </el-header>

      <el-main>
        <router-view />
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Document, DataAnalysis, Files, FolderOpened,
  Setting, SwitchButton
} from '@element-plus/icons-vue'
import { removeToken } from '@/utils/auth'

const router = useRouter()
const route = useRoute()

// 当前激活的菜单路径
const activePath = ref(route.path)

// 菜单选择事件
const handleMenuSelect = (index) => {
  if (index === 'logout') return
  router.push(index)
}

// 退出登录
const handleLogout = () => {
  ElMessageBox.confirm(
      '确定要退出登录吗？',
      '提示',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
  ).then(() => {
    removeToken()
    ElMessage.success('退出成功')
    router.push('/login')
  }).catch(() => {
    ElMessage.info('已取消退出')
  })
}

// 路由变化时更新激活菜单
onMounted(() => {
  router.afterEach((to) => {
    activePath.value = to.path
  })
})
</script>

<style scoped>
.el-header {
  background-color: #fff;
  color: #333;
  line-height: 60px;
}

.el-aside {
  color: #333;
}

.el-menu {
  border-right: none;
  height: 100%;
}
</style>