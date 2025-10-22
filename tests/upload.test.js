const request = require('supertest')
const app = require('../app')
const path = require('path')
const fs = require('fs')

describe('图片上传API测试', () => {
  
  describe('POST /upload/images - 批量上传图片', () => {
    test('应该成功上传多个图片文件', async () => {
      // 创建测试图片文件
      const testImage1 = Buffer.from('fake-image-1-data')
      const testImage2 = Buffer.from('fake-image-2-data')
      
      const response = await request(app)
        .post('/upload/images')
        .attach('images', testImage1, 'test1.jpg')
        .attach('images', testImage2, 'test2.png')
        .expect(200)
      
      expect(response.body.code).toBe(200)
      expect(response.body.message).toContain('成功上传 2 个文件')
      expect(response.body.data.files).toHaveLength(2)
      expect(response.body.data.count).toBe(2)
      expect(response.body.data.files[0]).toHaveProperty('filename')
      expect(response.body.data.files[0]).toHaveProperty('path')
      expect(response.body.data.files[0].path).toMatch(/^\/uploads\//)
    })

    test('应该拒绝没有文件的上传请求', async () => {
      const response = await request(app)
        .post('/upload/images')
        .expect(400)
      
      expect(response.body.code).toBe(400)
      expect(response.body.message).toBe('请选择要上传的图片文件')
    })

    test('应该拒绝非图片文件', async () => {
      const testFile = Buffer.from('fake-text-data')
      
      const response = await request(app)
        .post('/upload/images')
        .attach('images', testFile, 'test.txt')
        .expect(400)
      
      expect(response.body.code).toBe(400)
      expect(response.body.message).toContain('只允许上传图片文件')
    })
  })

  describe('POST /upload/image - 单个图片上传', () => {
    test('应该成功上传单个图片文件', async () => {
      const testImage = Buffer.from('fake-image-data')
      
      const response = await request(app)
        .post('/upload/image')
        .attach('image', testImage, 'single-test.jpg')
        .expect(200)
      
      expect(response.body.code).toBe(200)
      expect(response.body.message).toBe('图片上传成功')
      expect(response.body.data).toHaveProperty('filename')
      expect(response.body.data).toHaveProperty('path')
      expect(response.body.data.path).toMatch(/^\/uploads\//)
    })

    test('应该拒绝没有文件的上传请求', async () => {
      const response = await request(app)
        .post('/upload/image')
        .expect(400)
      
      expect(response.body.code).toBe(400)
      expect(response.body.message).toBe('请选择要上传的图片文件')
    })
  })

  describe('POST /upload/list - 获取图片列表', () => {
    test('应该成功获取图片列表', async () => {
      const response = await request(app)
        .post('/upload/list')
        .send({})
        .expect(200)
      
      expect(response.body.code).toBe(200)
      expect(response.body.message).toBe('获取图片列表成功')
      expect(response.body.data).toHaveProperty('images')
      expect(response.body.data).toHaveProperty('count')
      expect(Array.isArray(response.body.data.images)).toBe(true)
    })
  })

  describe('POST /upload/delete - 删除图片', () => {
    let uploadedFilename

    beforeEach(async () => {
      // 先上传一个测试图片
      const testImage = Buffer.from('fake-image-for-delete')
      const uploadResponse = await request(app)
        .post('/upload/image')
        .attach('image', testImage, 'delete-test.jpg')
      
      uploadedFilename = uploadResponse.body.data.filename
    })

    test('应该成功删除图片文件', async () => {
      const response = await request(app)
        .post('/upload/delete')
        .send({ filename: uploadedFilename })
        .expect(200)
      
      expect(response.body.code).toBe(200)
      expect(response.body.message).toBe('图片删除成功')
      expect(response.body.data.filename).toBe(uploadedFilename)
    })

    test('应该处理不存在的文件', async () => {
      const response = await request(app)
        .post('/upload/delete')
        .send({ filename: 'nonexistent.jpg' })
        .expect(404)
      
      expect(response.body.code).toBe(404)
      expect(response.body.message).toBe('文件不存在')
    })

    test('应该拒绝无效的文件名', async () => {
      const response = await request(app)
        .post('/upload/delete')
        .send({ filename: '../../../etc/passwd' })
        .expect(400)
      
      expect(response.body.code).toBe(400)
      expect(response.body.message).toBe('无效的文件名')
    })
  })

  // 清理测试文件
  afterAll(async () => {
    const uploadDir = path.join(__dirname, '../../public/uploads')
    if (fs.existsSync(uploadDir)) {
      const files = fs.readdirSync(uploadDir)
      files.forEach(file => {
        if (file.startsWith('test') || file.startsWith('single-test') || file.startsWith('delete-test')) {
          fs.unlinkSync(path.join(uploadDir, file))
        }
      })
    }
  })
})
