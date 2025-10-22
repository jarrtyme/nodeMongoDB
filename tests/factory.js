/**
 * 测试数据工厂
 * 用于生成测试用的服装数据
 */

const generateClothingData = (overrides = {}) => {
  const baseData = {
    itemNumber: `TEST-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
    imageUrl: 'https://example.com/image.jpg',
    purchasePrice: 50.00,
    sellingPrice: 100.00,
    lengthOrWaist: 70,
    bustOrInseam: 90,
    purchaseQuantity: 10,
    remainingQuantity: 8,
    restockQuantity: 0,
    shippingCost: 5.00,
    returnCost: 0,
    soldQuantity: 2,
    profit: 90.00
  }
  
  return { ...baseData, ...overrides }
}

const generateMultipleClothingData = (count = 3) => {
  return Array.from({ length: count }, (_, index) => 
    generateClothingData({
      itemNumber: `TEST-${index + 1}-${Date.now()}`,
      purchasePrice: 50 + index * 10,
      sellingPrice: 100 + index * 20,
      purchaseQuantity: 10 + index * 5
    })
  )
}

module.exports = {
  generateClothingData,
  generateMultipleClothingData
}
