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
  bankName,
  shopID
) {
  console.log(payNum, "payNum2");
  const sql = `insert into PayFlow(payTotal,payDate,userID,payStatus,payObs,payNum,payClient,pix_path,payTotalReceved,recStatus,checkStatus,deleted,expDate,bankName,shopID) 
    values('${payTotal}',now(),'${userID}',1,'${payObs}','${payNum}','${payClient}','${pix_path}',0,0,0,0,DATE_ADD(NOW(), INTERVAL ${expiration} MINUTE), '${bankName}', '${shopID}')`;
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
  shopID,
  startTime,
  endTime,
  currentPage,
  pageSize,
  query
) {
  // 如果没有提供时间范围，默认设置为今天的开始到结束
  if (!startTime || !endTime) {
    const today = new Date();
    startTime =
      new Date(today.setHours(0, 0, 0, 0)).toISOString().split("T")[0] +
      " 00:00:00";
    endTime =
      new Date(today.setHours(23, 59, 59, 999)).toISOString().split("T")[0] +
      " 23:59:59";
  }

  // 初始化条件语句
  let conditions = `WHERE PayFlow.payDate BETWEEN '${startTime}' AND '${endTime}' `;

  // 修改后的用户角色和shopID判断
  if (userRole === "editor" || userRole === "user") {
    conditions += `AND PayFlow.shopID = '${shopID}' `;
  }

  // 添加模糊搜索条件
  if (query) {
    const searchQuery = `%${query}%`;
    conditions += `AND (PayFlow.payObs LIKE '${searchQuery}' OR PayFlow.payClient LIKE '${searchQuery}' OR PayFlow.payTotal LIKE '${searchQuery}') `;
  }

  // 追加固定条件: PayFlow.payStatus = 0
  conditions += `AND PayFlow.payStatus = 0 `;

  // 构造SQL查询语句，LEFT JOIN 时获取 User.shopID
  const sql = `
  SELECT PayFlow.payNum, PayFlow.payTotal, PayFlow.payDate, PayFlow.payStatus, PayFlow.payObs,
    PayFlow.payClient, PayFlow.pix_path, PayFlow.payTotalReceved, PayFlow.expDate, User.username, 
    User.summary, User.shopID
  FROM PayFlow
  LEFT JOIN User ON PayFlow.userID = User.ID
  ${conditions}
  ORDER BY PayFlow.payDate ASC
  LIMIT ${(currentPage - 1) * pageSize}, ${pageSize}
`;

  // 修改 countSql 查询，去除 LEFT JOIN
  const countSql = `
  SELECT COUNT(*) AS total
  FROM PayFlow
  ${conditions}
`;

  // 打印 SQL 查询语句以进行调试
  console.log("SQL Query:", sql);

  // 执行查询
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

// 获取店家的支付流水和总计（分页）
async function getPayTotalList(
  userID,
  shopID,
  startTime,
  endTime,
  currentPage,
  pageSize
) {
  // 如果用户没有提供时间段，则默认使用今天的整天时间段
  // 如果用户没有提供时间段，则默认使用今天的整天时间段
  if (!startTime || !endTime) {
    const today = new Date();

    // 获取今天的开始时间 (00:00:00)
    startTime = new Date(today.setHours(0, 0, 0, 0))
      .toISOString()
      .slice(0, 19)
      .replace("T", " ");

    // 获取今天的结束时间 (23:59:59)
    endTime = new Date(today.setHours(23, 59, 59, 999))
      .toISOString()
      .slice(0, 19)
      .replace("T", " ");
  }

  // 构建查询条件，强制检查 payStatus = 0 和 userID
  const conditions = `
  WHERE PayFlow.payDate BETWEEN '${startTime}' AND '${endTime}' 
  AND PayFlow.payStatus = 0 
  AND PayFlow.shopID = '${shopID}'
`;

  // 构建查询分页记录和总金额的SQL
  let sql = `
  SELECT PayFlow.payNum, PayFlow.payTotal, PayFlow.payDate, PayFlow.payStatus, PayFlow.payObs,
  PayFlow.payClient, PayFlow.pix_path, PayFlow.payTotalReceved, PayFlow.expDate, User.username, User.summary 
  FROM PayFlow
  LEFT JOIN User ON PayFlow.userID = User.ID
  ${conditions}
  ORDER BY PayFlow.payDate ASC
  LIMIT ${(currentPage - 1) * pageSize}, ${pageSize}
`;

  // 构建统计总数和总金额的SQL
  let countSql = `
  SELECT COUNT(*) AS total, SUM(PayFlow.payTotal) AS totalAmount
  FROM PayFlow
  ${conditions}
`;

  // 执行SQL查询
  const [result, countResult] = await Promise.all([db(sql), db(countSql)]);
  const totalCount = countResult[0].total;
  let totalAmount = countResult[0].totalAmount || 0; // 计算总金额，如果没有符合条件的记录，则为0
  // 处理浮点数精度问题，将 totalAmount 保留两位小数
  totalAmount = parseFloat(totalAmount.toFixed(2));

  // 返回结果
  return {
    data: result,
    total: totalCount,
    totalAmount: totalAmount,
    currentPage: currentPage,
    pageSize: pageSize,
  };
}

// 获取所有用户的支付流水和总计（不分页）
async function getPayShopTotal(startTime, endTime) {
  // 如果用户没有提供时间段，则默认使用今天的整天时间段
  if (!startTime || !endTime) {
    const today = new Date();

    // 获取今天的开始时间 (00:00:00)
    startTime = new Date(today.setHours(0, 0, 0, 0))
      .toISOString()
      .slice(0, 19)
      .replace("T", " ");

    // 获取今天的结束时间 (23:59:59)
    endTime = new Date(today.setHours(23, 59, 59, 999))
      .toISOString()
      .slice(0, 19)
      .replace("T", " ");
  }

  // 构建查询条件，检查 payStatus = 0
  const conditions = `
  WHERE PayFlow.payDate BETWEEN '${startTime}' AND '${endTime}' 
  AND PayFlow.payStatus = 0
`;

  // 构建通过 UserID 聚合的SQL查询，计算每个用户的总金额并显示 summary
  let sql = `
  SELECT PayFlow.shopID, User.shopID, User.summary, SUM(PayFlow.payTotal) AS totalAmount
  FROM PayFlow
  LEFT JOIN User ON PayFlow.userID = User.ID
  ${conditions}
  GROUP BY PayFlow.shopID, User.summary
  ORDER BY totalAmount DESC
`;

  // 构建统计所有用户总金额的SQL
  let totalSql = `
  SELECT SUM(PayFlow.payTotal) AS grandTotalAmount
  FROM PayFlow
  ${conditions}
`;

  // 执行SQL查询
  const [result, totalResult] = await Promise.all([db(sql), db(totalSql)]);
  let grandTotalAmount = totalResult[0].grandTotalAmount || 0; // 总计所有用户的金额

  // 处理浮点数精度问题，将 totalAmount 和 grandTotalAmount 保留两位小数
  grandTotalAmount = parseFloat(grandTotalAmount.toFixed(2));

  // 处理每个用户的总金额
  result.forEach((item) => {
    item.totalAmount = parseFloat(item.totalAmount.toFixed(2));
  });

  // 返回结果
  return {
    data: result,
    total: result.length, // 结果集中用户的总数
    grandTotalAmount: grandTotalAmount, // 所有用户的总金额
  };
}

module.exports = {
  addPayFlow: addPayFlow,
  checkPayNum: checkPayNum,
  updatePayStatus: updatePayStatus,
  getPayList: getPayList,
  checkPixPath: checkPixPath,
  checkExpDate: checkExpDate,
  getPayTotalList: getPayTotalList,
  getPayShopTotal: getPayShopTotal,
};
