const express = require('express')
const router = express.Router()

const MediaService = require('../services/mediaService')
const { authenticateToken, refreshTokenIfNeeded } = require('../middlewares/authMiddleware')
const { addFileUrl } = require('../utils/fileUrl')
const { normalizeUrlForStorage } = require('../utils/urlUtils')

// 所有媒体库路由都需要鉴权，并支持无感刷新 token
router.use(authenticateToken)
router.use(refreshTokenIfNeeded)

// 创建媒体记录（上传后创建）
router.post('/create', async (req, res) => {
  try {
    const { type, url, filename, size, mimetype, descriptions = [] } = req.body

    if (!type || !url) {
      return res.error('Type and URL are required', 400)
    }

    if (!['image', 'video'].includes(type)) {
      return res.error('Type must be "image" or "video"', 400)
    }

    const normalizedUrl = normalizeUrlForStorage(url)

    const mediaData = {
      type,
      url: normalizedUrl, // 使用标准化后的 URL 存储
      filename: filename || '',
      size: size || 0,
      mimetype: mimetype || '',
      descriptions: descriptions.map((text) => ({ text }))
    }

    // 检查是否已存在（使用标准化后的 URL 检查）
    const existingMedia = await MediaService.findByUrl(normalizedUrl)
    if (existingMedia) {
      // 如果已存在，返回已存在的记录
      const mediaWithUrl = addFileUrl(existingMedia, req)
      return res.success(mediaWithUrl, 'Media item already exists in library')
    }

    const newMedia = await MediaService.create(mediaData)

    // 添加完整URL
    const mediaWithUrl = addFileUrl(newMedia, req)

    res.success(mediaWithUrl, 'Media item created successfully')
  } catch (error) {
    console.error('Error creating media item:', error)
    // 如果是重复键错误，返回更友好的错误信息
    if (error.code === 11000 || error.message.includes('duplicate')) {
      return res.error('This media item already exists in the library', 409)
    }
    res.error('Failed to create media item: ' + error.message, 500)
  }
})

// 查询媒体列表（支持分页和条件查询）
router.post('/list', async (req, res) => {
  try {
    const { page = 1, limit = 10, type, description, ...query } = req.body

    // 构建查询条件
    const searchQuery = { ...query }
    if (type) {
      searchQuery.type = type
    }

    // 如果提供了描述搜索关键词，使用 $elemMatch 进行模糊搜索
    if (description && description.trim()) {
      searchQuery['descriptions.text'] = {
        $regex: description.trim(),
        $options: 'i' // 不区分大小写
      }
    }

    const mediaItems = await MediaService.find(searchQuery, page, limit)
    const total = await MediaService.count(searchQuery)

    // 为每个媒体添加完整URL
    const mediaWithUrls = addFileUrl(mediaItems, req)

    res.success(
      {
        list: mediaWithUrls,
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / limit)
      },
      'Media items retrieved successfully'
    )
  } catch (error) {
    console.error('Error finding media items:', error)
    res.error('Error finding media items', 500)
  }
})

// 根据ID查询单个媒体
router.post('/findById', async (req, res) => {
  try {
    const { id } = req.body
    if (!id) {
      return res.error('ID is required', 400)
    }

    const mediaItem = await MediaService.findById(id)
    if (!mediaItem) {
      return res.error('Media item not found', 404)
    }

    // 添加完整URL
    const mediaWithUrl = addFileUrl(mediaItem, req)

    res.success(mediaWithUrl, 'Media item retrieved successfully')
  } catch (error) {
    console.error('Error finding media item by ID:', error)
    res.error('Error finding media item by ID', 500)
  }
})

// 更新媒体信息
router.post('/update', async (req, res) => {
  try {
    const { id, ...updateFields } = req.body
    if (!id) {
      return res.error('ID is required', 400)
    }

    const updatedMedia = await MediaService.update(id, updateFields)
    if (!updatedMedia) {
      return res.error('Media item not found', 404)
    }

    // 添加完整URL
    const mediaWithUrl = addFileUrl(updatedMedia, req)

    res.success(mediaWithUrl, 'Media item updated successfully')
  } catch (error) {
    console.error('Error updating media item:', error)
    res.error('Failed to update media item', 500)
  }
})

// 删除媒体记录（支持单个和批量删除）
router.post('/remove', async (req, res) => {
  try {
    const { id, ids } = req.body

    // 批量删除模式
    if (ids && Array.isArray(ids) && ids.length > 0) {
      const results = []
      const errors = []

      for (let i = 0; i < ids.length; i++) {
        try {
          const mediaId = ids[i]
          const deletedMedia = await MediaService.remove(mediaId)
          if (deletedMedia) {
            results.push({
              id: mediaId,
              success: true
            })
          } else {
            errors.push({
              id: mediaId,
              error: 'Media item not found'
            })
          }
        } catch (error) {
          errors.push({
            id: ids[i],
            error: error.message
          })
        }
      }

      return res.json({
        code: errors.length === 0 ? 200 : 207, // 207 = Multi-Status
        message: `批量删除完成：成功 ${results.length} 个，失败 ${errors.length} 个`,
        data: {
          success: results,
          failed: errors,
          total: ids.length,
          successCount: results.length,
          failCount: errors.length
        }
      })
    }

    // 单个删除模式（保持向后兼容）
    if (!id) {
      return res.error('ID is required', 400)
    }

    const deletedMedia = await MediaService.remove(id)
    if (!deletedMedia) {
      return res.error('Media item not found', 404)
    }

    res.success(deletedMedia, 'Media item deleted successfully')
  } catch (error) {
    console.error('Error deleting media item:', error)
    res.error('Failed to delete media item', 500)
  }
})

// 添加描述
router.post('/addDescription', async (req, res) => {
  try {
    const { id, text } = req.body
    if (!id) {
      return res.error('ID is required', 400)
    }
    if (!text || !text.trim()) {
      return res.error('Description text is required', 400)
    }

    const updatedMedia = await MediaService.addDescription(id, text.trim())

    // 添加完整URL
    const mediaWithUrl = addFileUrl(updatedMedia, req)

    res.success(mediaWithUrl, 'Description added successfully')
  } catch (error) {
    console.error('Error adding description:', error)
    res.error('Failed to add description', 500)
  }
})

// 删除描述
router.post('/removeDescription', async (req, res) => {
  try {
    const { id, descriptionId } = req.body
    if (!id) {
      return res.error('Media ID is required', 400)
    }
    if (!descriptionId) {
      return res.error('Description ID is required', 400)
    }

    const updatedMedia = await MediaService.removeDescription(id, descriptionId)

    // 添加完整URL
    const mediaWithUrl = addFileUrl(updatedMedia, req)

    res.success(mediaWithUrl, 'Description removed successfully')
  } catch (error) {
    console.error('Error removing description:', error)
    res.error('Failed to remove description', 500)
  }
})

// 更新描述
router.post('/updateDescription', async (req, res) => {
  try {
    const { id, descriptionId, text } = req.body
    if (!id) {
      return res.error('Media ID is required', 400)
    }
    if (!descriptionId) {
      return res.error('Description ID is required', 400)
    }
    if (!text || !text.trim()) {
      return res.error('Description text is required', 400)
    }

    const updatedMedia = await MediaService.updateDescription(id, descriptionId, text.trim())

    // 添加完整URL
    const mediaWithUrl = addFileUrl(updatedMedia, req)

    res.success(mediaWithUrl, 'Description updated successfully')
  } catch (error) {
    console.error('Error updating description:', error)
    res.error('Failed to update description', 500)
  }
})

module.exports = router
