const MediaModel = require('../models/mediaModel.js')
const fs = require('fs')
const path = require('path')
const { normalizeUrl, cleanFilePath } = require('../utils/urlUtils')
const { safeDeleteFile } = require('../utils/pathValidator')

// 根据URL查找媒体记录（支持多种URL格式匹配）
const findByUrl = async (url) => {
  try {
    if (!url) return null

    const normalizedUrl = normalizeUrl(url)
    const normalizedWithSlash = normalizedUrl.startsWith('/') ? normalizedUrl : '/' + normalizedUrl
    const normalizedWithoutSlash = normalizedUrl.startsWith('/')
      ? normalizedUrl.substring(1)
      : normalizedUrl

    // 尝试多种URL格式匹配
    const doc = await MediaModel.findOne({
      $or: [
        { url: url },
        { url: normalizedUrl },
        { url: normalizedWithSlash },
        { url: normalizedWithoutSlash },
        { url: { $regex: normalizedUrl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), $options: 'i' } }
      ]
    })
    return doc
  } catch (error) {
    console.error('Error finding media by URL:', error)
    return null
  }
}

// 创建媒体记录（如果URL已存在则返回已存在的记录）
const create = async (data) => {
  try {
    // 先检查URL是否已存在
    const existingMedia = await findByUrl(data.url)
    if (existingMedia) {
      // 如果已存在，更新信息（保留原有描述，除非提供了新描述）
      if (data.filename && existingMedia.filename !== data.filename) {
        existingMedia.filename = data.filename
      }
      if (data.size && existingMedia.size !== data.size) {
        existingMedia.size = data.size
      }
      if (data.mimetype && existingMedia.mimetype !== data.mimetype) {
        existingMedia.mimetype = data.mimetype
      }
      // 确保标记为已添加到媒体库
      existingMedia.isAddedToLibrary = true
      await existingMedia.save()
      return existingMedia
    }

    // 如果不存在，创建新记录
    const savedDoc = await MediaModel.create({
      ...data,
      isAddedToLibrary: true
    })
    return savedDoc
  } catch (error) {
    console.error('Error creating media item:', error)
    throw error
  }
}

// 查询媒体列表（支持分页和条件查询）
const find = async (query = {}, page = 1, limit = 10) => {
  try {
    const skip = (page - 1) * limit
    const docs = await MediaModel.find(query).skip(skip).limit(limit).sort({ createdAt: -1 }) // 按创建时间倒序
    return docs
  } catch (error) {
    console.error('Error finding media items:', error)
    throw new Error('Error finding media items')
  }
}

// 获取总数
const count = async (query = {}) => {
  try {
    return await MediaModel.countDocuments(query)
  } catch (error) {
    console.error('Error counting media items:', error)
    throw new Error('Error counting media items')
  }
}

// 根据ID查询单个媒体
const findById = async (id) => {
  try {
    const doc = await MediaModel.findById(id)
    return doc
  } catch (error) {
    console.error('Error finding media item by ID:', error)
    throw new Error('Error finding media item by ID')
  }
}

// 更新媒体信息
const update = async (mediaId, updateFields) => {
  try {
    const updatedMedia = await MediaModel.findByIdAndUpdate(
      mediaId,
      { $set: updateFields },
      { new: true, runValidators: true }
    )
    return updatedMedia
  } catch (error) {
    throw new Error('Error updating media item: ' + error.message)
  }
}

// 删除媒体记录（同时删除文件）
const remove = async (id) => {
  try {
    // 先查找媒体记录，获取文件路径
    const media = await MediaModel.findById(id)
    if (!media) {
      return null
    }

    // 删除文件
    if (media.url) {
      try {
        // 从URL中提取文件路径
        let filePath = media.url
        // 如果是完整URL，提取路径部分
        if (filePath.startsWith('http://') || filePath.startsWith('https://')) {
          try {
            const url = new URL(filePath)
            filePath = url.pathname
          } catch {
            // 如果不是有效URL，尝试直接提取路径
            filePath = filePath.replace(/^https?:\/\/[^/]+/, '')
          }
        }

        // 清理路径：移除 /api 前缀和查询参数
        const cleanPath = cleanFilePath(filePath)

        // 使用工具函数安全删除文件
        const deleteResult = safeDeleteFile(cleanPath, path.join(__dirname, '../public'), {
          requireUploadsPrefix: true,
          requireCategory: false
        })

        if (deleteResult.success) {
          console.log(`文件已删除: ${deleteResult.path}`)
        } else {
          console.warn(`删除文件失败: ${deleteResult.error}`)
        }
      } catch (fileError) {
        // 文件删除失败不影响记录删除，只记录错误
        console.error('删除文件失败:', fileError)
      }
    }

    // 删除数据库记录
    const deletedDoc = await MediaModel.findByIdAndDelete(id)
    return deletedDoc
  } catch (error) {
    console.error('Error deleting media item:', error)
    throw error
  }
}

// 添加描述
const addDescription = async (mediaId, descriptionText) => {
  try {
    const media = await MediaModel.findById(mediaId)
    if (!media) {
      throw new Error('Media item not found')
    }

    // 添加新描述到数组
    media.descriptions.push({
      text: descriptionText,
      createdAt: new Date()
    })

    await media.save()
    return media
  } catch (error) {
    console.error('Error adding description:', error)
    throw new Error('Error adding description: ' + error.message)
  }
}

// 删除描述
const removeDescription = async (mediaId, descriptionId) => {
  try {
    const media = await MediaModel.findById(mediaId)
    if (!media) {
      throw new Error('Media item not found')
    }

    // 从数组中删除指定描述
    media.descriptions = media.descriptions.filter((desc) => desc._id.toString() !== descriptionId)

    await media.save()
    return media
  } catch (error) {
    console.error('Error removing description:', error)
    throw new Error('Error removing description: ' + error.message)
  }
}

// 更新描述
const updateDescription = async (mediaId, descriptionId, newText) => {
  try {
    const media = await MediaModel.findById(mediaId)
    if (!media) {
      throw new Error('Media item not found')
    }

    // 更新指定描述
    const description = media.descriptions.id(descriptionId)
    if (!description) {
      throw new Error('Description not found')
    }

    description.text = newText
    await media.save()
    return media
  } catch (error) {
    console.error('Error updating description:', error)
    throw new Error('Error updating description: ' + error.message)
  }
}

module.exports = {
  create,
  find,
  count,
  findById,
  findByUrl,
  update,
  remove,
  addDescription,
  removeDescription,
  updateDescription
}
