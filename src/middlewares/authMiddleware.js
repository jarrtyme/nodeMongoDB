const jwt = require('jsonwebtoken')
const UserModel = require('../models/userModel')

// JWT密钥配置
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production'
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '15d'

/**
 * JWT鉴权中间件
 * 验证请求头中的Authorization token
 */
const authenticateToken = async (req, res, next) => {
  try {
    // 获取Authorization头
    const authHeader = req.headers['authorization']
    const token = authHeader && authHeader.split(' ')[1] // Bearer TOKEN

    if (!token) {
      return res.status(401).json({
        code: 401,
        message: '访问令牌缺失',
        data: null
      })
    }

    // 验证JWT token
    const decoded = jwt.verify(token, JWT_SECRET)

    // 查找用户
    const user = await UserModel.findById(decoded.userId)
    if (!user) {
      return res.status(401).json({
        code: 401,
        message: '用户不存在',
        data: null
      })
    }

    // 检查用户状态
    if (!user.isAccountActive()) {
      return res.status(401).json({
        code: 401,
        message: '账户已被禁用',
        data: null
      })
    }

    // 将用户信息添加到请求对象
    req.user = user
    next()
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        code: 401,
        message: '无效的访问令牌',
        data: null
      })
    } else if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        code: 401,
        message: '访问令牌已过期',
        data: null
      })
    } else {
      console.error('JWT鉴权错误:', error)
      return res.status(500).json({
        code: 500,
        message: '服务器内部错误',
        data: null
      })
    }
  }
}

/**
 * 角色权限中间件
 * 检查用户是否有指定角色权限
 * @param {string|Array} roles - 允许的角色
 */
const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        code: 401,
        message: '用户未认证',
        data: null
      })
    }

    const userRole = req.user.role
    const allowedRoles = Array.isArray(roles) ? roles : [roles]

    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({
        code: 403,
        message: '权限不足',
        data: null
      })
    }

    next()
  }
}

/**
 * 管理员权限中间件
 * 只有管理员可以访问
 */
const requireAdmin = requireRole('admin')

/**
 * 生成JWT token
 * @param {Object} user - 用户对象
 * @returns {string} - JWT token
 */
const generateToken = (user) => {
  const payload = {
    userId: user._id,
    username: user.username,
    role: user.role
  }

  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN
  })
}

/**
 * 验证JWT token（不抛出异常）
 * @param {string} token - JWT token
 * @returns {Object|null} - 解码后的payload或null
 */
const verifyToken = (token) => {
  try {
    return jwt.verify(token, JWT_SECRET)
  } catch (error) {
    return null
  }
}

/**
 * 刷新token中间件
 * 检查token是否即将过期，如果是则生成新token
 */
const refreshTokenIfNeeded = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization']
    const token = authHeader && authHeader.split(' ')[1]

    if (token) {
      const decoded = jwt.decode(token)
      const now = Math.floor(Date.now() / 1000)
      const expiresIn = decoded.exp - now

      // 如果token在1小时内过期，生成新token
      if (expiresIn < 3600 && expiresIn > 0) {
        const newToken = generateToken(req.user)
        res.setHeader('X-New-Token', newToken)
      }
    }

    next()
  } catch (error) {
    next()
  }
}

module.exports = {
  authenticateToken,
  requireRole,
  requireAdmin,
  generateToken,
  verifyToken,
  refreshTokenIfNeeded,
  JWT_SECRET,
  JWT_EXPIRES_IN
}
