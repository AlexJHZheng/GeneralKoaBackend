//数据库连接模块

//导入mysql模块
const mysql=require('mysql')
const pool = mysql.createPool({
     //数据库IP
     host:'177.71.131.255',
     //数据库账号
     user:'admin',
     //数据库密码
     password:'nmYrzEL2GzZyGFw8',
     //数据库名称
     database:'pix'
  })
  //返回Promise，使用连接池，连接查询mysql
  const query = function(sql) {
    return new Promise((resolve, reject) => {
      pool.getConnection(function(err, connection) {
        if (err) {
          reject(err)
        } else {
          connection.query(sql, (err, results) => {
            if (err) {
              reject(err)
            } else {
              resolve(results)
            }
            connection.release()
          })
        }
      })
    })
  }
module.exports=query
