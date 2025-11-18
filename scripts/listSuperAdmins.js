/**
 * 查询所有超级管理员账号
 *
 * 使用方法：
 * node scripts/listSuperAdmins.js
 */

require('dotenv').config()
const mongoose = require('mongoose')
const UserModel = require('../src/models/userModel')
const connectDB = require('../src/config/dbConnect')

async function listSuperAdmins() {
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
    console.log('数据库连接成功\n')

    // 查询所有超级管理员
    const superAdmins = await UserModel.find({ role: 'super_admin' })
      .select('username email role isActive createdAt lastLogin')
      .sort({ createdAt: 1 })

    if (superAdmins.length === 0) {
      console.log('⚠️  系统中没有超级管理员账号')
      console.log('\n请使用以下命令创建超级管理员：')
      console.log('  npm run create:super-admin <username> <email> <password>')
      console.log('\n示例：')
      console.log('  npm run create:super-admin admin admin@example.com admin123456')
    } else {
      console.log(`✅ 找到 ${superAdmins.length} 个超级管理员账号：\n`)
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
      superAdmins.forEach((admin, index) => {
        console.log(`\n${index + 1}. 用户名: ${admin.username}`)
        console.log(`   邮箱: ${admin.email}`)
        console.log(`   角色: ${admin.role}`)
        console.log(`   状态: ${admin.isActive ? '✅ 启用' : '❌ 禁用'}`)
        console.log(
          `   创建时间: ${
            admin.createdAt ? new Date(admin.createdAt).toLocaleString('zh-CN') : '-'
          }`
        )
        console.log(
          `   最后登录: ${
            admin.lastLogin ? new Date(admin.lastLogin).toLocaleString('zh-CN') : '从未登录'
          }`
        )
      })
      console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')
    }

    // 关闭数据库连接
    await mongoose.connection.close()
    console.log('数据库连接已关闭')
    process.exit(0)
  } catch (error) {
    console.error('查询超级管理员失败:', error)
    process.exit(1)
  }
}

// 运行脚本
listSuperAdmins()
