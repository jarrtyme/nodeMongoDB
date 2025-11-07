import { defineStore } from 'pinia'
import { login as loginApi } from '@/api/auth'

export const useUserStore = defineStore('user', {
  state: () => ({
    token: localStorage.getItem('token') || '',
    userInfo: JSON.parse(localStorage.getItem('userInfo') || 'null'),
    rememberMe: false
  }),

  getters: {
    isLoggedIn: state => !!state.token,
    userName: state => state.userInfo?.username || '',
    userId: state => state.userInfo?.id || ''
  },

  actions: {
    // 设置 token
    setToken(token) {
      this.token = token
      if (token) {
        localStorage.setItem('token', token)
      } else {
        localStorage.removeItem('token')
      }
    },

    // 设置用户信息
    setUserInfo(userInfo) {
      this.userInfo = userInfo
      if (userInfo) {
        localStorage.setItem('userInfo', JSON.stringify(userInfo))
      } else {
        localStorage.removeItem('userInfo')
      }
    },

    // 设置记住我
    setRememberMe(remember) {
      this.rememberMe = remember
    },

    // 登录
    async login(loginData) {
      const response = await loginApi(loginData)

      // 处理响应格式: {code: 200, message: "登录成功", data: {user, token}}
      if (response.code === 200 && response.data) {
        if (response.data.token) {
          this.setToken(response.data.token)
        }
        if (response.data.user) {
          this.setUserInfo(response.data.user)
        }
        return response
      } else {
        throw new Error(response.message || '登录失败')
      }
    },

    // 处理注册响应
    handleRegisterResponse(response) {
      // 后端返回格式: {code: 200, message: "注册成功", data: {user, token}}
      if (response.code === 200 && response.data) {
        if (response.data.token) {
          this.setToken(response.data.token)
        }
        if (response.data.user) {
          this.setUserInfo(response.data.user)
        }
      } else if (response.data && response.data.token && response.data.user) {
        // 兼容格式: {data: {user, token}}
        this.setToken(response.data.token)
        this.setUserInfo(response.data.user)
      } else if (response.token && response.user) {
        // 兼容格式: {token, user}
        this.setToken(response.token)
        this.setUserInfo(response.user)
      }
    },

    // 登出
    async logout() {
      // TODO: 调用登出 API
      // await logoutApi()

      this.setToken('')
      this.setUserInfo(null)
    },

    // 清除用户信息
    clearUserInfo() {
      this.setToken('')
      this.setUserInfo(null)
    }
  }
})
