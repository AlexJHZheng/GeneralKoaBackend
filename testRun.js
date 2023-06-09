const jwt = require('jsonwebtoken') //token生成模块
const util = require('util') //解密模块
const config=require('./config') //配置文件
const username='admin'

// 获取当前时间戳
const expiration=30
const now = Date.now()
// 给当前时间增加30分钟
const exp = now + 1000 * 60 * expiration

console.log(now,exp)
