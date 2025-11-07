// API 请求示例
import { get, post, put, del } from '@/utils/request'

/**
 * 示例：获取用户列表
 */
export function getUserList(params) {
  return get('/users', params)
}

/**
 * 示例：获取用户详情
 */
export function getUserById(id) {
  return get(`/users/${id}`)
}

/**
 * 示例：创建用户
 */
export function createUser(data) {
  return post('/users', data)
}

/**
 * 示例：更新用户
 */
export function updateUser(id, data) {
  return put(`/users/${id}`, data)
}

/**
 * 示例：删除用户
 */
export function deleteUser(id) {
  return del(`/users/${id}`)
}

