const express = require('express')
const router = express.Router()
const MenuPermissionService = require('../services/menuPermissionService')
const {
  authenticateToken,
  refreshTokenIfNeeded,
  requireAdmin
} = require('../middlewares/authMiddleware')

/**
 * 获取当前用户的菜单权限
 * POST /menu-permission/my
 */
router.post('/my', authenticateToken, refreshTokenIfNeeded, async (req, res) => {
  try {
    const user = req.user
    const menuPermissions = MenuPermissionService.getUserMenuPermissions(user)

    res.success({ menuPermissions }, '获取菜单权限成功')
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
      const { menuPermissions } = req.body

      if (!Array.isArray(menuPermissions)) {
        return res.error('menuPermissions必须是数组', 400)
      }

      const user = await MenuPermissionService.updateUserMenuPermissions(userId, menuPermissions)

      res.success({ user }, '更新菜单权限成功')
    } catch (error) {
      console.error('更新菜单权限失败:', error)
      res.error(error.message || '更新菜单权限失败', 400)
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
