const express = require('express')
const router = express.Router()

const ClothingService = require('../services/clothingService')
const { authenticateToken } = require('../middlewares/authMiddleware')

// 所有服装管理路由都需要鉴权
router.use(authenticateToken)

// 创建服装入库记录
router.post('/create', async (req, res) => {
  try {
    const newClothing = await ClothingService.create(req.body)
    res.success(newClothing, 'Clothing item created successfully')
  } catch (error) {
    console.error('Error creating clothing item:', error)
    if (error.code === 11000) {
      res.error('Item number already exists', 400)
    } else {
      res.error('Failed to create clothing item', 500)
    }
  }
})

// 查询服装列表（支持分页和条件查询）
router.post('/find', async (req, res) => {
  const { page = 1, limit = 10, ...query } = req.body
  try {
    const clothingItems = await ClothingService.find(query, page, limit)
    res.success(clothingItems, 'Clothing items retrieved successfully')
  } catch (error) {
    console.error('Error finding clothing items:', error)
    res.error('Error finding clothing items', 500)
  }
})

// 根据ID查询单个服装
router.post('/findById', async (req, res) => {
  try {
    const { id } = req.body
    if (!id) {
      return res.error('ID is required', 400)
    }
    
    const clothingItem = await ClothingService.findById(id)
    if (!clothingItem) {
      return res.error('Clothing item not found', 404)
    }
    
    res.success(clothingItem, 'Clothing item retrieved successfully')
  } catch (error) {
    console.error('Error finding clothing item by ID:', error)
    res.error('Error finding clothing item by ID', 500)
  }
})

// 更新服装信息
router.post('/update', async (req, res) => {
  try {
    const { id, ...updateFields } = req.body
    if (!id) {
      return res.error('ID is required', 400)
    }
    
    const updatedClothing = await ClothingService.update(id, updateFields)
    if (!updatedClothing) {
      return res.error('Clothing item not found', 404)
    }
    
    res.success(updatedClothing, 'Clothing item updated successfully')
  } catch (error) {
    console.error('Error updating clothing item:', error)
    res.error('Failed to update clothing item', 500)
  }
})

// 删除服装记录
router.post('/remove', async (req, res) => {
  try {
    const { id } = req.body
    if (!id) {
      return res.error('ID is required', 400)
    }
    
    const deletedClothing = await ClothingService.remove(id)
    if (!deletedClothing) {
      return res.error('Clothing item not found', 404)
    }
    
    res.success(deletedClothing, 'Clothing item deleted successfully')
  } catch (error) {
    console.error('Error deleting clothing item:', error)
    res.error('Failed to delete clothing item', 500)
  }
})

// 补货操作
router.post('/restock', async (req, res) => {
  try {
    const { id, quantity } = req.body
    if (!id) {
      return res.error('ID is required', 400)
    }
    if (!quantity || quantity <= 0) {
      return res.error('Valid quantity is required', 400)
    }
    
    const restockedClothing = await ClothingService.restock(id, quantity)
    res.success(restockedClothing, 'Clothing item restocked successfully')
  } catch (error) {
    console.error('Error restocking clothing item:', error)
    res.error('Failed to restock clothing item', 500)
  }
})

// 获取库存统计
router.post('/stats', async (req, res) => {
  try {
    const stats = await ClothingService.getInventoryStats()
    res.success(stats, 'Inventory statistics retrieved successfully')
  } catch (error) {
    console.error('Error getting inventory stats:', error)
    res.error('Error getting inventory statistics', 500)
  }
})

module.exports = router

