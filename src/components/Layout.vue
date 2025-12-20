<template>
  <el-container style="height: 100vh;">
    <el-aside width="200px" style="background-color: #2e3b4e;">
      <el-menu
          default-active="1"
          class="el-menu-vertical-demo"
          background-color="#2e3b4e"
          text-color="#fff"
          active-text-color="#ffd04b"
          @select="handleMenuSelect"
      >
        <el-menu-item index="1">
          <el-icon><House /></el-icon>
          <template #title>首页</template>
        </el-menu-item>
        <el-sub-menu index="2">
          <template #title>
            <el-icon><Document /></el-icon>
            <span>实验管理</span>
          </template>
          <el-menu-item index="2-1">实验方案</el-menu-item>
          <el-menu-item index="2-2">科研数据</el-menu-item>
        </el-sub-menu>
        <el-menu-item index="3">
          <el-icon><PieChart /></el-icon>
          <template #title>统计报告</template>
        </el-menu-item>
        <el-menu-item index="4">
          <el-icon><Folder /></el-icon>
          <template #title>数据源管理</template>
        </el-menu-item>
        <el-menu-item index="5" @click="handleLogout">
          <el-icon><UserFilled /></el-icon>
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
        <span>{{ userInfo.realName || '未知用户' }}</span>
      </el-header>
      <el-main>
        <router-view />
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { House, Document, PieChart, Folder, UserFilled } from '@element-plus/icons-vue'

const router = useRouter()
const userInfo = ref(JSON.parse(localStorage.getItem('user') || '{}'))

// 菜单选择
const handleMenuSelect = (index) => {
  switch (index) {
    case '1':
      router.push('/')
      break
    case '2-1':
      router.push('/experiment/plan')
      break
    case '2-2':
      router.push('/research/data')
      break
    case '3':
      router.push('/report/analysis')
      break
    case '4':
      router.push('/datasource')
      break
  }
}

// 退出登录
const handleLogout = () => {
  localStorage.clear()
  ElMessage.success('退出成功')
  router.push('/login')
}

onMounted(() => {
  if (!localStorage.getItem('token')) {
    router.push('/login')
  }
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
</style>