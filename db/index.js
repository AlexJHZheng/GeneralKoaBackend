//数据库连接模块
//导入环境变量
require("dotenv").config();

//导入mysql模块
const mysql = require("mysql");
const pool = mysql.createPool({
  //数据库IP
  host: process.env.DB_HOST,
  //数据库账号
  user: process.env.DB_USER,
  //数据库密码
  password: process.env.DB_PASSWORD,
  //数据库名称
  database: process.env.DB_DATABASE,
});
//返回Promise，使用连接池，连接查询mysql
const query = function (sql) {
  return new Promise((resolve, reject) => {
    pool.getConnection(function (err, connection) {
      if (err) {
        reject(err);
      } else {
        connection.query(sql, (err, results) => {
          if (err) {
            reject(err);
          } else {
            resolve(results);
          }
          connection.release();
        });
      }
    });
  });
};
module.exports = query;
