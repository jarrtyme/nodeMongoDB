<!-- fa161979-7b6a-4f5c-8ea6-07ddaccdbb8a 4247d44d-1b55-4949-9a1d-caa1e9e06c27 -->
# 服装入库系统实施计划

## 1. 删除现有book模块

- 删除文件: `models/bookModel.js`, `services/bookService.js`, `routes/bookRoutes.js`
- 从 `app.js` 中移除book路由引用

## 2. 创建服装(Clothing)数据模型

创建 `models/clothingModel.js`:

- 货号 (itemNumber): String, required, unique
- 图片 (imageUrl): String
- 拿货价 (purchasePrice): Number, required
- 售卖价 (sellingPrice): Number, required
- 衣长/腰围 (lengthOrWaist): Number
- 胸围/裤长 (bustOrInseam): Number
- 拿货数量 (purchaseQuantity): Number, required, default: 0
- 剩余数量 (remainingQuantity): Number, required, default: 0
- 补货 (restockQuantity): Number, default: 0
- 成本快递 (shippingCost): Number, default: 0
- 退货成本 (returnCost): Number, default: 0
- 售卖件数 (soldQuantity): Number, default: 0, 计算字段
- 利润 (profit): Number, default: 0, 计算字段
- 入库日期 (createdAt): Date, default: Date.now
- 更新日期 (updatedAt): Date

MongoDB连接改为: `mongodb://127.0.0.1:27017/clothing_inventory`

## 3. 创建服装服务层

创建 `services/clothingService.js`:

- `create(data)`: 创建服装记录,自动计算售卖件数和利润
- `find(query, page, limit)`: 查询服装列表,支持分页
- `findById(id)`: 根据ID查询单个服装
- `update(id, updateFields)`: 更新服装信息,重新计算利润
- `remove(id)`: 删除服装记录
- `restock(id, quantity)`: 补货功能,更新补货数量和剩余数量

计算逻辑:

- 售卖件数 = 拿货数量 + 补货 - 剩余数量
- 利润 = (售卖价 × 售卖件数) - (拿货价 × (拿货数量 + 补货)) - 成本快递 - 退货成本

## 4. 创建路由层

创建 `routes/clothingRoutes.js`:

- `POST /clothing/create`: 创建服装入库记录
- `POST /clothing/find`: 查询服装列表(支持分页和条件查询)
- `POST /clothing/findById`: 根据ID查询单个服装
- `POST /clothing/update`: 更新服装信息
- `POST /clothing/remove`: 删除服装记录
- `POST /clothing/restock`: 补货操作

## 5. 更新应用配置

在 `app.js` 中:

- 删除 `const bookRoutes = require('./routes/bookRoutes')`
- 删除 `app.use('/book', bookRoutes)`
- 添加 `const clothingRoutes = require('./routes/clothingRoutes')`
- 添加 `app.use('/clothing', clothingRoutes)`

## 6. 更新README文档

更新 `README.md`:

- 说明服装入库系统的功能
- API接口文档和使用示例
- 数据模型字段说明

### To-dos

- [ ] 删除book模块的所有文件和引用
- [ ] 创建clothingModel.js,定义服装数据结构和MongoDB连接
- [ ] 创建clothingService.js,实现业务逻辑和计算功能
- [ ] 创建clothingRoutes.js,实现所有API接口
- [ ] 更新app.js,替换路由配置
- [ ] 更新README.md文档