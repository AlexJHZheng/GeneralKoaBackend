const axios = require("axios"); //axios模块
const paydb = require("../db/pay");

// webhook功能，首先打印body
exports.webhookReceve = async (ctx) => {
  // 打印请求信息
  // console.log(ctx.request.body)
  // 打印请求头
  // console.log(ctx.request.header)
  //实际应收金额
  const amout = ctx.request.body.amount;
  //实际付款金额
  const amount_pay = ctx.request.body.amount_pay;
  // 0: Recebido, 1: Pendente, 2: Parcial, 3: Cancelado, 4: Estornado
  const status = ctx.request.body.status;
  const pix_path = ctx.request.body.pix_path;
  //判断status的值，是0，2，3，4则更新到数据库中
  if (status == 0 || status == 2 || status == 3 || status == 4) {
    paydb.updatePayStatus(pix_path, status, amount_pay);
  }
  ctx.body = { status: 200, msg: "ok" };
};

// webhook BB 巴西银行
exports.webhookBB = async (ctx) => {
  // 打印请求信息
  const timenow = new Date();
  console.log(
    timenow +
      "收到银行回复订单号" +
      ctx.request.body.pix[0].txid +
      "，金额" +
      ctx.request.body.pix[0].valor +
      "收款成功"
  );
  // 打印请求头
  // console.log(ctx.request.header, "请求头");
  const body = ctx.request.body.pix;
  const good = 0;
  const bad = 0;
  //写个for循环遍历body
  for (i = 0; i < body.length; i++) {
    const pix_path = body[i].txid;
    const valor = body[i].componentesValor.original.valor;
    const received = body[i].valor;
    if (valor != received) {
      console.log("金额不一致");
      bad++;
    } else {
      paydb.updatePayStatus(pix_path, 1, received);
      good++;
      // return (ctx.body = { status: 200, msg: "ok" });
    }
  }
  console.log("成功更新" + good + "条数据" + "，失败" + bad + "条数据");
  return (ctx.body = { status: 200, msg: "good=" + good + ",bad=" + bad });
};

// 接收数据范例
// {
//     date_register: '2023-05-18 14:34:52',
//     date_update: '2023-05-18 16:47:12',
//     status: '0',
//     status_legend: '0: Recebido, 1: Pendente, 2: Parcial, 3: Cancelado, 4: Estornado',
//     description: 'Coca-cola',
//     email: 'suporte@suprem.cash',
//     amount_pay: '10.23',
//     amount: '10.23',
//     amount_wallet: '1.91',
//     pix_path: 'kk6g232xel65a0daee4dd13kk817745376',
//     pix_wallet: 'https://supremcash.s3.amazonaws.com/resources/supremcash/all/10acc91f018a1cfa10975e2bffc372ef.png',
//     pix_expiration: '1969-12-31 18:00:00',
//     debit_party: {
//       Account: '12345678',
//       Bank: '60746948',
//       Branch: '1469',
//       PersonType: 'NATURAL_PERSON',
//       TaxId: '89480669943',
//       AccountType: 'CACC',
//       Name: 'Natalja Test'
//     }
//   }
// 接收数据头范例
//   {
//     host: '201.93.162.198:8609',
//     accept: '*/*',
//     'content-length': '725',
//     'content-type': 'application/x-www-form-urlencoded'
//   }

// 注册webhook
exports.registerWebhook = async (ctx) => {
  const postData = {
    token_api:
      "MhbdYZ0X0JRhFJfJtob9kvr45kzQxQMZdgIUYTnytQcRE2hEJ4vsxmI4nqWEAEAgs5dtzfYGmmQhupQ8BzyDsoRk6SZ9TXE3BdH273p8QDEWhul7kk7ztwm5tOv75BVr",
    service: "collection-pix",
    url: "https://pixpagar.com/api/webhook",
  };

  const response = await axios.post(
    "https://demoapi.suprem.cash/webhook/set",
    postData
  );
  const data = response.data;
  if (data.success) {
    return (ctx.body = { status: 200, msg: "webhook注册成功", data: { data } });
  } else {
    return (ctx.body = { status: -1, msg: "webhook注册失败", data: { data } });
  }
};
