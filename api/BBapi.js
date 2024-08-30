const axios = require("axios"); //axios模块
require("dotenv").config(); //导入环境变量
const https = require("https");
const bb = require("../db/bb"); //导入bb数据库
const fs = require("fs");

//引用根目录下certification文件夹下的certificate.crt
// const cert = fs.readFileSync("../certification/certificate.crt");
const path = require("path");
const cert = fs.readFileSync(
  path.join(__dirname, "../certification/certificate.crt"),
  "utf8"
);
const key = fs.readFileSync(
  path.join(__dirname, "../certification/privatenopass.key"),
  "utf8"
);
// const ca = fs.readFileSync(
//   path.join(__dirname, "../certification/ca.crt"),
//   "utf8"
// );

// 创建https.Agent实例
const agent = new https.Agent({
  cert: cert,
  key: key,
  // ca: ca,
  rejectUnauthorized: false, // 确保启用服务器证书验证
});

// 1.通过登陆接口获取token
exports.loginBB = async (ctx) => {
  //从环境变量中获取用户名和密码;
  const username = process.env.API_client_id;
  const password = process.env.API_client_secret;
  const loginlink = process.env.API_Login;
  const auth = Buffer.from(`${username}:${password}`).toString("base64");
  const postData = {
    grant_type: "client_credentials",
    // scope: "",
  };
  const response = await axios.post(loginlink, postData, {
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    httpsAgent: agent, // 使用自定义的 HTTPS Agent
  });
  //调用数据库方法，更新token
  const data = {
    access_token: response.data.access_token,
    criar_time: new Date(),
    expires_in: response.data.expires_in,
    scope: response.data.scope,
  };
  await bb.updateToken(data);
  return response.data.access_token;
};

// 2.获取token,如果token过期，通过loginBB方法重新获取token
exports.getBB = async (ctx) => {
  //首先从db.bb.js中获取token
  const token = await bb.getToken();
  //获取注册时间
  const criar_time = new Date(token.criar_time).getTime();
  //判断token有没有过期
  const now = new Date().getTime();
  const expires_in = criar_time + (token.expires_in - 120) * 1000;
  if (now > expires_in) {
    //过期了，重新获取token
    const res = await this.loginBB();
    return res;
  } else {
    //没有过期，直接返回token
    return token.access_token;
  }
};

// 3.获取QRCode二维码接口
exports.getQRCode = async (expiration, payTotal, userID) => {
  const token = await this.getBB(); //获取token
  const link = process.env.API_HOST; //获取环境变量中的api地址
  //获取环境变量中的chavepix
  const chavepix = process.env.API_BBchavepix;
  // 必要参数 expiration: 过期时间-分钟
  // payTotal：订单金额

  //json格式的body
  const body = {
    calendario: {
      expiracao: expiration * 60,
    },
    valor: {
      original: payTotal,
    },
    chave: chavepix,
    solicitacaoPagador: "QRpix" + userID,
  };
  try {
    const response = await axios.post(link, body, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json", // 指定请求体的格式为 JSON
        "X-Developer-Application-Key":
          process.env.API_developer_application_key,
      },
      httpsAgent: agent, // 使用自定义的 HTTPS Agent
    });
    //如果返回值为200，返回二维码链接
    if (response.status === 200 || response.status === 201) {
      // txid为银行流水唯一标识
      // 返回标准形式 创建时间，过期时间，金额，银行id，状态，pix码，银行名称
      // create_time,expiration,valor,bankId,status,pixCopiaECola，bankName
      return {
        check: true,
        creat_time: response.data.calendario.criacao,
        expiration: response.data.calendario.expiracao,
        valor: response.data.valor.original,
        bankId: response.data.txid,
        status: response.data.status,
        pixCopiaECola: response.data.pixCopiaECola,
        bankName: process.env.API_BBbankName,
      };
    } else {
      console.log("银行接口调用失败");
      return { check: false };
    }
  } catch (err) {
    console.error("Error making request:", err);
    if (err.response) {
      console.error("Response data:", err.response.data);
      console.error("Response status:", err.response.status);
      console.error("Response headers:", err.response.headers);
    } else if (err.request) {
      console.error("No response received:", err.request);
    } else {
      console.error("Error setting up request:", err.message);
    }
  }
};

// 4.获取当前pix的付款情况
exports.getPayStatus = async (pix_path) => {
  const token = await this.getBB(); //获取token
  const link = process.env.API_HOST + "/" + pix_path; //获取环境变量中的api地址
  // 调用接口
  try {
    const response = await axios.get(link, {
      headers: {
        Authorization: `Bearer ${token}`,
        "X-Developer-Application-Key":
          process.env.API_developer_application_key,
      },
      httpsAgent: agent, // 使用自定义的 HTTPS Agent
    });
    //如果返回值为200，返回二维码链接
    if (response.status === 200) {
      // txid为银行流水唯一标识
      // 返回标准形式 创建时间，过期时间，金额，银行id，状态，pix码，银行名称
      // create_time,expiration,valor,bankId,status,pixCopiaECola，bankName
      if (response.data.status === "CONCLUIDA") {
        return { status: 1, payTotal: response.data.pix[0].valor };
      } else {
        return {
          status: 0,
          pixCopiaECola: response.data.pixCopiaECola,
          payTotal: response.data.valor.original,
        };
      }
    } else {
      console.log("BB查询接口调用失败");
      return -1;
    }
  } catch (err) {
    console.error("BB查询接口出错:", error);
    return -1;
  }
};
