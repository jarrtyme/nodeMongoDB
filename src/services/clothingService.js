const ClothingModel = require('../models/clothingModel.js')

// 创建服装记录
const create = async (data) => {
  try {
    const savedDoc = await ClothingModel.create(data)
    return savedDoc
  } catch (error) {
    console.error('Error creating clothing item:', error)
    throw error
  }
}

// 查询服装列表（支持分页和条件查询）
const find = async (query, page = 1, limit = 10) => {
  try {
    const skip = (page - 1) * limit
    const docs = await ClothingModel.find(query)
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 }) // 按创建时间倒序
    return docs
  } catch (error) {
    console.error('Error finding clothing items:', error)
    throw new Error('Error finding clothing items')
  }
}

// 根据ID查询单个服装
const findById = async (id) => {
  try {
    const doc = await ClothingModel.findById(id)
    return doc
  } catch (error) {
    console.error('Error finding clothing item by ID:', error)
    throw new Error('Error finding clothing item by ID')
  }
}

// 更新服装信息
const update = async (clothingId, updateFields) => {
  try {
    const updatedClothing = await ClothingModel.findByIdAndUpdate(
      clothingId,
      { $set: updateFields },
      { new: true, runValidators: true }
    )
    return updatedClothing
  } catch (error) {
    throw new Error('Error updating clothing item: ' + error.message)
  }
}

// 删除服装记录
const remove = async (id) => {
  try {
    const deletedDoc = await ClothingModel.findByIdAndDelete(id)
    return deletedDoc
  } catch (error) {
    console.error('Error deleting clothing item:', error)
    throw error
  }
}

// 补货功能
const restock = async (id, quantity) => {
  try {
    const clothing = await ClothingModel.findById(id)
    if (!clothing) {
      throw new Error('Clothing item not found')
    }
    
    // 更新补货数量和剩余数量
    const updatedClothing = await ClothingModel.findByIdAndUpdate(
      id,
      { 
        $inc: { 
          restockQuantity: quantity,
          remainingQuantity: quantity 
        }
      },
      { new: true, runValidators: true }
    )
    
    return updatedClothing
  } catch (error) {
    console.error('Error restocking clothing item:', error)
    throw new Error('Error restocking clothing item: ' + error.message)
  }
}

// 获取库存统计
const getInventoryStats = async () => {
  try {
    const stats = await ClothingModel.aggregate([
      {
        $group: {
          _id: null,
          totalItems: { $sum: 1 },
          totalPurchaseQuantity: { $sum: '$purchaseQuantity' },
          totalRemainingQuantity: { $sum: '$remainingQuantity' },
          totalSoldQuantity: { $sum: '$soldQuantity' },
          totalProfit: { $sum: '$profit' },
          totalRevenue: { $sum: { $multiply: ['$sellingPrice', '$soldQuantity'] } },
          totalCost: { $sum: { $multiply: ['$purchasePrice', { $add: ['$purchaseQuantity', '$restockQuantity'] }] } }
        }
      }
    ])
    
    return stats[0] || {
      totalItems: 0,
      totalPurchaseQuantity: 0,
      totalRemainingQuantity: 0,
      totalSoldQuantity: 0,
      totalProfit: 0,
      totalRevenue: 0,
      totalCost: 0
    }
  } catch (error) {
    console.error('Error getting inventory stats:', error)
    throw new Error('Error getting inventory stats')
  }
}

module.exports = {
  create,
  find,
  findById,
  update,
  remove,
  restock,
  getInventoryStats
}

