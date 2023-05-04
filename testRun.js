const jwt = require('jsonwebtoken')
const config=require('./config')
const username='admin'
console.log(config,'config')
console.log(config.secretKey,'config.secreatKey')

// const token=jwt.sign({username:username}, config.secreatKey,{expiresIn:'100s'})
// console.log('token为',token)

// Koa解密jwt

// const util = require('util')
// const verify = util.promisify(jwt.verify) // 解密
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