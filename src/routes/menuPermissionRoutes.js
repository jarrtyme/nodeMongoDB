const express = require('express')
const router = express.Router()
const MenuPermissionService = require('../services/menuPermissionService')
const {
  authenticateToken,
  refreshTokenIfNeeded,
  requireAdmin,
  requireSuperAdmin
} = require('../middlewares/authMiddleware')

/**
 * 获取当前用户的菜单权限
 * POST /menu-permission/my
 */
router.post('/my', authenticateToken, refreshTokenIfNeeded, async (req, res) => {
  try {
    const user = req.user
    const menuPermissions = MenuPermissionService.getUserMenuPermissions(user)
    const menuPermissionMode = user.menuPermissionMode || 'default'

    res.success({ menuPermissions, menuPermissionMode }, '获取菜单权限成功')
  } catch (error) {
    console.error('获取菜单权限失败:', error)
    res.error(error.message || '获取菜单权限失败', 500)
  }
})

/**
 * 获取所有菜单项配置
 * POST /menu-permission/menus
 */
router.post('/menus', authenticateToken, refreshTokenIfNeeded, async (req, res) => {
  try {
    const menuItems = MenuPermissionService.getAllMenuItems()
    res.success({ menuItems }, '获取菜单配置成功')
  } catch (error) {
    console.error('获取菜单配置失败:', error)
    res.error(error.message || '获取菜单配置失败', 500)
  }
})

/**
 * 获取指定用户的菜单权限（管理员）
 * POST /menu-permission/user/:userId/get
 */
router.post(
  '/user/:userId/get',
  authenticateToken,
  refreshTokenIfNeeded,
  requireAdmin,
  async (req, res) => {
    try {
      const { userId } = req.params
      const data = await MenuPermissionService.getUserMenuConfig(userId)
      res.success(data, '获取用户菜单权限成功')
    } catch (error) {
      console.error('获取用户菜单权限失败:', error)
      res.error(error.message || '获取用户菜单权限失败', 400)
    }
  }
)

/**
 * 更新用户的菜单权限（仅管理员）
 * POST /menu-permission/user/:userId
 */
router.post(
  '/user/:userId',
  authenticateToken,
  refreshTokenIfNeeded,
  requireAdmin,
  async (req, res) => {
    try {
      const { userId } = req.params
      const { menuPermissions, mode } = req.body

      const allowedModes = ['default', 'custom', 'template']
      const menuPermissionMode = allowedModes.includes(mode) ? mode : undefined

      if (menuPermissions && !Array.isArray(menuPermissions)) {
        return res.error('menuPermissions必须是数组', 400)
      }

      const user = await MenuPermissionService.updateUserMenuPermissions(
        userId,
        menuPermissions,
        menuPermissionMode
      )

      res.success({ user }, '更新菜单权限成功')
    } catch (error) {
      console.error('更新菜单权限失败:', error)
      res.error(error.message || '更新菜单权限失败', 400)
    }
  }
)

/**
 * 创建菜单模板（管理员）
 * POST /menu-permission/template/create
 */
router.post(
  '/template/create',
  authenticateToken,
  refreshTokenIfNeeded,
  requireAdmin,
  async (req, res) => {
    try {
      const { name, description, menuPermissions } = req.body
      const template = await MenuPermissionService.createTemplate(
        {
          name,
          description,
          menuPermissions
        },
        req.user._id
      )
      res.success({ template }, '创建模板成功')
    } catch (error) {
      console.error('创建菜单模板失败:', error)
      res.error(error.message || '创建菜单模板失败', 400)
    }
  }
)

/**
 * 获取模板列表（管理员）
 * POST /menu-permission/template/list
 */
router.post(
  '/template/list',
  authenticateToken,
  refreshTokenIfNeeded,
  requireAdmin,
  async (req, res) => {
    try {
      const templates = await MenuPermissionService.getTemplates()
      res.success({ templates }, '获取模板列表成功')
    } catch (error) {
      console.error('获取模板列表失败:', error)
      res.error(error.message || '获取模板列表失败', 500)
    }
  }
)

/**
 * 更新模板（管理员）
 * POST /menu-permission/template/:templateId/update
 */
router.post(
  '/template/:templateId/update',
  authenticateToken,
  refreshTokenIfNeeded,
  requireAdmin,
  async (req, res) => {
    try {
      const { templateId } = req.params
      const template = await MenuPermissionService.updateTemplate(
        templateId,
        req.body,
        req.user._id
      )
      res.success({ template }, '更新模板成功')
    } catch (error) {
      console.error('更新模板失败:', error)
      res.error(error.message || '更新模板失败', 400)
    }
  }
)

/**
 * 删除模板（仅超级管理员）
 * POST /menu-permission/template/:templateId/delete
 */
router.post(
  '/template/:templateId/delete',
  authenticateToken,
  refreshTokenIfNeeded,
  requireSuperAdmin,
  async (req, res) => {
    try {
      const { templateId } = req.params
      await MenuPermissionService.deleteTemplate(templateId)
      res.success(null, '删除模板成功')
    } catch (error) {
      console.error('删除模板失败:', error)
      res.error(error.message || '删除模板失败', 400)
    }
  }
)

/**
 * 应用模板到多个用户（管理员）
 * POST /menu-permission/template/:templateId/apply
 */
router.post(
  '/template/:templateId/apply',
  authenticateToken,
  refreshTokenIfNeeded,
  requireAdmin,
  async (req, res) => {
    try {
      const { templateId } = req.params
      const { userIds } = req.body
      if (!Array.isArray(userIds) || userIds.length === 0) {
        return res.error('userIds必须是非空数组', 400)
      }
      const result = await MenuPermissionService.applyTemplateToUsers(templateId, userIds)
      res.success(result, '模板应用成功')
    } catch (error) {
      console.error('应用模板失败:', error)
      res.error(error.message || '应用模板失败', 400)
    }
  }
)

/**
 * 更新用户的VIP等级（仅管理员）
 * POST /menu-permission/user/:userId/vip-level
 */
router.post(
  '/user/:userId/vip-level',
  authenticateToken,
  refreshTokenIfNeeded,
  requireAdmin,
  async (req, res) => {
    try {
      const { userId } = req.params
      const { vipLevel } = req.body

      if (typeof vipLevel !== 'number' || vipLevel < 0 || vipLevel > 10) {
        return res.error('VIP等级必须是0-10之间的数字', 400)
      }

      const user = await MenuPermissionService.updateUserVipLevel(userId, vipLevel)

      res.success({ user }, '更新VIP等级成功')
    } catch (error) {
      console.error('更新VIP等级失败:', error)
      res.error(error.message || '更新VIP等级失败', 400)
    }
  }
)

module.exports = router
