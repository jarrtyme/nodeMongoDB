# 服装库存管理系统

基于 Node.js + Express + MongoDB 的服装库存管理 API 系统。

## 功能特性

- 🏪 **服装管理**: 完整的 CRUD 操作，支持库存管理
- 📸 **图片上传**: 支持批量图片上传和管理
- 🔄 **自动计算**: 自动计算售卖件数和利润
- 📊 **库存统计**: 实时库存统计和分析
- 🧪 **单元测试**: 完整的测试覆盖
- 🔒 **安全防护**: 文件类型验证、路径遍历防护

## 技术栈

- **后端**: Node.js + Express
- **数据库**: MongoDB
- **测试**: Jest + Supertest + MongoDB Memory Server
- **文件上传**: Multer

## API 设计

- **统一请求方法**: 所有接口使用 POST 请求
- **路径表示操作**: 通过路径区分增删改查
- **统一响应格式**: 标准 JSON 响应格式

## 快速开始

### 安装依赖

```bash
npm install
```

### 配置数据库

#### 开发环境

创建 `.env.development` 文件：

```env
NODE_ENV=development
MONGODB_HOST=localhost
MONGODB_PORT=27017
MONGODB_DATABASE=clothing_inventory
```

#### 生产环境

创建 `.env.production` 文件，配置 MongoDB 认证信息：

**方式一：使用完整连接字符串（推荐）**

```env
NODE_ENV=production
MONGODB_URI=mongodb://username:password@host:port/database?authSource=admin
```

**方式二：使用分离的配置项**

```env
NODE_ENV=production
MONGODB_HOST=your-mongodb-host
MONGODB_PORT=27017
MONGODB_DATABASE=clothing_inventory
MONGODB_USER=your-username
MONGODB_PASSWORD=your-password
MONGODB_AUTH_SOURCE=admin
```

**MongoDB Atlas 云服务配置**

```env
NODE_ENV=production
MONGODB_PROTOCOL=mongodb+srv
MONGODB_HOST=cluster0.xxxxx.mongodb.net
MONGODB_DATABASE=clothing_inventory
MONGODB_USER=your-username
MONGODB_PASSWORD=your-password
MONGODB_AUTH_SOURCE=admin
```

### 启动应用

**开发环境**

```bash
npm run dev
```

**生产环境**

```bash
npm run prod
```

### 运行测试

```bash
npm test
```

## API 文档

- [API 接口总览](./API_OVERVIEW.md)
- [图片上传 API](./UPLOAD_API.md)

## 项目结构

```
src/
├── config/          # 配置文件
├── middlewares/     # 中间件
├── models/          # 数据模型
├── routes/          # 路由
└── services/        # 业务服务
tests/               # 测试文件
public/uploads/      # 图片上传目录
```

## 许可证

MIT License
