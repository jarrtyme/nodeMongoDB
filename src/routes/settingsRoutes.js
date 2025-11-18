const express = require('express')
const router = express.Router()

const SettingsService = require('../services/settingsService')
const { authenticateToken, refreshTokenIfNeeded } = require('../middlewares/authMiddleware')

// 所有设置路由都需要鉴权，并支持无感刷新 token
router.use(authenticateToken)
router.use(refreshTokenIfNeeded)

// 获取基本设置
router.post('/getBasic', async (req, res) => {
  try {
    const basicSettings = await SettingsService.getBasicSettings()
    res.success(basicSettings, 'Basic settings retrieved successfully')
  } catch (error) {
    console.error('Error getting basic settings:', error)
    res.error('Error getting basic settings', 500)
  }
})

// 更新基本设置
router.post('/updateBasic', async (req, res) => {
  try {
    const updatedSettings = await SettingsService.updateBasicSettings(req.body)
    res.success(updatedSettings, 'Basic settings updated successfully')
  } catch (error) {
    console.error('Error updating basic settings:', error)
    res.error('Failed to update basic settings', 500)
  }
})

// 获取安全设置
router.post('/getSecurity', async (req, res) => {
  try {
    const securitySettings = await SettingsService.getSecuritySettings()
    res.success(securitySettings, 'Security settings retrieved successfully')
  } catch (error) {
    console.error('Error getting security settings:', error)
    res.error('Error getting security settings', 500)
  }
})

// 更新安全设置
router.post('/updateSecurity', async (req, res) => {
  try {
    const updatedSettings = await SettingsService.updateSecuritySettings(req.body)
    res.success(updatedSettings, 'Security settings updated successfully')
  } catch (error) {
    console.error('Error updating security settings:', error)
    res.error('Failed to update security settings', 500)
  }
})

// 获取通知设置
router.post('/getNotification', async (req, res) => {
  try {
    const notificationSettings = await SettingsService.getNotificationSettings()
    res.success(notificationSettings, 'Notification settings retrieved successfully')
  } catch (error) {
    console.error('Error getting notification settings:', error)
    res.error('Error getting notification settings', 500)
  }
})

// 更新通知设置
router.post('/updateNotification', async (req, res) => {
  try {
    const updatedSettings = await SettingsService.updateNotificationSettings(req.body)
    res.success(updatedSettings, 'Notification settings updated successfully')
  } catch (error) {
    console.error('Error updating notification settings:', error)
    res.error('Failed to update notification settings', 500)
  }
})

// 获取所有设置
router.post('/getAll', async (req, res) => {
  try {
    const allSettings = await SettingsService.getAllSettings()
    res.success(allSettings, 'All settings retrieved successfully')
  } catch (error) {
    console.error('Error getting all settings:', error)
    res.error('Error getting all settings', 500)
  }
})

module.exports = router
