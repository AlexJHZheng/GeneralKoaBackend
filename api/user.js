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
    //获取请求的用户信息，并解析出用户名和密码
    const userInfo=ctx.request.body
    const username=userInfo.username
    //用户名为空则返回用户名不能为空
    if(!username){
        return ctx.body={status:-2,msg:'用户名不能为空'}
    }
    const password=userInfo.password
    //密码为空则返回密码不能为空
    if(!password){
        return ctx.body={status:-3,msg:'密码不能为空'}
    }
    //验证
    const result = await userdb.checkUserLogin(username,password).then((res)=>{
        return res
    })
    var res=''
    console.log(result,'result')
    //result为0返回用户名密码错误
    if(result==0){
        res={status:1,msg:'用户名或密码错误'}
    }
    //result为-1返回用户被禁用
    if(result==-1){
        res={status:-1,msg:'用户被禁用'}
    }
    //result为1返回登录成功
    if(result==1){
        const token=jwt.sign({username:userInfo.username},config.secretKey,{expiresIn:'24h'})
        const refreshToken=jwt.sign({username:userInfo.username},config.secretKey,{expiresIn:'30d'})
        res={status:200,msg:'登录成功',token:token,refreshToken:refreshToken}
    }
    ctx.body=res
}
// eu vou caucular 10 vezes 400
exports.cauculator=async ctx=>{
// 计算10乘400 结果放在变量res中
    let res=10*400
    ctx.body=res
}