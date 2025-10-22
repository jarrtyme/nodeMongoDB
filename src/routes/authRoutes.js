const express = require('express')
const router = express.Router()
const UserService = require('../services/userService')
const { authenticateToken, requireAdmin } = require('../middlewares/authMiddleware')

/**
 * 用户注册
 * POST /auth/register
 */
router.post('/register', async (req, res) => {
  try {
    const { username, email, password, role } = req.body

    // 基本验证
    if (!username || !email || !password) {
      return res.status(400).json({
        code: 400,
        message: '用户名、邮箱和密码不能为空',
        data: null
      })
    }

    if (password.length < 6) {
      return res.status(400).json({
        code: 400,
        message: '密码至少6个字符',
        data: null
      })
    }

    const result = await UserService.register({ username, email, password, role })
    
    res.status(201).json({
      code: 201,
      message: '注册成功',
      data: result
    })
  } catch (error) {
    console.error('注册失败:', error)
    res.status(400).json({
      code: 400,
      message: error.message || '注册失败',
      data: null
    })
  }
})

/**
 * 用户登录
 * POST /auth/login
 */
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body

    if (!username || !password) {
      return res.status(400).json({
        code: 400,
        message: '用户名和密码不能为空',
        data: null
      })
    }

    const result = await UserService.login({ username, password })
    
    res.json({
      code: 200,
      message: '登录成功',
      data: result
    })
  } catch (error) {
    console.error('登录失败:', error)
    res.status(401).json({
      code: 401,
      message: error.message || '登录失败',
      data: null
    })
  }
})

/**
 * 获取当前用户信息
 * POST /auth/profile
 */
router.post('/profile', authenticateToken, async (req, res) => {
  try {
    const user = req.user.getPublicProfile()
    res.json({
      code: 200,
      message: '获取用户信息成功',
      data: { user }
    })
  } catch (error) {
    console.error('获取用户信息失败:', error)
    res.status(500).json({
      code: 500,
      message: '获取用户信息失败',
      data: null
    })
  }
})

/**
 * 更新用户信息
 * POST /auth/update
 */
router.post('/update', authenticateToken, async (req, res) => {
  try {
    const userId = req.user._id
    const updateData = req.body

    // 不允许直接修改密码和角色
    delete updateData.password
    delete updateData.role

    const user = await UserService.updateUser(userId, updateData)
    
    res.json({
      code: 200,
      message: '更新用户信息成功',
      data: { user }
    })
  } catch (error) {
    console.error('更新用户信息失败:', error)
    res.status(400).json({
      code: 400,
      message: error.message || '更新用户信息失败',
      data: null
    })
  }
})

/**
 * 修改密码
 * POST /auth/change-password
 */
router.post('/change-password', authenticateToken, async (req, res) => {
  try {
    const userId = req.user._id
    const { oldPassword, newPassword } = req.body

    if (!oldPassword || !newPassword) {
      return res.status(400).json({
        code: 400,
        message: '旧密码和新密码不能为空',
        data: null
      })
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        code: 400,
        message: '新密码至少6个字符',
        data: null
      })
    }

    await UserService.changePassword(userId, oldPassword, newPassword)
    
    res.json({
      code: 200,
      message: '密码修改成功',
      data: null
    })
  } catch (error) {
    console.error('修改密码失败:', error)
    res.status(400).json({
      code: 400,
      message: error.message || '修改密码失败',
      data: null
    })
  }
})

/**
 * 验证token
 * POST /auth/verify
 */
router.post('/verify', async (req, res) => {
  try {
    const authHeader = req.headers['authorization']
    const token = authHeader && authHeader.split(' ')[1]

    if (!token) {
      return res.status(401).json({
        code: 401,
        message: '访问令牌缺失',
        data: null
      })
    }

    const jwt = require('jsonwebtoken')
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production')
    
    const UserModel = require('../models/userModel')
    const user = await UserModel.findById(decoded.userId)
    if (!user || !user.isAccountActive()) {
      return res.status(401).json({
        code: 401,
        message: '用户不存在或已被禁用',
        data: null
      })
    }
    
    res.json({
      code: 200,
      message: 'Token验证成功',
      data: { user: user.getPublicProfile() }
    })
  } catch (error) {
    console.error('Token验证失败:', error)
    res.status(401).json({
      code: 401,
      message: error.message || 'Token验证失败',
      data: null
    })
  }
})

/**
 * 获取用户列表（仅管理员）
 * POST /auth/users
 */
router.post('/users', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 10, ...query } = req.body
    const result = await UserService.getUserList(query, page, limit)
    
    res.json({
      code: 200,
      message: '获取用户列表成功',
      data: result
    })
  } catch (error) {
    console.error('获取用户列表失败:', error)
    res.status(500).json({
      code: 500,
      message: '获取用户列表失败',
      data: null
    })
  }
})

/**
 * 更新用户角色（仅管理员）
 * POST /auth/users/:userId/role
 */
router.post('/users/:userId/role', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { userId } = req.params
    const { role } = req.body

    if (!role || !['admin', 'user'].includes(role)) {
      return res.status(400).json({
        code: 400,
        message: '角色必须是admin或user',
        data: null
      })
    }

    const user = await UserService.updateUser(userId, { role })
    
    res.json({
      code: 200,
      message: '更新用户角色成功',
      data: { user }
    })
  } catch (error) {
    console.error('更新用户角色失败:', error)
    res.status(400).json({
      code: 400,
      message: error.message || '更新用户角色失败',
      data: null
    })
  }
})

/**
 * 禁用/启用用户（仅管理员）
 * POST /auth/users/:userId/status
 */
router.post('/users/:userId/status', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { userId } = req.params
    const { isActive } = req.body

    if (typeof isActive !== 'boolean') {
      return res.status(400).json({
        code: 400,
        message: 'isActive必须是布尔值',
        data: null
      })
    }

    const user = await UserService.updateUser(userId, { isActive })
    
    res.json({
      code: 200,
      message: `用户已${isActive ? '启用' : '禁用'}`,
      data: { user }
    })
  } catch (error) {
    console.error('更新用户状态失败:', error)
    res.status(400).json({
      code: 400,
      message: error.message || '更新用户状态失败',
      data: null
    })
  }
})

/**
 * 删除用户（仅管理员）
 * POST /auth/users/:userId/delete
 */
router.post('/users/:userId/delete', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { userId } = req.params

    // 不能删除自己
    if (userId === req.user._id.toString()) {
      return res.status(400).json({
        code: 400,
        message: '不能删除自己的账户',
        data: null
      })
    }

    await UserService.deleteUser(userId)
    
    res.json({
      code: 200,
      message: '用户删除成功',
      data: null
    })
  } catch (error) {
    console.error('删除用户失败:', error)
    res.status(400).json({
      code: 400,
      message: error.message || '删除用户失败',
      data: null
    })
  }
})

module.exports = router
