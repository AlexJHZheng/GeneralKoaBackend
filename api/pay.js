const paydb = require('../db/pay')
const userdb = require('../db/user')
const jwt = require('jsonwebtoken') //token生成模块
const config=require('../config') //配置文件
const axios = require('axios') //axios模块

// 新增支付流水
exports.addPayFlow = async ctx => {
    //计时开始
    const startTime = new Date();
    // console.log(ctx.request.body,'请求')
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
    // 过期时间-分钟
    const expiration=payInfo.expiration
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
    // const pix_path = 'kk6g232xel65a0daee4dd13kk471542221'
    // pix_copy 二维码信息文件
    let pix_path=''
    let pix_copy=''
    let pix_wallet=''
    // pix_wallet 二维码图片地址
    const parts = payTotal.toString().split('.');
    const integerPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    const decimalPart = parts[1] ? parts[1] : '00';
    var payBrasil=`${integerPart},${decimalPart}`
    const endTime = new Date();
    const elapsedTimeInSeconds = (endTime - startTime) / 1000;
    console.log(`接口运行时间1：${elapsedTimeInSeconds} 秒`);
    try {
        const postData = {
            token_api: 'MhbdYZ0X0JRhFJfJtob9kvr45kzQxQMZdgIUYTnytQcRE2hEJ4vsxmI4nqWEAEAgs5dtzfYGmmQhupQ8BzyDsoRk6SZ9TXE3BdH273p8QDEWhul7kk7ztwm5tOv75BVr',
            name : 'ADRIANA BATISTA E SILVA',
            document : '38782887861',
            email : 'suporte@suprem.cash',
            description : payNum,
            amount : payBrasil,
            expiration : expiration,
          }
          const endTime = new Date();
          const elapsedTimeInSeconds = (endTime - startTime) / 1000;
          console.log(`接口运行时间2：${elapsedTimeInSeconds} 秒`);
        // 调用接口获取数据
        const response = await axios.post('https://api.suprem.cash/pix/collection/wallet',postData);
        const data = response.data;
        pix_path=data.info.pix_path
        pix_copy=data.info.pix_copy
        pix_wallet=data.info.pix_wallet
        if(data.success){
            const endTime = new Date();
            const elapsedTimeInSeconds = (endTime - startTime) / 1000;
            console.log(`接口运行时间3：${elapsedTimeInSeconds} 秒`);

            console.log(data,'接口调用成功')
            const result = await paydb.addPayFlow(payTotal, userID, payObs,payNum,payClient,pix_path,expiration).then((res) => {
                return res
            })
            if (result) {
                const endTime = new Date();
                const elapsedTimeInSeconds = (endTime - startTime) / 1000;
                console.log(`接口运行时间4：${elapsedTimeInSeconds} 秒`);
                return ctx.body = { status: 200, msg: '支付流水新增成功' ,data:{pix_path,pix_copy,pix_wallet} }
            } else {
                return ctx.body = { status: -5, msg: '支付流水新增失败' }
            }
        }
        
      } catch (error) {
        // 处理错误情况
        console.log(error,'接口调用失败');
        return ctx.body = { status: -6, msg: '支付流水新增失败' }
        // console.error('Error:', error);
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

// 查询支付状态
exports.getPayStatus = async ctx => {
    const pix_path = ctx.request.body.pix_path
    // 调用db中的checkExpDate方法，检查是否过期
    const exp=await paydb.checkExpDate(pix_path)
    // exp 0订单不存在 1.订单未过期 2.订单已过期
    console.log(exp,'检验checkExpDate方法')
    // 如果订单不存在
    if(exp==0){
        return ctx.body = { status: -1,  msg: '订单不存在'}
    }
    const postData = {
        token_api: 'MhbdYZ0X0JRhFJfJtob9kvr45kzQxQMZdgIUYTnytQcRE2hEJ4vsxmI4nqWEAEAgs5dtzfYGmmQhupQ8BzyDsoRk6SZ9TXE3BdH273p8QDEWhul7kk7ztwm5tOv75BVr',
        pix_path : pix_path
      }
    try {
        const response = await axios.post('https://api.suprem.cash/pix/collection/info',postData)
        const data = response.data;
        if(data.success){
            // 检查status是否更新
            if(data.info.status==0){
                // 返回付款成功
                const amount_pay=data.info.amount_pay
                paydb.updatePayStatus(pix_path,0,amount_pay)
                return ctx.body = { status: 200, success:false ,code:200,  msg: '付款已成功',data:data.info}
            }else if(data.info.status==1){
                if(exp==2){
                    // 订单已过期
                    paydb.updatePayStatus(pix_path,3,0)
                    return ctx.body = { status: 200, success:false ,code:-1, msg: '二维码已失效'}
                }else{
                    // 待付款状态，并且未过期
                    return ctx.body = { status: 200, success:true ,code:200,  msg: '查询成功',data:data.info }
                }
            }else if(data.info.status==2){
                //部分付款
                paydb.updatePayStatus(pix_path,data.info.status,amount_pay)
                return ctx.body = {  status: 200, success:false ,code:-2, msg: '仅部分付款，请联系客服'}
            }else if(data.info.status==3){
                //cancelado
                paydb.updatePayStatus(pix_path,data.info.status,amount_pay)
                return ctx.body = {  status: 200, success:false ,code:-3, msg: '订单已取消'}
            }else if(data.info.status==4){
                //已退款
                paydb.updatePayStatus(pix_path,data.info.status,amount_pay)
                return ctx.body = {  status: 200, success:false ,code:-4, msg: '订单已退款'}
            }else{
                return ctx.body = { status: -2, msg: '查询失败'}
            }
        }
    }catch (error) {
        console.log(error,'接口调用失败');
        return ctx.body = { status: -3, msg: '查询失败' }
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
    const currentPage = ctx.request.query.currentPage
    const pageSize = ctx.request.query.pageSize
    // 调用db/pay.js中的getPayFlowList方法
    const result = await paydb.getPayList(userRole, userID,startTime,endTime,currentPage,pageSize).then((res) => {
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

