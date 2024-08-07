const db = require("../db/index");

// 数据库结构为access_id access_token criar_time expires_in scope
// 更新token
// 传入数据为access_token criar_time expires_in scope
async function updateToken(data) {
  const sql = `update AcessToken set access_token='${data.access_token}',criar_time=now() ,expires_in='${data.expires_in}',scope='${data.scope}'`;
  const result = await db(sql);
  if (result.affectedRows > 0) {
    return true;
  }
  return false;
}

//获取token
async function getToken() {
  const sql = `select * from AcessToken`;
  const result = await db(sql);
  return result[0];
}

module.exports = {
  updateToken,
  getToken,
};
