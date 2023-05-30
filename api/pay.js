const paydb = require('../db/pay')
const userdb = require('../db/user')
const jwt = require('jsonwebtoken') //token生成模块
const config=require('../config') //配置文件

// 新增支付流水
exports.addPayFlow = async ctx => {
    
    // 获取请求的用户信息，并解析出用户名和密码
    const payInfo = ctx.request.body
    // 订单金额
    const payTotal = payInfo.payTotal
    // 订单备注
    const payObs = payInfo.payObs
    // 订单号
    const payNum = payInfo.payNum
    // 客人名字
    const payClient = payInfo.payClient
    // payNum不能为空
    if (!payNum) {
        return ctx.body = { status: -3, msg: '订单号不能为空' }
    }
    // 查询数据库中payNum是否存在
    const payNumExist = await paydb.checkPayNum(payNum)
    if(payNumExist){
        return ctx.body = { status: -4, msg: '订单号已存在' }
    }

    // 获取token
    const token = ctx.header.authorization
    // 截取掉Bearer和空格
    const tokenStr = token.substring(7)
    // 解析token,获取用户名
    const username = jwt.decode(tokenStr, config.secretKey).username // 解密，获取payload
    // 根据用户名获取用户ID
    const userID = await userdb.getUserID(username).then((res) => {
        console.log(res, '用户ID')
        return res
    })
    // 验证
    if (!payTotal) {
        return ctx.body = { status: -1, msg: '支付金额不能为空' }
    }
    if (!userID) {
        return ctx.body = { status: -2, msg: '用户ID不能为空' }
    }
    // 向银行请求支付，获取二维码链接和支付订单号
    // pix_path 订单号 
    const pix_path = 'kk6g232xel65a0daee4dd13kk471542221'
    // pix_copy 二维码信息文件
    // pix_wallet 二维码图片地址




    
    const result = await paydb.addPayFlow(payTotal, userID, payObs,payNum,payClient,pix_path).then((res) => {
        return res
    })
    if (result) {
        return ctx.body = { status: 200, msg: '支付流水新增成功' }
    } else {
        return ctx.body = { status: -5, msg: '支付流水新增失败' }
    }
}

// 修改支付流水状态
exports.updatePayStatus = async ctx => {
    const payInfo = ctx.request.body
    const payNum = payInfo.payNum
    const payStatus = payInfo.payStatus
    // 检查payStatus只能为1,2
    if (payStatus != 1 && payStatus != 2) {
        return ctx.body = { status: -4, msg: '支付状态只能为1或2' }
    }
    if (!payNum) {
        return ctx.body = { status: -1, msg: '订单号不能为空' }
    }
    if (!payStatus) {
        return ctx.body = { status: -2, msg: '支付状态不能为空' }
    }
    const result = await paydb.updatePayStatus(payNum, payStatus).then((res) => {
        return res
    })
    if (result) {
        return ctx.body = { status: 200, msg: '支付流水状态修改成功' }
    } else {
        return ctx.body = { status: -3, msg: '支付流水状态修改失败' }
    }
}

// 获取支付流水列表
exports.getPayFlowList = async ctx => {
    // 先获取用户ID
    // 接着获取用户角色
    // 调用db/pay.js中的getPayFlowList方法
    // 返回结果
    const token = ctx.header.authorization
    // 获取时间段
    // const time = ctx.request.query
    console.log(ctx.request.query)
    // 如果ctx.request.query存在，则解析出startTime和endTime
    let startTime = ''
    let endTime = ''
    if (ctx.request.query) {
        startTime = ctx.request.query.startTime
        endTime = ctx.request.query.endTime
    }
    // 截取掉Bearer和空格
    const tokenStr = token.substring(7)
    // 解析token,获取用户名
    const username = jwt.decode(tokenStr, config.secretKey).username // 解密，获取payload
    // 根据用户名获取用户ID
    const userID = await userdb.getUserID(username).then((res) => {
        return res
    }
    )
    // 根据用户ID获取用户角色
    const userRole = await userdb.getUserRoles(username).then((res) => {
        console.log(res, '用户角色')
        return res
    }
    )
    // 调用db/pay.js中的getPayFlowList方法
    const result = await paydb.getPayList(userRole, userID,startTime,endTime).then((res) => {
        return res
    }
    )



    if (result) {
        return ctx.body = { status: 200, msg: '支付流水列表获取成功', data: result }
    }
    else {
        return ctx.body = { status: -1, msg: '支付流水列表获取失败' }
    }
}