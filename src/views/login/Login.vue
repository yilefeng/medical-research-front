<template>
  <div class="login-container">
    <el-card class="login-card">
      <div class="login-title">深睿科研统计分析系统</div>
      <el-form
          :model="loginForm"
          :rules="loginRules"
          ref="loginFormRef"
          label-width="80px"
          @keyup.enter="handleLogin"
      >
        <el-form-item label="用户名" prop="username">
          <el-input
              ref="usernameInputRef"
              v-model="loginForm.username"
              placeholder="请输入用户名"
              clearable
          />
        </el-form-item>
        <el-form-item label="密码" prop="password">
          <el-input
              v-model="loginForm.password"
              type="password"
              placeholder="请输入密码"
              clearable
              show-password
          />
        </el-form-item>
        <el-form-item>
          <el-button
              type="primary"
              @click="handleLogin"
              class="login-btn"
              :loading="isLoading"
              :disabled="isLoading"
          >
            登录
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, nextTick } from 'vue'
import { ElMessage } from 'element-plus'
import { useRouter } from 'vue-router'
import { login } from '@/api/login'
import { setToken, setUserInfo } from '@/utils/auth'
import { aesEncrypt, aesDecrypt } from '@/utils/aes'

const router = useRouter()
const loginFormRef = ref(null)
const usernameInputRef = ref(null)

// 登录表单
const loginForm = reactive({
  username: '',
  password: ''
})

// 校验规则
const loginRules = reactive({
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }]
})

const isLoading = ref(false)

// ========== 登录逻辑 ==========
const handleLogin = async () => {
  if (isLoading.value) return

  try {
    await loginFormRef.value.validate()
    isLoading.value = true

    console.log('原始密码:', loginForm.password)
    // 用AES加密密码（核心修改）
    const encryptPwd = aesEncrypt(loginForm.password)
    // console.log('AES加密后密码:', encryptPwd)
    // 测试解密（前端验证用，后端需执行相同解密逻辑）
    // console.log('AES解密还原:', aesDecrypt(encryptPwd))

    // 发送登录请求（传输加密后的密码）
    const res = await login({
      username: loginForm.username,
      password: encryptPwd // 传AES加密后的密码
    })

    if (!res || !res.data || !res.data.token) {
      ElMessage.error('登录失败：未获取到有效Token')
      return
    }

    setToken(res.data.token)
    setUserInfo(res.data.user)
    ElMessage.success('登录成功，即将跳转首页')

    setTimeout(() => {
      router.push('/home/experiment/plan')
    }, 800)
  } catch (error) {
    if (error.name === 'ValidationError') {
      ElMessage.warning('请完成必填项输入')
    } else if (error.response) {
      const errMsg = error.response.data?.msg || `登录失败：${error.response.status}`
      ElMessage.error(errMsg)
    } else if (error.request) {
      ElMessage.error('登录失败：无法连接到服务器，请检查网络')
    } else {
      ElMessage.error(`登录失败：${error.message}`)
    }
    console.error('登录失败详情:', error)
  } finally {
    isLoading.value = false
  }
}

// 页面加载聚焦用户名输入框
nextTick(() => {
  if (usernameInputRef.value && typeof usernameInputRef.value.focus === 'function') {
    usernameInputRef.value.focus()
  }
})
</script>

<style scoped>
.login-container {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  background-color: #f5f5f5;
  margin: 0;
}

.login-card {
  width: 400px;
  padding: 20px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}

.login-title {
  font-size: 20px;
  text-align: center;
  margin-bottom: 20px;
  color: #1989fa;
  font-weight: 600;
}

.login-btn {
  width: 100%;
  height: 40px;
  font-size: 16px;
}

:deep(.el-input__clear) {
  cursor: pointer;
}
</style>