const db=require('../db/index')

//查询用户是否存在
async function checkUserName(user){ //为真表示用户名存在
    const sql = `select * from user where userName='${user}'`
    const result = await db(sql)
    if(result.length>0){
        return true
    }
        return false
}

module.exports={
    checkUserName:checkUserName,
}