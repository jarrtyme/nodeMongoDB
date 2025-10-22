const request = require('supertest')
const app = require('../app')
const ClothingModel = require('../src/models/clothingModel')
const { generateClothingData, generateMultipleClothingData } = require('./factory')

describe('服装管理API测试', () => {
  
  describe('POST /clothing/create - 创建服装记录', () => {
    test('应该成功创建新的服装记录', async () => {
      const clothingData = generateClothingData()
      
      const response = await request(app)
        .post('/clothing/create')
        .send(clothingData)
        .expect(200)
      
      expect(response.body.code).toBe(200)
      expect(response.body.message).toBe('Clothing item created successfully')
      expect(response.body.data).toMatchObject({
        itemNumber: clothingData.itemNumber,
        purchasePrice: clothingData.purchasePrice,
        sellingPrice: clothingData.sellingPrice,
        purchaseQuantity: clothingData.purchaseQuantity,
        remainingQuantity: clothingData.remainingQuantity
      })
    })

    test('应该拒绝重复的货号', async () => {
      const clothingData = generateClothingData()
      
      // 先创建一个记录
      await ClothingModel.create(clothingData)
      
      // 尝试创建相同货号的记录
      const response = await request(app)
        .post('/clothing/create')
        .send(clothingData)
        .expect(400)
      
      expect(response.body.code).toBe(500)
      expect(response.body.message).toBe('Item number already exists')
    })

    test('应该拒绝无效的数据', async () => {
      const invalidData = {
        itemNumber: '', // 空货号
        purchasePrice: -10, // 负数价格
        sellingPrice: -20 // 负数价格
      }
      
      const response = await request(app)
        .post('/clothing/create')
        .send(invalidData)
        .expect(500)
      
      expect(response.body.code).toBe(500)
    })
  })

  describe('POST /clothing/find - 查询服装列表', () => {
    beforeEach(async () => {
      // 创建测试数据
      const testData = generateMultipleClothingData(5)
      await ClothingModel.insertMany(testData)
    })

    test('应该返回所有服装记录', async () => {
      const response = await request(app)
        .post('/clothing/find')
        .send({})
        .expect(200)
      
      expect(response.body.code).toBe(200)
      expect(response.body.data).toHaveLength(5)
    })

    test('应该支持分页查询', async () => {
      const response = await request(app)
        .post('/clothing/find')
        .send({ page: 1, limit: 2 })
        .expect(200)
      
      expect(response.body.code).toBe(200)
      expect(response.body.data).toHaveLength(2)
    })

    test('应该支持条件查询', async () => {
      const response = await request(app)
        .post('/clothing/find')
        .send({ purchasePrice: { $gte: 60 } })
        .expect(200)
      
      expect(response.body.code).toBe(200)
      expect(response.body.data.length).toBeGreaterThan(0)
    })
  })

  describe('POST /clothing/findById - 根据ID查询单个服装', () => {
    let testClothing

    beforeEach(async () => {
      testClothing = await ClothingModel.create(generateClothingData())
    })

    test('应该成功根据ID查询服装', async () => {
      const response = await request(app)
        .post('/clothing/findById')
        .send({ id: testClothing._id })
        .expect(200)
      
      expect(response.body.code).toBe(200)
      expect(response.body.data._id.toString()).toBe(testClothing._id.toString())
    })

    test('应该拒绝缺少ID的请求', async () => {
      const response = await request(app)
        .post('/clothing/findById')
        .send({})
        .expect(400)
      
      expect(response.body.code).toBe(500)
      expect(response.body.message).toBe('ID is required')
    })

    test('应该处理不存在的ID', async () => {
      const fakeId = '507f1f77bcf86cd799439011'
      
      const response = await request(app)
        .post('/clothing/findById')
        .send({ id: fakeId })
        .expect(404)
      
      expect(response.body.code).toBe(500)
      expect(response.body.message).toBe('Clothing item not found')
    })
  })

  describe('POST /clothing/update - 更新服装信息', () => {
    let testClothing

    beforeEach(async () => {
      testClothing = await ClothingModel.create(generateClothingData())
    })

    test('应该成功更新服装信息', async () => {
      const updateData = {
        id: testClothing._id,
        sellingPrice: 150.00,
        remainingQuantity: 5
      }
      
      const response = await request(app)
        .post('/clothing/update')
        .send(updateData)
        .expect(200)
      
      expect(response.body.code).toBe(200)
      expect(response.body.data.sellingPrice).toBe(150.00)
      expect(response.body.data.remainingQuantity).toBe(5)
    })

    test('应该拒绝缺少ID的请求', async () => {
      const response = await request(app)
        .post('/clothing/update')
        .send({ sellingPrice: 150.00 })
        .expect(400)
      
      expect(response.body.code).toBe(500)
      expect(response.body.message).toBe('ID is required')
    })

    test('应该处理不存在的ID', async () => {
      const fakeId = '507f1f77bcf86cd799439011'
      
      const response = await request(app)
        .post('/clothing/update')
        .send({ id: fakeId, sellingPrice: 150.00 })
        .expect(404)
      
      expect(response.body.code).toBe(500)
      expect(response.body.message).toBe('Clothing item not found')
    })
  })

  describe('POST /clothing/remove - 删除服装记录', () => {
    let testClothing

    beforeEach(async () => {
      testClothing = await ClothingModel.create(generateClothingData())
    })

    test('应该成功删除服装记录', async () => {
      const response = await request(app)
        .post('/clothing/remove')
        .send({ id: testClothing._id })
        .expect(200)
      
      expect(response.body.code).toBe(200)
      expect(response.body.message).toBe('Clothing item deleted successfully')
      
      // 验证记录已被删除
      const deletedClothing = await ClothingModel.findById(testClothing._id)
      expect(deletedClothing).toBeNull()
    })

    test('应该拒绝缺少ID的请求', async () => {
      const response = await request(app)
        .post('/clothing/remove')
        .send({})
        .expect(400)
      
      expect(response.body.code).toBe(500)
      expect(response.body.message).toBe('ID is required')
    })

    test('应该处理不存在的ID', async () => {
      const fakeId = '507f1f77bcf86cd799439011'
      
      const response = await request(app)
        .post('/clothing/remove')
        .send({ id: fakeId })
        .expect(404)
      
      expect(response.body.code).toBe(500)
      expect(response.body.message).toBe('Clothing item not found')
    })
  })

  describe('POST /clothing/restock - 补货操作', () => {
    let testClothing

    beforeEach(async () => {
      testClothing = await ClothingModel.create(generateClothingData({
        remainingQuantity: 5,
        restockQuantity: 0
      }))
    })

    test('应该成功进行补货操作', async () => {
      const restockData = {
        id: testClothing._id,
        quantity: 10
      }
      
      const response = await request(app)
        .post('/clothing/restock')
        .send(restockData)
        .expect(200)
      
      expect(response.body.code).toBe(200)
      expect(response.body.message).toBe('Clothing item restocked successfully')
      expect(response.body.data.restockQuantity).toBe(10)
      expect(response.body.data.remainingQuantity).toBe(15) // 5 + 10
    })

    test('应该拒绝缺少ID的请求', async () => {
      const response = await request(app)
        .post('/clothing/restock')
        .send({ quantity: 10 })
        .expect(400)
      
      expect(response.body.code).toBe(500)
      expect(response.body.message).toBe('ID is required')
    })

    test('应该拒绝无效的数量', async () => {
      const response = await request(app)
        .post('/clothing/restock')
        .send({ id: testClothing._id, quantity: 0 })
        .expect(400)
      
      expect(response.body.code).toBe(500)
      expect(response.body.message).toBe('Valid quantity is required')
    })

    test('应该拒绝负数数量', async () => {
      const response = await request(app)
        .post('/clothing/restock')
        .send({ id: testClothing._id, quantity: -5 })
        .expect(400)
      
      expect(response.body.code).toBe(500)
      expect(response.body.message).toBe('Valid quantity is required')
    })
  })

  describe('POST /clothing/stats - 获取库存统计', () => {
    beforeEach(async () => {
      // 创建测试数据
      const testData = generateMultipleClothingData(3)
      await ClothingModel.insertMany(testData)
    })

    test('应该成功获取库存统计', async () => {
      const response = await request(app)
        .post('/clothing/stats')
        .send({})
        .expect(200)
      
      expect(response.body.code).toBe(200)
      expect(response.body.message).toBe('Inventory statistics retrieved successfully')
      expect(response.body.data).toHaveProperty('totalItems')
      expect(response.body.data).toHaveProperty('totalPurchaseQuantity')
      expect(response.body.data).toHaveProperty('totalRemainingQuantity')
      expect(response.body.data).toHaveProperty('totalSoldQuantity')
      expect(response.body.data).toHaveProperty('totalProfit')
      expect(response.body.data.totalItems).toBe(3)
    })
  })

  describe('自动计算功能测试', () => {
    test('应该自动计算售卖件数和利润', async () => {
      const clothingData = generateClothingData({
        purchaseQuantity: 10,
        remainingQuantity: 3,
        restockQuantity: 2,
        purchasePrice: 50,
        sellingPrice: 100,
        shippingCost: 5,
        returnCost: 2
      })
      
      const response = await request(app)
        .post('/clothing/create')
        .send(clothingData)
        .expect(200)
      
      const createdClothing = response.body.data
      
      // 验证自动计算
      // 售卖件数 = 进货件数 + 补货件数 - 剩余件数 = 10 + 2 - 3 = 9
      expect(createdClothing.soldQuantity).toBe(9)
      
      // 利润 = (售卖价 × 售卖件数) - (进货价 × 总进货件数) - 运费 - 退货运费
      // = (100 × 9) - (50 × 12) - 5 - 2 = 900 - 600 - 5 - 2 = 293
      expect(createdClothing.profit).toBe(293)
    })
  })
})
