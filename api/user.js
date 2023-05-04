const Joi=require('joi')  //验证模块
const userdb=require('../db/user')
const jwt = require('jsonwebtoken') //token生成模块
const config=require('../config')


exports.register=async ctx=>{
    //验证
    const register_schema=Joi.object({
        username:Joi.string().alphanum().min(5).max(12).required(),
        password:Joi.string().pattern(/^[\S]{6,15}$/).required()
    })
    const userInfo=ctx.request.body
    const {error}=register_schema.validate(userInfo)
    if(error){
        return ctx.body={status:1,msg:error.message}
    }

    userdb.checkUserName(userInfo.username).then((res)=>{
        console.log('查询用户',userInfo.username)
        console.log('查询结果',res)
    })

    const token=jwt.sign({username:userInfo.username},config.secretKey,{expiresIn:'100s'})
    console.log('token为',token)
    ctx.body=userInfo
}

exports.login=async ctx=>{
    ctx.body='login ok'
}
// eu vou caucular 10 vezes 400
exports.cauculator=async ctx=>{
// 计算10乘400 结果放在变量res中
    let res=10*400
    ctx.body=res
}