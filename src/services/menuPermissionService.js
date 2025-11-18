const UserModel = require('../models/userModel')

/**
 * 菜单权限服务
 * 处理菜单权限的获取和分配逻辑
 */
class MenuPermissionService {
  // 定义所有菜单项及其key
  static MENU_KEYS = {
    DASHBOARD: 'dashboard',
    MANAGEMENT: 'management',
    USERS: 'users',
    CLOTHING: 'clothing',
    PAGE_COMPONENTS: 'page-components',
    PAGES: 'pages',
    TOOLS: 'tools',
    UPLOAD: 'upload',
    SETTINGS: 'settings'
  }

  // 定义默认菜单权限配置（根据角色）
  static DEFAULT_PERMISSIONS = {
    super_admin: [
      'dashboard',
      'management',
      'users',
      'clothing',
      'page-components',
      'pages',
      'tools',
      'upload',
      'settings'
    ],
    admin: [
      'dashboard',
      'management',
      'users',
      'clothing',
      'page-components',
      'pages',
      'tools',
      'upload'
      // 注意：admin 默认不包含 settings
    ],
    vip: [], // VIP用户权限根据VIP等级和menuPermissions字段动态分配
    user: ['dashboard'] // 普通用户只有仪表盘
  }

  // VIP等级对应的菜单权限配置
  static VIP_LEVEL_PERMISSIONS = {
    1: ['dashboard', 'clothing', 'upload'], // VIP1: 基础功能
    2: ['dashboard', 'clothing', 'page-components', 'upload'], // VIP2: 增加组件管理
    3: ['dashboard', 'management', 'clothing', 'page-components', 'pages', 'upload'], // VIP3: 增加页面管理
    4: ['dashboard', 'management', 'clothing', 'page-components', 'pages', 'tools', 'upload'], // VIP4: 增加工具菜单
    5: [
      'dashboard',
      'management',
      'clothing',
      'page-components',
      'pages',
      'tools',
      'upload',
      'settings'
    ] // VIP5及以上: 包含所有菜单（除用户管理）
  }

  /**
   * 获取用户的菜单权限
   * @param {Object} user - 用户对象
   * @returns {Array<string>} - 菜单权限列表
   */
  static getUserMenuPermissions(user) {
    const role = user.role || 'user'
    const vipLevel = user.vipLevel || 0
    const customPermissions = user.menuPermissions || []

    // 超级管理员：所有权限
    if (role === 'super_admin') {
      return this.DEFAULT_PERMISSIONS.super_admin
    }

    // 管理员：默认权限
    if (role === 'admin') {
      return this.DEFAULT_PERMISSIONS.admin
    }

    // VIP用户：根据VIP等级和自定义权限
    if (role === 'vip') {
      // 如果用户有自定义权限，优先使用自定义权限
      if (customPermissions && customPermissions.length > 0) {
        return customPermissions
      }

      // 否则根据VIP等级获取默认权限
      if (vipLevel >= 5) {
        return this.VIP_LEVEL_PERMISSIONS[5]
      } else if (vipLevel >= 4) {
        return this.VIP_LEVEL_PERMISSIONS[4]
      } else if (vipLevel >= 3) {
        return this.VIP_LEVEL_PERMISSIONS[3]
      } else if (vipLevel >= 2) {
        return this.VIP_LEVEL_PERMISSIONS[2]
      } else if (vipLevel >= 1) {
        return this.VIP_LEVEL_PERMISSIONS[1]
      }

      // 如果没有VIP等级，返回基础权限
      return ['dashboard']
    }

    // 普通用户：只有仪表盘
    return this.DEFAULT_PERMISSIONS.user
  }

  /**
   * 更新用户的菜单权限
   * @param {string} userId - 用户ID
   * @param {Array<string>} menuPermissions - 菜单权限列表
   * @returns {Promise<Object>} - 更新后的用户信息
   */
  static async updateUserMenuPermissions(userId, menuPermissions) {
    try {
      const user = await UserModel.findByIdAndUpdate(
        userId,
        { menuPermissions },
        { new: true, runValidators: true }
      )

      if (!user) {
        throw new Error('用户不存在')
      }

      return user.getPublicProfile()
    } catch (error) {
      console.error('更新用户菜单权限失败:', error)
      throw error
    }
  }

  /**
   * 更新用户的VIP等级
   * @param {string} userId - 用户ID
   * @param {number} vipLevel - VIP等级
   * @returns {Promise<Object>} - 更新后的用户信息
   */
  static async updateUserVipLevel(userId, vipLevel) {
    try {
      if (vipLevel < 0 || vipLevel > 10) {
        throw new Error('VIP等级必须在0-10之间')
      }

      const user = await UserModel.findByIdAndUpdate(
        userId,
        { vipLevel, role: vipLevel > 0 ? 'vip' : 'user' },
        { new: true, runValidators: true }
      )

      if (!user) {
        throw new Error('用户不存在')
      }

      return user.getPublicProfile()
    } catch (error) {
      console.error('更新用户VIP等级失败:', error)
      throw error
    }
  }

  /**
   * 获取所有可用的菜单项配置
   * @returns {Array<Object>} - 菜单项配置列表
   */
  static getAllMenuItems() {
    return [
      {
        key: 'dashboard',
        label: '仪表盘',
        path: '/admin/dashboard',
        description: '系统概览和统计信息'
      },
      {
        key: 'management',
        label: '管理',
        path: '/admin',
        description: '系统管理功能',
        children: [
          {
            key: 'users',
            label: '用户管理',
            path: '/admin/users',
            description: '管理系统用户和权限'
          },
          {
            key: 'clothing',
            label: '服装管理',
            path: '/admin/clothing',
            description: '管理服装信息和库存'
          },
          {
            key: 'page-components',
            label: '组件管理',
            path: '/admin/page-components',
            description: '管理页面组件，包含媒体和描述'
          },
          {
            key: 'pages',
            label: '页面管理',
            path: '/admin/pages',
            description: '管理页面配置，组合多个组件'
          }
        ]
      },
      {
        key: 'tools',
        label: '工具',
        path: '/admin',
        description: '系统工具',
        children: [
          {
            key: 'upload',
            label: '文件管理',
            path: '/admin/upload',
            description: '上传和管理文件，支持媒体库描述管理'
          }
        ]
      },
      {
        key: 'settings',
        label: '设置',
        path: '/admin/settings',
        description: '系统设置'
      }
    ]
  }
}

module.exports = MenuPermissionService
