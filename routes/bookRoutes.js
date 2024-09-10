const express = require('express')
const router = express.Router()

const BookService = require('../services/bookService') // 引入封装好的服务

// 创建新书籍+
router.post('/create', async (req, res) => {
  try {
    const newBook = await BookService.create(req.body)
    res.success(newBook, 'Book created successfully') // 使用 res.success 格式化成功响应
  } catch (error) {
    console.error('Error creating book:', error)
    res.error('Failed to create book', 500) // 使用 res.error 格式化错误响应
  }
})
// 删除书籍+
router.post('/remove', async (req, res) => {
  try {
    const deletedBook = await BookService.remove(req.body.id) // 删除操作根据 ID 进行
    if (!deletedBook) {
      return res.error({ error: 'Book not found' })
    }
    res.success(deletedBook)
  } catch (error) {
    res.error('Failed to create book', 500) // 使用 res.error 格式化错误响应
  }
})
// 更新书籍 +
router.patch('/update', async (req, res) => {
  try {
    const updatedBook = await BookService.update(req.body.id, req.body)
    if (!updatedBook) {
      return res.error('Book not found') // 如果找不到书籍，返回 404 错误
    }
    res.success(updatedBook, 'Book updated successfully') // 成功更新返回成功消息
  } catch (error) {
    console.error('Error updating book:', error)
    res.error('Failed to update book', 500) // 其他错误返回 500 错误
  }
})
// 查找书籍 +
router.post('/find', async (req, res) => {
  const { page = 1, limit = 10, ...query } = req.body // 从请求体中提取分页参数和查询条件
  try {
    const books = await BookService.find(query, page, limit)
    res.success(books, 'Books retrieved successfully')
  } catch (error) {
    res.error('Error finding books', 500)
  }
})

module.exports = router
