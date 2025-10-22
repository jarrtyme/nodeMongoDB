const request = require('supertest')
const app = require('../app')
const UserModel = require('../src/models/userModel')

describe('JWT认证API测试', () => {
  let app
  let server
  let testUser
  let authToken

  beforeAll(async () => {
    // 设置测试环境
    process.env.NODE_ENV = 'test'
    // 使用与中间件相同的默认密钥
    process.env.JWT_SECRET = 'your-super-secret-jwt-key-change-in-production'
    
    app = require('../app')
    server = app.listen(0) // 使用随机端口
  })

  afterAll(async () => {
    // 清理测试数据
    await UserModel.deleteMany({})
    if (server) {
      server.close()
    }
  })

  beforeEach(async () => {
    // 清理用户数据
    await UserModel.deleteMany({})
  })

  describe('POST /auth/register - 用户注册', () => {
    test('应该成功注册新用户', async () => {
      const userData = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123'
      }

      const response = await request(app)
        .post('/auth/register')
        .send(userData)
        .expect(201)

      expect(response.body.code).toBe(201)
      expect(response.body.message).toBe('注册成功')
      expect(response.body.data).toHaveProperty('user')
      expect(response.body.data).toHaveProperty('token')
      expect(response.body.data.user.username).toBe('testuser')
      expect(response.body.data.user.email).toBe('test@example.com')
      expect(response.body.data.user.password).toBeUndefined() // 密码不应返回
    })

    test('应该拒绝重复用户名', async () => {
      const userData = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123'
      }

      // 先注册一个用户
      await request(app)
        .post('/auth/register')
        .send(userData)

      // 尝试注册相同用户名
      const response = await request(app)
        .post('/auth/register')
        .send(userData)
        .expect(400)

      expect(response.body.code).toBe(400)
      expect(response.body.message).toBe('用户名已存在')
    })

    test('应该拒绝无效数据', async () => {
      const response = await request(app)
        .post('/auth/register')
        .send({
          username: 'ab', // 太短
          email: 'invalid-email',
          password: '123' // 太短
        })
        .expect(400)

      expect(response.body.code).toBe(400)
    })
  })

  describe('POST /auth/login - 用户登录', () => {
    beforeEach(async () => {
      // 创建测试用户
      const userData = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123'
      }
      await request(app)
        .post('/auth/register')
        .send(userData)
    })

    test('应该成功登录', async () => {
      const response = await request(app)
        .post('/auth/login')
        .send({
          username: 'testuser',
          password: 'password123'
        })
        .expect(200)

      expect(response.body.code).toBe(200)
      expect(response.body.message).toBe('登录成功')
      expect(response.body.data).toHaveProperty('user')
      expect(response.body.data).toHaveProperty('token')
      expect(response.body.data.user.username).toBe('testuser')
    })

    test('应该支持邮箱登录', async () => {
      const response = await request(app)
        .post('/auth/login')
        .send({
          username: 'test@example.com', // 使用邮箱登录
          password: 'password123'
        })
        .expect(200)

      expect(response.body.code).toBe(200)
      expect(response.body.data.user.username).toBe('testuser')
    })

    test('应该拒绝错误密码', async () => {
      const response = await request(app)
        .post('/auth/login')
        .send({
          username: 'testuser',
          password: 'wrongpassword'
        })
        .expect(401)

      expect(response.body.code).toBe(401)
      expect(response.body.message).toBe('用户名或密码错误')
    })

    test('应该拒绝不存在的用户', async () => {
      const response = await request(app)
        .post('/auth/login')
        .send({
          username: 'nonexistent',
          password: 'password123'
        })
        .expect(401)

      expect(response.body.code).toBe(401)
      expect(response.body.message).toBe('用户名或密码错误')
    })
  })

  describe('POST /auth/profile - 获取用户信息', () => {
    beforeEach(async () => {
      // 注册并登录用户
      const userData = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123'
      }
      
      const registerResponse = await request(app)
        .post('/auth/register')
        .send(userData)
      
      authToken = registerResponse.body.data.token
    })

    test('应该成功获取用户信息', async () => {
      const response = await request(app)
        .post('/auth/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)

      expect(response.body.code).toBe(200)
      expect(response.body.message).toBe('获取用户信息成功')
      expect(response.body.data.user.username).toBe('testuser')
      expect(response.body.data.user.password).toBeUndefined()
    })

    test('应该拒绝无token请求', async () => {
      const response = await request(app)
        .post('/auth/profile')
        .expect(401)

      expect(response.body.code).toBe(401)
      expect(response.body.message).toBe('访问令牌缺失')
    })

    test('应该拒绝无效token', async () => {
      const response = await request(app)
        .post('/auth/profile')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401)

      expect(response.body.code).toBe(401)
      expect(response.body.message).toBe('无效的访问令牌')
    })
  })

  describe('POST /auth/verify - 验证token', () => {
    beforeEach(async () => {
      // 注册并登录用户
      const userData = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123'
      }
      
      const registerResponse = await request(app)
        .post('/auth/register')
        .send(userData)
      
      authToken = registerResponse.body.data.token
    })

    test('应该成功验证有效token', async () => {
      const response = await request(app)
        .post('/auth/verify')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)

      expect(response.body.code).toBe(200)
      expect(response.body.message).toBe('Token验证成功')
      expect(response.body.data.user.username).toBe('testuser')
    })

    test('应该拒绝无效token', async () => {
      const response = await request(app)
        .post('/auth/verify')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401)

      expect(response.body.code).toBe(401)
    })
  })

  describe('受保护的路由测试', () => {
    beforeEach(async () => {
      // 注册并登录用户
      const userData = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123'
      }
      
      const registerResponse = await request(app)
        .post('/auth/register')
        .send(userData)
      
      authToken = registerResponse.body.data.token
    })

    test('服装管理API应该需要鉴权', async () => {
      const response = await request(app)
        .post('/clothing/stats')
        .expect(401)

      expect(response.body.code).toBe(401)
      expect(response.body.message).toBe('访问令牌缺失')
    })

    test('图片上传API应该需要鉴权', async () => {
      const response = await request(app)
        .post('/upload/list')
        .send({})
        .expect(401)

      expect(response.body.code).toBe(401)
      expect(response.body.message).toBe('访问令牌缺失')
    })

    test('使用有效token应该可以访问受保护的路由', async () => {
      const response = await request(app)
        .post('/clothing/stats')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)

      expect(response.body.code).toBe(200)
      expect(response.body.message).toBe('Inventory statistics retrieved successfully')
    })
  })
})
