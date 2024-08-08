const db = require("../db/index");

// 数据库PayFlow结构为payTotal,payDate,userID,payStatus,payObs
// 新增支付流水，时间为当前时间，状态为0
// 传入数据为payTotal,userID,payObs
async function addPayFlow(
  payTotal,
  userID,
  payObs,
  payNum,
  payClient,
  pix_path,
  expiration,
  bankName
) {
  console.log(payNum, "payNum2");
  const sql = `insert into PayFlow(payTotal,payDate,userID,payStatus,payObs,payNum,payClient,pix_path,payTotalReceved,recStatus,checkStatus,deleted,expDate,bankName) 
    values('${payTotal}',now(),'${userID}',1,'${payObs}','${payNum}','${payClient}','${pix_path}',0,0,0,0,DATE_ADD(NOW(), INTERVAL ${expiration} MINUTE), '${bankName}')`;
  const result = await db(sql);
  if (result.affectedRows > 0) {
    console.log(result.affectedRows, "数据库插入行数");
    return true;
  }
  return false;
}

// 检查payNum是否存在
async function checkPayNum(payNum) {
  const sql = `select * from PayFlow where payNum='${payNum}'`;
  const result = await db(sql);
  if (result.length > 0) {
    return true;
  }
  return false;
}

// 更新支付流水状态
async function updatePayStatus(pix_path, payStatus, payTotalReceved) {
  // console.log(payNum,payStatus)
  const sql = `UPDATE PayFlow SET payStatus='${payStatus}', payTotalReceved='${payTotalReceved}', updateTime=NOW() WHERE pix_path='${pix_path}'`;

  // const sql = `update PayFlow set payStatus='${payStatus}' where payNum='${payNum}'`
  const result = await db(sql);
  if (result.affectedRows > 0) {
    return true;
  }
  return false;
}
// 通过传入的用户权限(admin,editot)和用户ID来获取订单列表，如果是admin则获取所有订单，如果是editor则获取该用户的订单
// 传入数据为userRole,userID
async function getPayList(
  userRole,
  userID,
  startTime,
  endTime,
  currentPage,
  pageSize
) {
  // 如果startTime和endTime存在，则查询时间段内的订单，如果不存在，则查询所有订单
  // 查询要联合User表获取summary信息,其中User表中ID和payFlow表中的userID相同
  // 如果是admin，则查询所有订单
  // 如果是editor，则查询该用户的订单
  // 查询结果取 PayFlow中的payNum,payTotal,payDate,payStatus,payObs,payClient,pix_path,payTotalReceved和User中的username,summary
  let sql = "";
  let countSql = "";
  let conditions = "";
  if (userRole === "admin") {
    if (startTime && endTime) {
      conditions = `WHERE PayFlow.payDate BETWEEN '${startTime}' AND '${endTime}' `;
    }
  } else if (userRole === "editor") {
    if (startTime && endTime) {
      conditions = `WHERE PayFlow.payDate BETWEEN '${startTime}' AND '${endTime}' AND PayFlow.userID = '${userID}' `;
    } else {
      conditions = `WHERE PayFlow.userID = '${userID}' `;
    }
  }
  // 如果conditions为空，则插入 `WHERE PayFlow.deleted = 0`
  // 如果不为空，则给conditions加上 `AND PayFlow.deleted = 0`
  if (conditions === "") {
    conditions = `WHERE PayFlow.deleted = 0 `;
  } else {
    conditions = conditions + `AND PayFlow.deleted = 0 `;
  }
  sql = `
  SELECT PayFlow.payNum, PayFlow.payTotal, PayFlow.payDate, PayFlow.payStatus, PayFlow.payObs,
  PayFlow.payClient, PayFlow.pix_path, PayFlow.payTotalReceved, PayFlow.expDate,User.username, User.summary 
  FROM PayFlow
  LEFT JOIN User ON PayFlow.userID = User.ID
  ${conditions}
  ORDER BY PayFlow.payDate ASC
  LIMIT ${(currentPage - 1) * pageSize}, ${pageSize}
`;
  countSql = `
    SELECT COUNT(*) AS total
    FROM PayFlow
    LEFT JOIN User ON PayFlow.userID = User.ID
    ${conditions}
  `;

  const [result, countResult] = await Promise.all([db(sql), db(countSql)]);
  const totalCount = countResult[0].total;

  return {
    data: result,
    total: totalCount,
    currentPage: currentPage,
    pageSize: pageSize,
  };
}

//检查pix_path是否存在
async function checkPixPath(pix_path) {
  const sql = `select * from PayFlow where pix_path='${pix_path}'`;
  const result = await db(sql);
  if (result.length > 0) {
    return true;
  }
  return false;
}
//检查pix_path订单是否过期 0订单不存在 1.订单未过期 2.订单已过期
async function checkExpDate(pix_path) {
  const sql = `select * from PayFlow where pix_path='${pix_path}'`;
  const result = await db(sql);
  if (result.length > 0) {
    //通过订单号查询获取expDate，注意这个时间是数据库中的时间，不是当前时间
    const expDate = result[0].expDate;
    //获取当前时间
    const now = Date.now();
    //将数据库中的时间转换为时间戳
    const expDateStamp = new Date(expDate).getTime();
    //未过期1 已过期2
    if (expDateStamp > now) {
      return 1;
    } else {
      return 2;
    }
  }
  return 0;
}

module.exports = {
  addPayFlow: addPayFlow,
  checkPayNum: checkPayNum,
  updatePayStatus: updatePayStatus,
  getPayList: getPayList,
  checkPixPath: checkPixPath,
  checkExpDate: checkExpDate,
};
