// 数据库配置文件
module.exports = {
  // 本地数据库配置
  local: {
    url: 'mongodb://127.0.0.1:27017/clothing_inventory'
  },
  
  // 远程数据库配置
  remote: {
    // 请替换为您的实际远程数据库连接信息
    url: 'mongodb://zhibo:wny63eZfbkfAMnth@193.111.30.228:27017/zhibo'
  },
  
  // 当前使用的环境配置
  // 可选值: 'local' 或 'remote'
  current: 'remote'
}
