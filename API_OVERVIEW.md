# API接口总览

## 设计原则
- **统一请求方法**: 所有接口都使用 POST 请求
- **路径表示操作**: 通过路径来区分增删改查操作
- **统一响应格式**: 所有接口返回统一的JSON格式
- **JWT鉴权**: 业务接口需要JWT token认证

## 响应格式
```json
{
  "code": 200,           // 状态码
  "message": "成功信息",  // 消息
  "data": {}            // 数据（成功时）或 null（失败时）
}
```

## 认证API (`/auth`)

### 1. 用户注册
**POST** `/auth/register`
- **功能**: 注册新用户账户
- **参数**: `{ username, email, password, role? }`
- **返回**: 用户信息和JWT token

### 2. 用户登录
**POST** `/auth/login`
- **功能**: 用户登录认证
- **参数**: `{ username, password }` (支持用户名或邮箱登录)
- **返回**: 用户信息和JWT token

### 3. 获取用户信息
**POST** `/auth/profile`
- **功能**: 获取当前用户信息
- **鉴权**: 需要JWT token
- **返回**: 用户详细信息

### 4. 更新用户信息
**POST** `/auth/update`
- **功能**: 更新当前用户信息
- **鉴权**: 需要JWT token
- **参数**: `{ username?, email? }`
- **返回**: 更新后的用户信息

### 5. 修改密码
**POST** `/auth/change-password`
- **功能**: 修改用户密码
- **鉴权**: 需要JWT token
- **参数**: `{ oldPassword, newPassword }`
- **返回**: 修改结果

### 6. 验证Token
**POST** `/auth/verify`
- **功能**: 验证JWT token有效性
- **参数**: Authorization header with Bearer token
- **返回**: 用户信息

### 7. 获取用户列表（管理员）
**POST** `/auth/users`
- **功能**: 获取所有用户列表
- **鉴权**: 需要管理员权限
- **参数**: `{ page?, limit?, ...query }`
- **返回**: 用户列表

### 8. 更新用户角色（管理员）
**POST** `/auth/users/:userId/role`
- **功能**: 更新用户角色
- **鉴权**: 需要管理员权限
- **参数**: `{ role }`
- **返回**: 更新后的用户信息

### 9. 禁用/启用用户（管理员）
**POST** `/auth/users/:userId/status`
- **功能**: 禁用或启用用户账户
- **鉴权**: 需要管理员权限
- **参数**: `{ isActive }`
- **返回**: 更新后的用户信息

### 10. 删除用户（管理员）
**POST** `/auth/users/:userId/delete`
- **功能**: 删除用户账户
- **鉴权**: 需要管理员权限
- **返回**: 删除结果

## 服装管理API (`/clothing`)
**注意**: 所有服装管理接口都需要JWT token认证

### 1. 创建服装记录
**POST** `/clothing/create`
- **功能**: 创建新的服装入库记录
- **鉴权**: 需要JWT token
- **参数**: 服装信息JSON对象
- **返回**: 创建的服装记录

### 2. 查询服装列表
**POST** `/clothing/find`
- **功能**: 查询服装列表（支持分页和条件查询）
- **鉴权**: 需要JWT token
- **参数**: `{ page, limit, ...query }`
- **返回**: 服装列表

### 3. 根据ID查询单个服装
**POST** `/clothing/findById`
- **功能**: 根据ID查询单个服装
- **鉴权**: 需要JWT token
- **参数**: `{ id }`
- **返回**: 服装详情

### 4. 更新服装信息
**POST** `/clothing/update`
- **功能**: 更新服装信息
- **鉴权**: 需要JWT token
- **参数**: `{ id, ...updateFields }`
- **返回**: 更新后的服装记录

### 5. 删除服装记录
**POST** `/clothing/remove`
- **功能**: 删除服装记录
- **鉴权**: 需要JWT token
- **参数**: `{ id }`
- **返回**: 被删除的服装记录

### 6. 补货操作
**POST** `/clothing/restock`
- **功能**: 对服装进行补货
- **鉴权**: 需要JWT token
- **参数**: `{ id, quantity }`
- **返回**: 补货后的服装记录

### 7. 获取库存统计
**POST** `/clothing/stats`
- **功能**: 获取库存统计信息
- **鉴权**: 需要JWT token
- **参数**: 无
- **返回**: 统计信息

## 图片上传API (`/upload`)
**注意**: 所有图片上传接口都需要JWT token认证

### 1. 批量上传图片
**POST** `/upload/images`
- **功能**: 批量上传多个图片文件
- **鉴权**: 需要JWT token
- **参数**: `images` 文件数组（multipart/form-data）
- **返回**: 上传结果列表

### 2. 单个图片上传
**POST** `/upload/image`
- **功能**: 上传单个图片文件
- **鉴权**: 需要JWT token
- **参数**: `image` 单个文件（multipart/form-data）
- **返回**: 上传结果

### 3. 获取图片列表
**POST** `/upload/list`
- **功能**: 获取所有已上传的图片信息
- **鉴权**: 需要JWT token
- **参数**: 无（发送空JSON对象）
- **返回**: 图片列表

### 4. 删除图片
**POST** `/upload/delete`
- **功能**: 删除指定的图片文件
- **鉴权**: 需要JWT token
- **参数**: `{ filename }`
- **返回**: 删除结果

## 使用示例

### JavaScript (fetch)
```javascript
// 用户注册
const registerData = {
  username: "testuser",
  email: "test@example.com",
  password: "password123"
}

const registerResponse = await fetch('/auth/register', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(registerData)
})

const { data } = await registerResponse.json()
const token = data.token

// 使用token访问受保护的API
const clothingResponse = await fetch('/clothing/stats', {
  method: 'POST',
  headers: { 
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({})
})

// 上传图片
const formData = new FormData()
formData.append('image', fileInput.files[0])

const uploadResponse = await fetch('/upload/image', {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${token}` },
  body: formData
})
```

### cURL
```bash
# 用户注册
curl -X POST \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","email":"test@example.com","password":"password123"}' \
  http://localhost:3000/auth/register

# 用户登录
curl -X POST \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","password":"password123"}' \
  http://localhost:3000/auth/login

# 使用token访问受保护的API
curl -X POST \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{}' \
  http://localhost:3000/clothing/stats

# 上传图片
curl -X POST \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "image=@photo.jpg" \
  http://localhost:3000/upload/image
```

## 错误处理

### 常见错误码
- **200**: 成功
- **201**: 创建成功
- **400**: 请求参数错误
- **401**: 未认证（需要登录）
- **403**: 权限不足
- **404**: 资源不存在
- **500**: 服务器内部错误

### 错误响应示例
```json
{
  "code": 401,
  "message": "访问令牌缺失",
  "data": null
}
```

## 安全特性

1. **JWT鉴权**: 所有业务接口都需要有效的JWT token
2. **密码加密**: 用户密码使用bcrypt加密存储
3. **角色权限**: 支持用户和管理员角色
4. **请求方法限制**: 只允许POST请求
5. **文件类型验证**: 图片上传只允许指定格式
6. **文件大小限制**: 防止大文件攻击
7. **路径遍历防护**: 防止恶意文件名攻击
8. **数据验证**: 所有输入数据都经过验证