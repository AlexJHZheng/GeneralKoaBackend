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

exports.getBB = async (ctx) => {
  //首先从db.bb.js中获取token
  const token = await bb.getToken();
  console.log(token, "token");
  //获取注册时间
  const criar_time = new Date(token.criar_time).getTime();
  //判断token有没有过期
  const now = new Date().getTime();
  const expires_in = criar_time + token.expires_in * 1000;
  if (now > expires_in) {
    //过期了，重新获取token
    console.log("token vencido");
    await this.loginBB();
  } else {
    //没有过期，直接返回token
    console.log("token valido");
    return token.access_token;
  }
};
