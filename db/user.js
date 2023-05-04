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
//查询用户和密码是否正确，如果错误返回0
//如果正确获取用户的status值
//如果status为0表示用户不能登录，返回-1
//如果status为1表示用户可以登录，返回1
async function checkUserLogin(user,password){
    const sql = `select * from User where userName='${user}' and password='${password}'`
    const result = await db(sql)
    if(result.length>0){
        if(result[0].status==0){
            return -1
        }
        return 1
    }
    return 0
}



module.exports={
    checkUserName:checkUserName,
    checkUserLogin:checkUserLogin
}