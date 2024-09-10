const BookModel = require('../models/bookModel.js')

const create = async (data) => {
  try {
    const savedDoc = await BookModel.create(data) // 保存到数据库
    return savedDoc // 返回保存的结果
  } catch (error) {
    console.error('Error creating document:', error)
    throw error // 抛出错误，便于上层捕获处理
  }
}

const find = async (query, page = 1, limit = 10) => {
  try {
    const skip = (page - 1) * limit
    const docs = await BookModel.find(query)
      .skip(skip) // 跳过前面的文档
      .limit(limit) // 限制返回的文档数量
    return docs
  } catch (error) {
    console.error('Error finding books:', error)
    throw new Error('Error finding books')
  }
}

async function update(bookId, updateFields) {
  try {
    const updatedBook = await BookModel.findByIdAndUpdate(
      bookId,
      { $set: updateFields }, // 使用 $set 来进行部分更新
      { new: true, runValidators: true } // 返回更新后的文档，并运行验证
    )
    return updatedBook
  } catch (error) {
    throw new Error('Error updating book: ' + error.message)
  }
}

const remove = async (id) => {
  try {
    const deletedDoc = await BookModel.findByIdAndDelete(id) // 根据 ID 删除文档
    return deletedDoc // 返回被删除的文档
  } catch (error) {
    console.error('Error deleting document:', error)
    throw error
  }
}

module.exports = {
  create,
  find,
  update,
  remove
}
