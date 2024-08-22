const db = require("../db/index");

//查询用户是否存在
async function checkUserName(user) {
  //为真表示用户名存在
  const sql = `select * from User where userName='${user}'`;
  const result = await db(sql);
  if (result.length > 0) {
    return true;
  }
  return false;
}
//查询用户和密码是否正确，如果错误返回0
//如果正确获取用户的status值
//如果status为0表示用户不能登录，返回-1
//如果status为1表示用户可以登录，返回1
async function checkUserLogin(user, password) {
  const sql = `select * from User where userName='${user}' and password='${password}'`;
  const result = await db(sql);
  if (result.length > 0) {
    if (result[0].status == 0) {
      return -1;
    }
    return 1;
  }
  return 0;
}

//注册用户
//接收用户名,密码，summary
//数据库中插入用户名，密码，status为1，createTime为当前时间,summary
async function register(user, password, summary) {
  const sql = `insert into User(userName,password,status,createTime,summary) values('${user}','${password}',1,now(),'${summary}')`;
  const result = await db(sql);
  if (result.affectedRows > 0) {
    return true;
  }
  return false;
}

//通过用户名获取用户ID
async function getUserID(user) {
  const sql = `select * from User where userName='${user}'`;
  const result = await db(sql);
  if (result.length > 0) {
    return result[0].ID;
  }
  return false;
}

//通过用户名获取用户和店铺ID
async function getUsershopID(user) {
  const sql = `SELECT ID, shopID FROM User WHERE userName = '${user}'`;
  const result = await db(sql);
  if (result.length > 0) {
    return {
      userID: result[0].ID,
      shopID: result[0].shopID,
    };
  }
  return false;
}

// 获取用户权限
async function getUserRoles(user) {
  const sql = `select * from User where userName='${user}'`;
  const result = await db(sql);
  if (result.length > 0) {
    return result[0].roles;
  }
  return false;
}

module.exports = {
  checkUserName: checkUserName,
  checkUserLogin: checkUserLogin,
  register: register,
  getUserID: getUserID,
  getUserRoles: getUserRoles,
  getUsershopID: getUsershopID,
};
