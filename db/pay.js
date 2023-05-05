const db=require('../db/index')

// 数据库PayFlow结构为payTotal,payDate,userID,payStatus,payObs
// 新增支付流水，时间为当前时间，状态为0
// 传入数据为payTotal,userID,payObs
async function addPayFlow(payTotal,userID,payObs,payNum){
    const sql = `insert into PayFlow(payTotal,payDate,userID,payStatus,payObs,payNum) values('${payTotal}',now(),'${userID}',0,'${payObs}',${payNum})`
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

module.exports={
    addPayFlow:addPayFlow,
    checkPayNum:checkPayNum,
    updatePayStatus:updatePayStatus
}