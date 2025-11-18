/**
 * 创建超级管理员脚本
 *
 * 使用方法：
 * node scripts/createSuperAdmin.js <username> <email> <password>
 *
 * 示例：
 * node scripts/createSuperAdmin.js admin admin@example.com admin123456
 */

require('dotenv').config()
const mongoose = require('mongoose')
const UserModel = require('../src/models/userModel')
const connectDB = require('../src/config/dbConnect')

async function createSuperAdmin() {
  try {
    // 连接数据库
    await connectDB()
    // 等待连接建立
    await new Promise((resolve) => {
      if (mongoose.connection.readyState === 1) {
        resolve()
      } else {
        mongoose.connection.once('open', resolve)
      }
    })
    console.log('数据库连接成功')

    // 获取命令行参数
    const args = process.argv.slice(2)
    if (args.length < 3) {
      console.error('使用方法: node scripts/createSuperAdmin.js <username> <email> <password>')
      console.error('示例: node scripts/createSuperAdmin.js admin admin@example.com admin123456')
      process.exit(1)
    }

    const [username, email, password] = args

    // 验证输入
    if (!username || !email || !password) {
      console.error('错误: 用户名、邮箱和密码不能为空')
      process.exit(1)
    }

    if (password.length < 6) {
      console.error('错误: 密码至少6个字符')
      process.exit(1)
    }

    // 检查是否已存在该用户
    const existingUser = await UserModel.findOne({
      $or: [{ username }, { email }]
    })

    if (existingUser) {
      if (existingUser.username === username) {
        console.error(`错误: 用户名 "${username}" 已存在`)
        process.exit(1)
      }
      if (existingUser.email === email) {
        console.error(`错误: 邮箱 "${email}" 已被注册`)
        process.exit(1)
      }
    }

    // 检查是否已存在超级管理员
    const existingSuperAdmin = await UserModel.findOne({ role: 'super_admin' })
    if (existingSuperAdmin) {
      console.log(`警告: 系统中已存在超级管理员: ${existingSuperAdmin.username}`)
      console.log('是否继续创建新的超级管理员? (y/n)')

      // 在非交互式环境中，默认继续
      const readline = require('readline')
      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
      })

      const answer = await new Promise((resolve) => {
        rl.question('', resolve)
      })
      rl.close()

      if (answer.toLowerCase() !== 'y' && answer.toLowerCase() !== 'yes') {
        console.log('已取消创建')
        process.exit(0)
      }
    }

    // 创建超级管理员
    const superAdmin = new UserModel({
      username,
      email: email.toLowerCase(),
      password,
      role: 'super_admin',
      isActive: true
    })

    await superAdmin.save()

    console.log('\n✅ 超级管理员创建成功!')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log(`用户名: ${superAdmin.username}`)
    console.log(`邮箱: ${superAdmin.email}`)
    console.log(`角色: ${superAdmin.role}`)
    console.log(`用户ID: ${superAdmin._id}`)
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')

    // 关闭数据库连接
    await mongoose.connection.close()
    console.log('数据库连接已关闭')
    process.exit(0)
  } catch (error) {
    console.error('创建超级管理员失败:', error)
    process.exit(1)
  }
}

// 运行脚本
createSuperAdmin()
