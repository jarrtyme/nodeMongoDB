const MediaModel = require('../models/mediaModel.js')

// 创建媒体记录
const create = async (data) => {
  try {
    const savedDoc = await MediaModel.create(data)
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

// 删除媒体记录
const remove = async (id) => {
  try {
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
  update,
  remove,
  addDescription,
  removeDescription,
  updateDescription
}
