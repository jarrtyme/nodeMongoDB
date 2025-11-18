# 脚本使用说明

## 创建超级管理员

### 方法一：使用初始化脚本（推荐）

使用提供的脚本创建第一个超级管理员：

```bash
cd back-end
node scripts/createSuperAdmin.js <username> <email> <password>
```

**示例：**

```bash
node scripts/createSuperAdmin.js admin admin@example.com admin123456
```

**注意事项：**

- 脚本会自动检查用户名和邮箱是否已存在
- 如果系统中已存在超级管理员，会提示确认是否继续创建
- 密码至少需要 6 个字符
- 脚本执行完成后会自动关闭数据库连接

### 方法二：通过管理员接口升级（需要先有管理员账号）

1. 使用管理员账号登录系统
2. 在用户管理页面，将普通用户或管理员升级为超级管理员
3. **注意**：只有现有的超级管理员才能将其他用户升级为超级管理员

### 方法三：直接在数据库中创建（不推荐）

如果以上方法都不可用，可以直接在 MongoDB 中创建：

```javascript
// 在 MongoDB shell 中执行
use your_database_name

db.users.insertOne({
  username: "admin",
  email: "admin@example.com",
  password: "$2a$12$...", // 需要使用 bcrypt 加密的密码
  role: "super_admin",
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date()
})
```

**注意**：密码需要使用 bcrypt 加密，建议使用方法一或方法二。

## 安全说明

- 注册接口不允许注册 `super_admin` 角色
- 只有超级管理员可以将其他用户升级为超级管理员
- 建议在生产环境中限制超级管理员的数量
