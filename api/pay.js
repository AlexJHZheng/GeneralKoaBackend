const paydb = require("../db/pay");
const userdb = require("../db/user");
const jwt = require("jsonwebtoken"); //token生成模块
const config = require("../config"); //配置文件
const BBapi = require("../api/BBapi");

// 新增支付流水
exports.addPayFlow = async (ctx) => {
  //计时开始
  const startTime = new Date();
  // 获取请求的用户信息，并解析出用户名和密码
  const payInfo = ctx.request.body;
  const payTotal = payInfo.payTotal; // 订单金额
  const payObs = payInfo.payObs; // 订单备注
  const payNum = payInfo.payNum; // 订单号
  console.log(payNum, "订单号");
  const payClient = payInfo.payClient; // 客人名字
  const expiration = payInfo.expiration; // 过期时间-分钟

  // payNum不能为空
  if (!payNum) {
    return (ctx.body = {
      status: -3,
      msg: "O número do pedido não pode ficar vazio",
    });
  }
  // 查询数据库中payNum是否存在
  const payNumExist = await paydb.checkPayNum(payNum);
  if (payNumExist) {
    return (ctx.body = { status: -4, msg: "O número do pedido já existe" });
  }
  // 获取token
  const token = ctx.header.authorization;
  // 截取掉Bearer和空格
  const tokenStr = token.substring(7);
  // 解析token,获取用户名
  const username = jwt.decode(tokenStr, config.secretKey).username; // 解密，获取payload
  // 根据用户名获取用户ID和店铺ID
  console.log("用户名" + username);
  const user = await userdb.getUsershopID(username).then((res) => {
    console.log(res, "用户ID");
    return res;
  });
  const userID = user.userID;
  const shopID = user.shopID;
  // 验证
  if (!payTotal) {
    return (ctx.body = {
      status: -1,
      msg: "O valor do pagamento não pode ficar vazio",
    });
  }
  if (!userID) {
    return (ctx.body = {
      status: -2,
      msg: "O ID do usuário não pode ficar vazio",
    });
  }
  // 向银行请求支付，获取二维码链接和支付订单号
  let pix_path = ""; //订单号
  let pix_copy = ""; //二维码信息文件
  const parts = payTotal.toString().split(".");
  const integerPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  const decimalPart = parts[1] ? parts[1] : "00";
  var payBrasil = `${integerPart},${decimalPart}`;
  const endTime = new Date();
  const elapsedTimeInSeconds = (endTime - startTime) / 1000;

  //传入数据调用pixapi接口
  try {
    const resultApi = await BBapi.getQRCode(expiration, payTotal, userID);
    if (resultApi.check) {
      // 调用成功
      // console.log(resultApi, "接口调用成功");
      pix_path = resultApi.bankId;
      pix_copy = resultApi.pixCopiaECola;
      const bankName = resultApi.bankName;
      //写入数据库
      const result = await paydb.addPayFlow(
        payTotal,
        userID,
        payObs,
        payNum,
        payClient,
        pix_path,
        expiration,
        bankName,
        shopID
      );
      // 判断写入情况
      if (result) {
        return (ctx.body = {
          status: 200,
          msg: "Fluxo de pagamento adicionado com sucesso",
          data: { pix_path, pix_copy },
        });
      } else {
        return (ctx.body = {
          status: -5,
          msg: "Falha ao adicionar fluxo de pagamento",
        });
      }
    } else {
      // 调用失败
      return (ctx.body = {
        status: -6,
        msg: "Falha na chamada da interface do banco",
      });
    }
  } catch (error) {
    console.log(error, "error");
    return (ctx.body = {
      status: -7,
      msg: "Falha na chamada da interface do banco",
      error: error,
    });
  }
};

// 修改支付流水状态
exports.updatePayStatus = async (ctx) => {
  const payInfo = ctx.request.body;
  const payNum = payInfo.payNum;
  const payStatus = payInfo.payStatus;
  // 检查payStatus只能为1,2
  if (payStatus != 1 && payStatus != 2) {
    return (ctx.body = {
      status: -4,
      msg: "O status do pagamento só pode ser 1 ou 2",
    });
  }
  if (!payNum) {
    return (ctx.body = {
      status: -1,
      msg: "O número do pedido não pode ficar vazio",
    });
  }
  if (!payStatus) {
    return (ctx.body = {
      status: -2,
      msg: "O status do pagamento não pode ficar vazio",
    });
  }
  const result = await paydb.updatePayStatus(payNum, payStatus).then((res) => {
    return res;
  });
  if (result) {
    return (ctx.body = {
      status: 200,
      msg: "Status do pagamento modificado com sucesso",
    });
  } else {
    return (ctx.body = {
      status: -3,
      msg: "Falha ao modificar o status do pagamento",
    });
  }
};

// 查询支付状态
exports.getPayStatus = async (ctx) => {
  const pix_path = ctx.request.body.pix_path;
  // 调用银行接口查询支付状态
  // 0有效待付款ATIVA 1付款成功CONCLUIDA -1调用失败 2调用失败 2订单已过期 3订单已取消 4订单已退款
  // 返回结构{ status: 0, pixCopiaECola: response.data.pixCopiaECola }
  const res = await BBapi.getPayStatus(pix_path);
  if (res.status == 1) {
    // 返回付款成功
    // const amount_pay = data.info.amount_pay;
    paydb.updatePayStatus(pix_path, 0, res.payTotal);
    return (ctx.body = {
      status: 200,
      success: false,
      Payment: true,
      code: 200,
      msg: "Pagamento bem sucedido",
    });
  } else if (res.status == 0) {
    // 待付款状态
    // 检查是否过期
    const exp = await paydb.checkExpDate(pix_path);
    if (exp == 0) {
      return (ctx.body = {
        status: -1,
        msg: "O pedido não existe, verifique o banco de dados",
      });
    } else if (exp == 2) {
      //订单1️已过期，更新订单状态
      paydb.updatePayStatus(pix_path, 5, 0);
      //返回值
      //订单没过期返回正常订单
      return (ctx.body = {
        status: 200,
        success: false,
        payment: false,
        code: 200,
        msg: "expirado",
      });
    } else if (exp == 1) {
      //订单没过期返回正常订单
      return (ctx.body = {
        status: 200,
        success: true,
        payment: false,
        code: 200,
        msg: "consulta success",
        data: { pixCopiaECola: res.pixCopiaECola },
      });
    }
  }
};

// 获取支付流水列表
exports.getPayFlowList = async (ctx) => {
  // 先获取用户ID
  // 接着获取用户角色
  // 调用db/pay.js中的getPayFlowList方法
  // 返回结果
  const token = ctx.header.authorization;
  // 获取时间段
  // const time = ctx.request.query
  // 如果ctx.request.query存在，则解析出startTime和endTime
  let startTime = "";
  let endTime = "";
  if (ctx.request.query) {
    startTime = ctx.request.query.startTime;
    endTime = ctx.request.query.endTime;
  }
  // 截取掉Bearer和空格
  const tokenStr = token.substring(7);
  // 解析token,获取用户名
  const username = jwt.decode(tokenStr, config.secretKey).username; // 解密，获取payload
  // 根据用户名获取用户ID
  const user = await userdb.getUsershopID(username).then((res) => {
    console.log(res, "用户ID");
    return res;
  });
  const userID = user.userID;
  const shopID = user.shopID;
  // 根据用户ID获取用户角色
  const userRole = await userdb.getUserRoles(username).then((res) => {
    return res;
  });
  const currentPage = ctx.request.query.currentPage;
  const pageSize = ctx.request.query.pageSize;
  const query = ctx.request.query.search;
  // console.log(query, "query内容");
  // 调用db/pay.js中的getPayFlowList方法
  const result = await paydb
    .getPayList(
      userRole,
      userID,
      shopID,
      startTime,
      endTime,
      currentPage,
      pageSize,
      query
    )
    .then((res) => {
      return res;
    });

  if (result) {
    return (ctx.body = {
      status: 200,
      msg: "Lista obtida com sucesso",
      data: result,
    });
  } else {
    return (ctx.body = { status: -1, msg: "Lista obtida com falhado" });
  }
};

// 获取客户对账总金额和明细（分页）
exports.getPayTotalList = async (ctx) => {
  // 先获取用户ID
  // 接着获取用户角色
  // 调用db/pay.js中的getPayFlowList方法
  // 返回结果
  const token = ctx.header.authorization;
  // 获取时间段
  // const time = ctx.request.query
  // 如果ctx.request.query存在，则解析出startTime和endTime
  let startTime = "";
  let endTime = "";
  if (ctx.request.query) {
    startTime = ctx.request.query.startTime;
    endTime = ctx.request.query.endTime;
  }
  // 截取掉Bearer和空格
  const tokenStr = token.substring(7);
  // 解析token,获取用户名
  const username = jwt.decode(tokenStr, config.secretKey).username; // 解密，获取payload
  // 根据用户名获取用户ID
  const user = await userdb.getUsershopID(username).then((res) => {
    console.log(res, "用户ID");
    return res;
  });
  const userID = user.userID;
  const shopID = user.shopID;
  const currentPage = ctx.request.query.currentPage;
  const pageSize = ctx.request.query.pageSize;

  // 调用db/pay.js中的getPayTotalList方法
  const result = await paydb
    .getPayTotalList(userID, shopID, startTime, endTime, currentPage, pageSize)
    .then((res) => {
      return res;
    });

  if (result) {
    return (ctx.body = {
      status: 200,
      msg: "A lista de boletos de pagamento foi obtida com sucesso",
      data: result,
    });
  } else {
    return (ctx.body = {
      status: -1,
      msg: "Falha ao obter lista de comprovantes de pagamento",
    });
  }
};

// 获取客户时间段销售金额总计
exports.getPayShopTotal = async (ctx) => {
  const token = ctx.header.authorization;
  let startTime = "";
  let endTime = "";
  if (ctx.request.query) {
    startTime = ctx.request.query.startTime;
    endTime = ctx.request.query.endTime;
  }
  // 截取掉Bearer和空格
  const tokenStr = token.substring(7);
  // 解析token,获取用户名
  const username = jwt.decode(tokenStr, config.secretKey).username; // 解密，获取payload
  // 根据用户名确定是否有管理员权限
  const userRole = await userdb.getUserRoles(username).then((res) => {
    return res;
  });
  if (userRole != "admin") {
    return (ctx.body = { status: -1, msg: "Sem permissão" });
  } else {
    const result = await paydb
      .getPayShopTotal(startTime, endTime)
      .then((res) => {
        return res;
      });
    if (result) {
      return (ctx.body = {
        status: 200,
        msg: "A lista de boletos de pagamento foi obtida com sucesso",
        data: result,
      });
    } else {
      return (ctx.body = {
        status: -2,
        msg: "Falha ao obter lista de comprovantes de pagamento",
      });
    }
  }
};
