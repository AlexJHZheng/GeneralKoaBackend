const jwt = require('jsonwebtoken') //token生成模块
const util = require('util') //解密模块
const config=require('./config') //配置文件
const username='admin'
console.log(config,'config')
console.log(config.secretKey,'config.secreatKey')

const token=jwt.sign({username:username}, config.secretKey,{expiresIn:'600s'}) //生成token
console.log('token为',token)

// Koa解密jwt
const verify = util.promisify(jwt.verify) // 解密-无效
const result = verify(token, config.secretKey) // 解密，获取payload
// 检查token是否过期
const payload = jwt.decode(token, config.secretKey) // 解密，获取payload
console.log('payload',payload)

// 获取到 iat和exp,检查还剩多久过期
const exp = payload.exp
const iat = payload.iat
const now = Date.now() / 1000
const check = now < exp ? true : false
console.log('check',check)
//把exp和iat转换成时间格式

const expTime = new Date(exp * 1000).toLocaleString()
console.log('expTime',expTime)

console.log('result',result)
console.log(verify,'verify')
// 验证token是否过期
// module.exports = function () {
//     console.log('运行了funcion')
//     return async function (ctx, next) {
//         const token = ctx.header.authorization // 获取jwt
//         if (token) {
//             let payload
//             try {
//                 payload = await verify(token.split(' ')[1], config.secretKey) // 解密payload，获取用户名和ID
//                 ctx.user = {
//                     name: payload.name,
//                     id: payload.id
//                 }
//             } catch (err) {
//                 ctx.throw(401, err.message)
//             }
//         }
//         await next()
//     }
// }