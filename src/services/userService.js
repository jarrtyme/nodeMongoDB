const UserModel = require('../models/userModel')
const { generateToken } = require('../middlewares/authMiddleware')

/**
 * 用户管理服务
 * 处理用户注册、登录、更新等业务逻辑
 */
class UserService {
  /**
   * 用户注册
   * @param {Object} userData - 用户数据
   * @returns {Promise<Object>} - 注册结果
   */
  static async register(userData) {
    try {
      const { username, email, password, role = 'user' } = userData

      // 安全检查：不允许注册 super_admin
      if (role === 'super_admin') {
        throw new Error('不能注册超级管理员角色')
      }

      // 检查用户名是否已存在
      const existingUser = await UserModel.findOne({
        $or: [{ username }, { email }]
      })

      if (existingUser) {
        if (existingUser.username === username) {
          throw new Error('用户名已存在')
        }
        if (existingUser.email === email) {
          throw new Error('邮箱已被注册')
        }
      }

      // 创建新用户
      const user = new UserModel({
        username,
        email,
        password,
        role
      })

      const savedUser = await user.save()

      // 生成JWT token
      const token = generateToken(savedUser)

      return {
        user: savedUser.getPublicProfile(),
        token
      }
    } catch (error) {
      console.error('用户注册失败:', error)
      throw error
    }
  }

  /**
   * 用户登录
   * @param {Object} loginData - 登录数据
   * @returns {Promise<Object>} - 登录结果
   */
  static async login(loginData) {
    try {
      const { username, password } = loginData

      // 查找用户（支持用户名或邮箱登录）
      const user = await UserModel.findOne({
        $or: [{ username }, { email: username }]
      })

      if (!user) {
        throw new Error('用户名或密码错误')
      }

      // 检查账户状态
      if (!user.isAccountActive()) {
        throw new Error('账户已被禁用')
      }

      // 验证密码
      const isPasswordValid = await user.comparePassword(password)
      if (!isPasswordValid) {
        throw new Error('用户名或密码错误')
      }

      // 更新最后登录时间
      await user.updateLastLogin()

      // 生成JWT token
      const token = generateToken(user)

      return {
        user: user.getPublicProfile(),
        token
      }
    } catch (error) {
      console.error('用户登录失败:', error)
      throw error
    }
  }

  /**
   * 获取用户信息
   * @param {string} userId - 用户ID
   * @returns {Promise<Object>} - 用户信息
   */
  static async getUserById(userId) {
    try {
      const user = await UserModel.findById(userId)
      if (!user) {
        throw new Error('用户不存在')
      }
      return user.getPublicProfile()
    } catch (error) {
      console.error('获取用户信息失败:', error)
      throw error
    }
  }

  /**
   * 更新用户信息
   * @param {string} userId - 用户ID
   * @param {Object} updateData - 更新数据
   * @returns {Promise<Object>} - 更新后的用户信息
   */
  static async updateUser(userId, updateData) {
    try {
      const { username, email, avatar, role, isActive, vipLevel, menuPermissions } = updateData

      // 如果更新用户名，检查是否已被其他用户使用
      if (username !== undefined) {
        const existingUser = await UserModel.findOne({
          username,
          _id: { $ne: userId }
        })
        if (existingUser) {
          throw new Error('用户名已被使用')
        }
      }

      // 如果更新邮箱，检查是否已被其他用户使用
      if (email !== undefined) {
        const existingUser = await UserModel.findOne({
          email: email.toLowerCase(),
          _id: { $ne: userId }
        })
        if (existingUser) {
          throw new Error('邮箱已被注册')
        }
      }

      // 构建更新对象
      const updateFields = {}
      if (username !== undefined) updateFields.username = username
      if (email !== undefined) updateFields.email = email.toLowerCase()
      if (avatar !== undefined) updateFields.avatar = avatar
      if (role !== undefined) updateFields.role = role
      if (isActive !== undefined) updateFields.isActive = isActive
      if (vipLevel !== undefined) updateFields.vipLevel = vipLevel
      if (menuPermissions !== undefined) updateFields.menuPermissions = menuPermissions

      const user = await UserModel.findByIdAndUpdate(userId, updateFields, {
        new: true,
        runValidators: true
      })

      if (!user) {
        throw new Error('用户不存在')
      }

      return user.getPublicProfile()
    } catch (error) {
      console.error('更新用户信息失败:', error)
      throw error
    }
  }

  /**
   * 修改密码
   * @param {string} userId - 用户ID
   * @param {string} oldPassword - 旧密码
   * @param {string} newPassword - 新密码
   * @returns {Promise<Object>} - 修改结果
   */
  static async changePassword(userId, oldPassword, newPassword) {
    try {
      const user = await UserModel.findById(userId)
      if (!user) {
        throw new Error('用户不存在')
      }

      // 验证旧密码
      const isOldPasswordValid = await user.comparePassword(oldPassword)
      if (!isOldPasswordValid) {
        throw new Error('旧密码错误')
      }

      // 更新密码
      user.password = newPassword
      await user.save()

      return { message: '密码修改成功' }
    } catch (error) {
      console.error('修改密码失败:', error)
      throw error
    }
  }

  /**
   * 获取用户列表
   * @param {Object} query - 查询条件
   * @param {number} page - 页码
   * @param {number} limit - 每页数量
   * @returns {Promise<Object>} - 用户列表
   */
  static async getUserList(query = {}, page = 1, limit = 10) {
    try {
      const skip = (page - 1) * limit

      const users = await UserModel.find(query)
        .select('-password')
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 })

      const total = await UserModel.countDocuments(query)

      return {
        users,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }
    } catch (error) {
      console.error('获取用户列表失败:', error)
      throw error
    }
  }

  /**
   * 删除用户
   * @param {string} userId - 用户ID
   * @returns {Promise<Object>} - 删除结果
   */
  static async deleteUser(userId) {
    try {
      const user = await UserModel.findByIdAndDelete(userId)
      if (!user) {
        throw new Error('用户不存在')
      }
      return { message: '用户删除成功' }
    } catch (error) {
      console.error('删除用户失败:', error)
      throw error
    }
  }

  /**
   * 验证token并获取用户信息
   * @param {string} token - JWT token
   * @returns {Promise<Object>} - 用户信息
   */
  static async validateToken(token) {
    try {
      const jwt = require('jsonwebtoken')
      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production'
      )

      const user = await UserModel.findById(decoded.userId)
      if (!user || !user.isAccountActive()) {
        throw new Error('用户不存在或已被禁用')
      }

      return user.getPublicProfile()
    } catch (error) {
      console.error('验证token失败:', error)
      throw error
    }
  }
}

module.exports = UserService
