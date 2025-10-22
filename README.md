# 服装库存管理系统

基于 Node.js + Express + MongoDB 的服装库存管理API系统。

## 功能特性

- 🏪 **服装管理**: 完整的CRUD操作，支持库存管理
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

## API设计

- **统一请求方法**: 所有接口使用POST请求
- **路径表示操作**: 通过路径区分增删改查
- **统一响应格式**: 标准JSON响应格式

## 快速开始

### 安装依赖
```bash
npm install
```

### 配置数据库
编辑 `src/config/database.js` 配置数据库连接信息。

### 启动应用
```bash
npm start
```

### 运行测试
```bash
npm test
```

## API文档

- [API接口总览](./API_OVERVIEW.md)
- [图片上传API](./UPLOAD_API.md)

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
