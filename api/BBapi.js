const axios = require("axios"); //axios模块
require("dotenv").config(); //导入环境变量
const https = require("https");
const bb = require("../db/bb"); //导入bb数据库
const agent = new https.Agent({
  rejectUnauthorized: false, // 不验证证书
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
  const res = await bb.updateToken(data);
  return res.access_token;
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
    await this.loginBB();
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
    console.log(response, "response");
    if (response.status === 200) {
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
        bankName: "BBTest",
      };
    } else {
      console.log("银行接口调用失败");
      return { check: false };
    }
  } catch (err) {
    console.error("Error making request:", error);
    if (error.response) {
      console.error("Response data:", error.response.data);
      console.error("Response status:", error.response.status);
      console.error("Response headers:", error.response.headers);
    } else if (error.request) {
      console.error("No response received:", error.request);
    } else {
      console.error("Error setting up request:", error.message);
    }
  }
};
