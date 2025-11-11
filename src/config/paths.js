/**
 * 路径配置文件
 * 统一管理项目中的路径，避免硬编码路径导致的错误
 */

const path = require('path')

// 项目根目录（back-end 目录）
const projectRoot = path.join(__dirname, '../..')

// 公共资源目录
const publicDir = path.join(projectRoot, 'public')

// 上传文件目录
const uploadsDir = path.join(publicDir, 'uploads')

// 图片目录
const imagesDir = path.join(uploadsDir, 'images')

// 视频目录
const videosDir = path.join(uploadsDir, 'videos')

// 文档目录
const documentsDir = path.join(uploadsDir, 'documents')

// 其他文件目录
const othersDir = path.join(uploadsDir, 'others')

module.exports = {
  projectRoot,
  publicDir,
  uploadsDir,
  imagesDir,
  videosDir,
  documentsDir,
  othersDir
}
