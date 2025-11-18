const SettingsModel = require('../models/settingsModel.js')

/**
 * 获取或创建设置（单例模式）
 * 如果不存在则创建默认设置
 */
const getOrCreateSettings = async () => {
  try {
    let settings = await SettingsModel.findOne()
    if (!settings) {
      settings = await SettingsModel.create({})
    }
    return settings
  } catch (error) {
    console.error('Error getting or creating settings:', error)
    throw error
  }
}

/**
 * 获取基本设置
 */
const getBasicSettings = async () => {
  try {
    const settings = await getOrCreateSettings()
    return settings.basic
  } catch (error) {
    console.error('Error getting basic settings:', error)
    throw new Error('Error getting basic settings')
  }
}

/**
 * 更新基本设置
 */
const updateBasicSettings = async (data) => {
  try {
    const settings = await getOrCreateSettings()
    settings.basic = {
      ...settings.basic,
      ...data
    }
    await settings.save()
    return settings.basic
  } catch (error) {
    console.error('Error updating basic settings:', error)
    throw new Error('Error updating basic settings: ' + error.message)
  }
}

/**
 * 获取安全设置
 */
const getSecuritySettings = async () => {
  try {
    const settings = await getOrCreateSettings()
    return settings.security
  } catch (error) {
    console.error('Error getting security settings:', error)
    throw new Error('Error getting security settings')
  }
}

/**
 * 更新安全设置
 */
const updateSecuritySettings = async (data) => {
  try {
    const settings = await getOrCreateSettings()
    settings.security = {
      ...settings.security,
      ...data
    }
    await settings.save()
    return settings.security
  } catch (error) {
    console.error('Error updating security settings:', error)
    throw new Error('Error updating security settings: ' + error.message)
  }
}

/**
 * 获取通知设置
 */
const getNotificationSettings = async () => {
  try {
    const settings = await getOrCreateSettings()
    return settings.notification
  } catch (error) {
    console.error('Error getting notification settings:', error)
    throw new Error('Error getting notification settings')
  }
}

/**
 * 更新通知设置
 */
const updateNotificationSettings = async (data) => {
  try {
    const settings = await getOrCreateSettings()
    settings.notification = {
      ...settings.notification,
      ...data
    }
    await settings.save()
    return settings.notification
  } catch (error) {
    console.error('Error updating notification settings:', error)
    throw new Error('Error updating notification settings: ' + error.message)
  }
}

/**
 * 获取所有设置
 */
const getAllSettings = async () => {
  try {
    const settings = await getOrCreateSettings()
    return {
      basic: settings.basic,
      security: settings.security,
      notification: settings.notification
    }
  } catch (error) {
    console.error('Error getting all settings:', error)
    throw new Error('Error getting all settings')
  }
}

module.exports = {
  getBasicSettings,
  updateBasicSettings,
  getSecuritySettings,
  updateSecuritySettings,
  getNotificationSettings,
  updateNotificationSettings,
  getAllSettings
}
