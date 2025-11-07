<template>
  <div class="auth-container">
    <div class="auth-box">
      <el-tabs v-model="activeTab" class="auth-tabs" @tab-change="handleTabChange">
        <el-tab-pane label="登录" name="login">
          <div class="auth-header">
            <h2>欢迎登录1</h2>
            <p>请输入您的账号和密码</p>
          </div>

          <el-form
            ref="loginFormRef"
            :model="loginForm"
            :rules="loginRules"
            class="auth-form"
            label-position="top"
          >
            <el-form-item label="用户名" prop="username">
              <el-input
                v-model="loginForm.username"
                placeholder="请输入用户名"
                size="large"
                :prefix-icon="User"
                clearable
              />
            </el-form-item>

            <el-form-item label="密码" prop="password">
              <el-input
                v-model="loginForm.password"
                type="password"
                placeholder="请输入密码"
                size="large"
                :prefix-icon="Lock"
                show-password
                clearable
                @keyup.enter="handleLogin"
              />
            </el-form-item>

            <el-form-item>
              <div class="auth-options">
                <el-checkbox v-model="rememberMe">记住我</el-checkbox>
                <el-link type="primary" :underline="false">忘记密码？</el-link>
              </div>
            </el-form-item>

            <el-form-item>
              <el-button
                type="primary"
                size="large"
                :loading="loginLoading"
                class="auth-button"
                @click="handleLogin"
              >
                {{ loginLoading ? '登录中...' : '登录' }}
              </el-button>
            </el-form-item>
          </el-form>
        </el-tab-pane>

        <el-tab-pane label="注册" name="register">
          <div class="auth-header">
            <h2>用户注册</h2>
            <p>创建您的账号</p>
          </div>

          <el-form
            ref="registerFormRef"
            :model="registerForm"
            :rules="registerRules"
            class="auth-form"
            label-position="top"
          >
            <el-form-item label="用户名" prop="username">
              <el-input
                v-model="registerForm.username"
                placeholder="请输入用户名（3-20个字符）"
                size="large"
                :prefix-icon="User"
                clearable
              />
            </el-form-item>

            <el-form-item label="邮箱" prop="email">
              <el-input
                v-model="registerForm.email"
                placeholder="请输入邮箱地址"
                size="large"
                :prefix-icon="Message"
                clearable
              />
            </el-form-item>

            <el-form-item label="密码" prop="password">
              <el-input
                v-model="registerForm.password"
                type="password"
                placeholder="请输入密码（至少6个字符）"
                size="large"
                :prefix-icon="Lock"
                show-password
                clearable
              />
            </el-form-item>

            <el-form-item label="确认密码" prop="confirmPassword">
              <el-input
                v-model="registerForm.confirmPassword"
                type="password"
                placeholder="请再次输入密码"
                size="large"
                :prefix-icon="Lock"
                show-password
                clearable
                @keyup.enter="handleRegister"
              />
            </el-form-item>

            <el-form-item label="角色" prop="role">
              <el-select
                v-model="registerForm.role"
                placeholder="请选择角色（可选）"
                size="large"
                style="width: 100%"
              >
                <el-option label="普通用户" value="user" />
                <el-option label="管理员" value="admin" />
              </el-select>
            </el-form-item>

            <el-form-item>
              <el-button
                type="primary"
                size="large"
                :loading="registerLoading"
                class="auth-button"
                @click="handleRegister"
              >
                {{ registerLoading ? '注册中...' : '注册' }}
              </el-button>
            </el-form-item>
          </el-form>
        </el-tab-pane>
      </el-tabs>
    </div>
  </div>
</template>

<script setup>
import { User, Lock, Message } from '@element-plus/icons-vue'
import { register as registerApi } from '@/api/auth'

defineOptions({
  name: 'Auth'
})

// 根据路由自动切换 Tab
const route = useRoute()
const router = useRouter()
const activeTab = ref(route.path === '/register' ? 'register' : 'login')

// 监听路由变化，自动切换 tab
watch(
  () => route.path,
  path => {
    activeTab.value = path === '/register' ? 'register' : 'login'
  }
)

// 登录相关
const loginFormRef = ref(null)
const loginLoading = ref(false)
const rememberMe = ref(false)

const loginForm = reactive({
  username: '',
  password: ''
})

const loginRules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 3, max: 20, message: '用户名长度在 3 到 20 个字符', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, max: 20, message: '密码长度在 6 到 20 个字符', trigger: 'blur' }
  ]
}

// 注册相关
const registerFormRef = ref(null)
const registerLoading = ref(false)

const registerForm = reactive({
  username: '',
  email: '',
  password: '',
  confirmPassword: '',
  role: 'user'
})

// 自定义验证规则：确认密码
const validateConfirmPassword = (rule, value, callback) => {
  if (value !== registerForm.password) {
    callback(new Error('两次输入的密码不一致'))
  } else {
    callback()
  }
}

// 邮箱验证规则
const validateEmail = (rule, value, callback) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!value) {
    callback(new Error('请输入邮箱地址'))
  } else if (!emailRegex.test(value)) {
    callback(new Error('请输入正确的邮箱地址'))
  } else {
    callback()
  }
}

const registerRules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 3, max: 20, message: '用户名长度在 3 到 20 个字符', trigger: 'blur' }
  ],
  email: [{ required: true, validator: validateEmail, trigger: 'blur' }],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, message: '密码至少 6 个字符', trigger: 'blur' }
  ],
  confirmPassword: [
    { required: true, message: '请再次输入密码', trigger: 'blur' },
    { validator: validateConfirmPassword, trigger: 'blur' }
  ],
  role: []
}

// Tab 切换处理
const handleTabChange = tabName => {
  // 切换 tab 时更新路由
  if (tabName === 'register') {
    router.push('/register')
  } else {
    router.push('/login')
  }

  // 切换 tab 时重置表单验证
  if (loginFormRef.value) {
    loginFormRef.value.clearValidate()
  }
  if (registerFormRef.value) {
    registerFormRef.value.clearValidate()
  }
}

// 登录处理
const handleLogin = async () => {
  if (!loginFormRef.value) return

  await loginFormRef.value.validate(async valid => {
    if (!valid) return

    loginLoading.value = true
    try {
      const userStore = useUserStore()

      // 调用 store 的登录方法（会自动调用 API 并保存 token）
      await userStore.login(loginForm)

      ElMessage.success('登录成功')

      // 跳转到之前访问的页面，如果没有则跳转到首页
      const redirect = route.query.redirect || '/'
      router.push(redirect)
    } catch (error) {
      ElMessage.error(error.message || '登录失败，请检查用户名和密码')
    } finally {
      loginLoading.value = false
    }
  })
}

// 注册处理
const handleRegister = async () => {
  if (!registerFormRef.value) return

  await registerFormRef.value.validate(async valid => {
    if (!valid) return

    registerLoading.value = true
    try {
      // 准备注册数据（不包含 confirmPassword）
      const registerData = {
        username: registerForm.username,
        email: registerForm.email,
        password: registerForm.password,
        role: registerForm.role || 'user'
      }

      // 调用注册 API
      const response = await registerApi(registerData)

      // 处理注册响应，保存 token 和用户信息
      const userStore = useUserStore()
      if (response && response.data) {
        userStore.handleRegisterResponse(response)
        ElMessage.success(response.message || '注册成功！')
      } else {
        ElMessage.success('注册成功！请登录')
      }

      // 注册成功后切换到登录 tab
      activeTab.value = 'login'
      router.push('/login')

      // 清空注册表单
      registerFormRef.value.resetFields()

      // 自动填充登录表单的用户名
      loginForm.username = registerData.username
    } catch (error) {
      ElMessage.error(error.message || '注册失败，请检查输入信息')
    } finally {
      registerLoading.value = false
    }
  })
}
</script>

<style lang="scss" scoped>
.auth-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px;
}

.auth-box {
  width: 100%;
  max-width: 480px;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
  padding: 40px;
}

.auth-tabs {
  :deep(.el-tabs__header) {
    margin-bottom: 24px;
  }

  :deep(.el-tabs__item) {
    font-size: 16px;
    font-weight: 500;
    padding: 0 24px;
  }

  :deep(.el-tabs__nav-wrap::after) {
    background-color: $border-color-lighter;
  }
}

.auth-header {
  text-align: center;
  margin-bottom: 32px;

  h2 {
    font-size: 28px;
    color: $text-color;
    margin-bottom: 8px;
    font-weight: 600;
  }

  p {
    color: $text-color-secondary;
    font-size: 14px;
  }
}

.auth-form {
  :deep(.el-form-item) {
    margin-bottom: 20px;
  }

  :deep(.el-form-item__label) {
    color: $text-color;
    font-weight: 500;
    padding-bottom: 8px;
  }
}

.auth-options {
  display: flex;
  justify-content: space-between;
  width: 100%;
  align-items: center;
}

.auth-button {
  width: 100%;
  height: 44px;
  font-size: 16px;
  font-weight: 500;
  margin-top: 8px;
}
</style>
