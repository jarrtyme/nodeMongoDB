const mongoose = require('mongoose')

/**
 * 系统设置数据模型
 *
 * 该模型用于管理系统全局配置，包括：
 * - 基本设置（网站名称、描述、Logo）
 * - 安全设置（注册、邮箱验证、密码策略、会话管理）
 * - 通知设置（邮件、短信、系统通知）
 *
 * 系统设置是全局唯一的，使用单例模式存储
 */
const SettingsSchema = new mongoose.Schema({
  // 基本设置
  basic: {
    siteName: {
      type: String,
      default: '后台管理系统',
      trim: true
    }, // 网站名称
    siteDescription: {
      type: String,
      default: '这是一个功能完善的后台管理系统',
      trim: true
    }, // 网站描述
    logo: {
      type: String,
      default: '',
      trim: true
    } // 网站Logo URL
  },
  // 安全设置
  security: {
    allowRegister: {
      type: Boolean,
      default: true
    }, // 允许注册
    requireEmailVerify: {
      type: Boolean,
      default: false
    }, // 需要邮箱验证
    minPasswordLength: {
      type: Number,
      default: 6,
      min: 6,
      max: 20
    }, // 密码最小长度
    sessionTimeout: {
      type: Number,
      default: 30,
      min: 5,
      max: 1440
    } // 会话超时时间（分钟）
  },
  // 通知设置
  notification: {
    emailNotification: {
      type: Boolean,
      default: true
    }, // 邮件通知
    smsNotification: {
      type: Boolean,
      default: false
    }, // 短信通知
    systemNotification: {
      type: Boolean,
      default: true
    } // 系统通知
  },
  createdAt: {
    type: Date,
    default: Date.now
  }, // 创建时间
  updatedAt: {
    type: Date,
    default: Date.now
  } // 更新时间
})

/**
 * 更新前中间件：自动更新修改时间
 */
SettingsSchema.pre('save', function (next) {
  this.updatedAt = new Date()
  next()
})

SettingsSchema.pre('findOneAndUpdate', function (next) {
  this.set({ updatedAt: new Date() })
  next()
})

// 创建 Mongoose 模型实例
const SettingsModel = mongoose.model('Settings', SettingsSchema)

// 导出模型供其他模块使用
module.exports = SettingsModel
