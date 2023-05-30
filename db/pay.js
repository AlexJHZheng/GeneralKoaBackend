const db=require('../db/index')

// 数据库PayFlow结构为payTotal,payDate,userID,payStatus,payObs
// 新增支付流水，时间为当前时间，状态为0
// 传入数据为payTotal,userID,payObs
async function addPayFlow(payTotal,userID,payObs,payNum,payClient,pix_path){
    const sql = `insert into PayFlow(payTotal,payDate,userID,payStatus,payObs,payNum,payClient,pix_path,payTotalReceved,recStatus,checkStatus) 
    values('${payTotal}',now(),'${userID}',1,'${payObs}','${payNum}','${payClient}','${pix_path}',0,0,0)`
    const result = await db(sql)
    if(result.affectedRows>0){
        return true
    }
    return false
}

// 检查payNum是否存在
async function checkPayNum(payNum){
    const sql = `select * from PayFlow where payNum='${payNum}'`
    const result = await db(sql)
    if(result.length>0){
        return true
    }
    return false
}

// 更新支付流水状态
async function updatePayStatus(payNum,payStatus){
    console.log(payNum,payStatus)
    const sql = `update PayFlow set payStatus='${payStatus}' where payNum='${payNum}'`
    const result = await db(sql)
    if(result.affectedRows>0){
        return true
    }
    return false
}
// 通过传入的用户权限(admin,editot)和用户ID来获取订单列表，如果是admin则获取所有订单，如果是editor则获取该用户的订单
// 传入数据为userRole,userID
async function getPayList(userRole,userID,startTime,endTime){
    // 如果startTime和endTime存在，则查询时间段内的订单，如果不存在，则查询所有订单
    // 查询要联合User表获取summary信息,其中User表中ID和payFlow表中的userID相同
    // 如果是admin，则查询所有订单
    // 如果是editor，则查询该用户的订单
    // 查询结果取 PayFlow中的payNum,payTotal,payDate,payStatus,payObs,payClient,pix_path,payTotalReceved和User中的username,summary
    let sql = ''
    if(userRole=='admin'){
        if(startTime&&endTime){
            sql = `
      SELECT PayFlow.payNum, PayFlow.payTotal, PayFlow.payDate, PayFlow.payStatus, PayFlow.payObs,
      PayFlow.payClient, PayFlow.pix_path, PayFlow.payTotalReceved, User.username, User.summary
      FROM PayFlow
      LEFT JOIN User ON PayFlow.userID = User.ID
      WHERE PayFlow.payDate BETWEEN '${startTime}' AND '${endTime}'
      ORDER BY PayFlow.payDate ASC
    `
        }else{
            sql = `
      SELECT PayFlow.payNum, PayFlow.payTotal, PayFlow.payDate, PayFlow.payStatus, PayFlow.payObs,
      PayFlow.payClient, PayFlow.pix_path, PayFlow.payTotalReceved, User.username, User.summary
      FROM PayFlow
      LEFT JOIN User ON PayFlow.userID = User.ID
      ORDER BY PayFlow.payDate ASC
    `
        }
    }else if(userRole=='editor'){
        if(startTime&&endTime){
            sql = `
      SELECT PayFlow.payNum, PayFlow.payTotal, PayFlow.payDate, PayFlow.payStatus, PayFlow.payObs,
      PayFlow.payClient, PayFlow.pix_path, PayFlow.payTotalReceved, User.username, User.summary
      FROM PayFlow
      LEFT JOIN User ON PayFlow.userID = User.ID
      WHERE PayFlow.payDate BETWEEN '${startTime}' AND '${endTime}' AND PayFlow.userID = '${userID}'
      ORDER BY PayFlow.payDate ASC
    `
        }else{
            sql = `
      SELECT PayFlow.payNum, PayFlow.payTotal, PayFlow.payDate, PayFlow.payStatus, PayFlow.payObs,
      PayFlow.payClient, PayFlow.pix_path, PayFlow.payTotalReceved, User.username, User.summary
      FROM PayFlow
      LEFT JOIN User ON PayFlow.userID = User.ID
      WHERE PayFlow.userID = '${userID}'
      ORDER BY PayFlow.payDate ASC
    `
        }
    }
    const result = await db(sql)
    if(result.length>0){
        return result
    }
    return false
    // 之前的代码




    // let sql = ''
    // if(userRole=='admin'){
    //     sql = `select * from PayFlow`
    // }else if(userRole=='editor'){
    //     sql = `select * from PayFlow where userID='${userID}'`
    // }
    // const result = await db(sql)
    // if(result.length>0){
    //     return result
    // }
    // return false
}



module.exports={
    addPayFlow:addPayFlow,
    checkPayNum:checkPayNum,
    updatePayStatus:updatePayStatus,
    getPayList:getPayList
}