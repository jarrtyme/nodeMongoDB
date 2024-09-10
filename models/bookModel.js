const mongoose = require('mongoose')
mongoose.connect('mongodb://127.0.0.1:27017/book')
mongoose.connection.once('open', () => {
  console.log('Connected to MongoDB')
})
mongoose.connection.once('close', () => {
  console.log('close MongoDB')
})
mongoose.connection.on('error', (err) => {
  console.log(err)
})

const Book = new mongoose.Schema({
  name: String,
  price: Number,
  age: Number,
  is_hot: Boolean,
  list: Array,
  time: Date,
  mixins: mongoose.SchemaTypes.Mixed
})
// 对文档操作的对象
const BookModel = mongoose.model('Book', Book)

module.exports = BookModel
