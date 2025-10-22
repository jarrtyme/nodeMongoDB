# 图片上传API文档

## 概述
提供图片上传、管理和删除功能，支持批量上传和单个上传。**所有接口统一使用POST请求**。

## 基础信息
- **基础路径**: `/upload`
- **请求方法**: 仅支持 POST
- **支持格式**: jpeg, jpg, png, gif, webp
- **文件大小限制**: 5MB
- **批量上传限制**: 最多10个文件

## API接口

### 1. 批量上传图片
**POST** `/upload/images`

上传多个图片文件。

**请求参数:**
- `images`: 文件数组（multipart/form-data）

**响应示例:**
```json
{
  "code": 200,
  "message": "成功上传 2 个文件",
  "data": {
    "files": [
      {
        "originalName": "image1.jpg",
        "filename": "image1_1640995200000_123456789.jpg",
        "path": "/uploads/image1_1640995200000_123456789.jpg",
        "size": 1024000,
        "mimetype": "image/jpeg",
        "uploadTime": "2023-12-31T12:00:00.000Z"
      }
    ],
    "count": 2,
    "totalSize": 2048000
  }
}
```

### 2. 单个图片上传
**POST** `/upload/image`

上传单个图片文件。

**请求参数:**
- `image`: 单个文件（multipart/form-data）

**响应示例:**
```json
{
  "code": 200,
  "message": "图片上传成功",
  "data": {
    "originalName": "photo.jpg",
    "filename": "photo_1640995200000_987654321.jpg",
    "path": "/uploads/photo_1640995200000_987654321.jpg",
    "size": 512000,
    "mimetype": "image/jpeg",
    "uploadTime": "2023-12-31T12:00:00.000Z"
  }
}
```

### 3. 获取图片列表
**POST** `/upload/list`

获取所有已上传的图片信息。

**请求参数:**
- 无（发送空JSON对象即可）

**响应示例:**
```json
{
  "code": 200,
  "message": "获取图片列表成功",
  "data": {
    "images": [
      {
        "filename": "image1_1640995200000_123456789.jpg",
        "path": "/uploads/image1_1640995200000_123456789.jpg",
        "size": 1024000,
        "uploadTime": "2023-12-31T12:00:00.000Z",
        "lastModified": "2023-12-31T12:00:00.000Z"
      }
    ],
    "count": 1,
    "totalSize": 1024000
  }
}
```

### 4. 删除图片
**POST** `/upload/delete`

删除指定的图片文件。

**请求参数:**
```json
{
  "filename": "image1_1640995200000_123456789.jpg"
}
```

**响应示例:**
```json
{
  "code": 200,
  "message": "图片删除成功",
  "data": {
    "filename": "image1_1640995200000_123456789.jpg",
    "deletedAt": "2023-12-31T12:00:00.000Z"
  }
}
```

## 错误处理

### 常见错误码

| 错误码 | 说明 |
|--------|------|
| 400 | 请求参数错误（文件格式不支持、文件过大等） |
| 404 | 文件不存在 |
| 500 | 服务器内部错误 |

### 错误响应示例
```json
{
  "code": 400,
  "message": "只允许上传图片文件 (jpeg, jpg, png, gif, webp)",
  "data": null
}
```

## 使用示例

### JavaScript (fetch)
```javascript
// 批量上传
const formData = new FormData()
formData.append('images', file1)
formData.append('images', file2)

fetch('/upload/images', {
  method: 'POST',
  body: formData
})
.then(response => response.json())
.then(data => console.log(data))

// 单个上传
const formData = new FormData()
formData.append('image', file)

fetch('/upload/image', {
  method: 'POST',
  body: formData
})
.then(response => response.json())
.then(data => console.log(data))
```

### cURL
```bash
# 批量上传
curl -X POST \
  -F "images=@image1.jpg" \
  -F "images=@image2.png" \
  http://localhost:3000/upload/images

# 单个上传
curl -X POST \
  -F "image=@photo.jpg" \
  http://localhost:3000/upload/image

# 获取图片列表
curl -X POST \
  -H "Content-Type: application/json" \
  -d '{}' \
  http://localhost:3000/upload/list

# 删除图片
curl -X POST \
  -H "Content-Type: application/json" \
  -d '{"filename":"image1_1640995200000_123456789.jpg"}' \
  http://localhost:3000/upload/delete
```

## 安全特性

1. **文件类型验证**: 只允许上传指定格式的图片文件
2. **文件大小限制**: 单个文件最大5MB
3. **文件数量限制**: 批量上传最多10个文件
4. **路径遍历防护**: 防止恶意文件名攻击
5. **唯一文件名**: 自动生成唯一文件名防止冲突

## 文件存储

- **存储位置**: `public/uploads/`
- **访问路径**: `/uploads/filename`
- **文件名格式**: `原文件名_时间戳_随机数.扩展名`
