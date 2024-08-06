const Joi = require("joi"); //验证模块
const userdb = require("../db/user");
const jwt = require("jsonwebtoken"); //token生成模块
const config = require("../config");

//引入BBapi模块
const BBapi = require("../api/BBapi");

exports.register = async (ctx) => {
  BBapi.getBB();
  //定义注册接口的验证规则
  const register_schema = Joi.object({
    username: Joi.string().alphanum().min(5).max(12).required(),
    password: Joi.string()
      .pattern(/^[\S]{6,15}$/)
      .required(),
  });
  //获取请求的用户信息，并解析出用户名和密码
  const userInfo = ctx.request.body;
  //验证
  const result = register_schema.validate(userInfo);
  if (result.error) {
    return (ctx.body = { status: 1, msg: result.error.message });
  }
  //验证用户名是否存在
  //   await userdb.checkUserName(userInfo.username).then(async (res) => {
  //     console.log("查询用户", userInfo.username);
  //     console.log("查询结果", res);
  // res为假表示用户名不存在，进行注册
  // if (!res) {
  //   userdb
  //     .register(userInfo.username, userInfo.password, userInfo.summary)
  //     .then((res) => {
  //       console.log("注册结果", res);
  //       if (res) {
  //         console.log("aqui");
  //         ctx.body = { status: 200, msg: "user cadastrado" };
  //         console.log(ctx);
  //         return ctx.body;
  //       } else {
  //         return (ctx.body = { status: -1, msg: "注册失败" });
  //       }
  //     });
  // }
  const checkUser = await userdb.checkUserName(userInfo.username);
  console.log("checkUser", checkUser);
  if (!checkUser) {
    const regUser = await userdb.register(
      userInfo.username,
      userInfo.password,
      userInfo.summary
    );
    console.log("regUser", regUser);
    if (regUser) {
      return (ctx.body = { status: 200, msg: "usario cadastrado" });
    } else {
      return (ctx.body = { status: -1, msg: "注册失败" });
    }
  } else {
    return (ctx.body = { status: -1, msg: "user is exited用户名已存在" });
  }
};

exports.login = async (ctx) => {
  //获取请求的用户信息，并解析出用户名和密码
  const userInfo = ctx.request.body;
  const username = userInfo.username;
  //用户名为空则返回用户名不能为空
  if (!username) {
    return (ctx.body = { status: -2, msg: "用户名不能为空" });
  }
  const password = userInfo.password;
  //密码为空则返回密码不能为空
  if (!password) {
    return (ctx.body = { status: -3, msg: "密码不能为空" });
  }
  //验证
  const result = await userdb.checkUserLogin(username, password).then((res) => {
    return res;
  });
  var res = "";
  console.log(result, "result");
  //result为0返回用户名密码错误
  if (result == 0) {
    res = { status: 1, msg: "用户名或密码错误" };
  }
  //result为-1返回用户被禁用
  if (result == -1) {
    res = { status: -1, msg: "用户被禁用" };
  }
  //获取用户权限,返回结果为数组
  const roles = await userdb.getUserRoles(username).then((res) => {
    return res;
  });
  //result为1返回登录成功
  if (result == 1) {
    const token = jwt.sign({ username: userInfo.username }, config.secretKey, {
      expiresIn: "3s",
    });
    const refreshToken = jwt.sign(
      { username: userInfo.username },
      config.refreshKey,
      { expiresIn: "30d" }
    );
    res = {
      status: 200,
      msg: "登录成功",
      token: token,
      refreshToken: refreshToken,
      name: userInfo.username,
      roles: [roles],
    };
  }
  ctx.body = res;
};

// 通过token获取用户信息
exports.getUserInfo = async (ctx) => {
  const token = ctx.header.authorization;
  //token不存在则返回token不存在
  if (!token) {
    return (ctx.body = { status: -1, msg: "token不存在" });
  }
  const userInfo = jwt.decode(token.split(" ")[1], config.secretKey);
  // 检测token是否过期
  if (Date.now() > userInfo.exp * 1000) {
    return (ctx.body = { status: 200, msg: "token已过期" });
  }
  const username = userInfo.username;
  const roles = await userdb.getUserRoles(username).then((res) => {
    return res;
  });
  ctx.body = {
    status: 200,
    msg: "获取用户信息成功",
    name: username,
    roles: [roles],
  };
};

// 通过refreshToken获取新的token
exports.refreshToken = async (ctx) => {
  const refreshToken = ctx.request.body.refreshToken;
  //refreshToken不存在则返回refreshToken不存在
  if (!refreshToken) {
    return (ctx.body = { status: -1, msg: "refreshToken不存在" });
  }
  const userInfo = jwt.decode(refreshToken, config.refreshKey);
  // 检测refreshToken是否过期
  if (Date.now() > userInfo.exp * 1000) {
    return (ctx.body = { status: -1, msg: "refreshToken已过期" });
  }
  const username = userInfo.username;
  const token = jwt.sign({ username: username }, config.secretKey, {
    expiresIn: "3s",
  });
  ctx.body = { status: 200, msg: "获取新的token成功", token: token };
};

// 接收token和refreshToken
// 首先检查token是否过期
// 如果token过期则检查refreshToken是否过期
// 如果refreshToken过期则返回refreshToken过期则返回tcode=0
// 如果refreshToken未过期则返回新的token加tcode=2
// 如果token未过期则返回tcode=1
exports.checkToken = async (ctx) => {
  const token = ctx.request.body.token;
  //token不存在则返回token不存在
  const userInfo = jwt.decode(token, config.secretKey);
  // 如果userInfo为null则表示token不存在
  // 检测token是否过期或者token不存在
  if (!userInfo || Date.now() > userInfo.exp * 1000) {
    const refreshToken = ctx.request.body.refreshToken;
    //refreshToken不存在则返回refreshToken不存在
    if (!refreshToken) {
      return (ctx.body = {
        status: 50008,
        msg: "refreshToken不存在",
        tokenCode: 0,
      });
    }
    const userInfo = jwt.decode(refreshToken, config.refreshKey);
    // 检测refreshToken是否过期
    if (!userInfo || Date.now() > userInfo.exp * 1000) {
      return (ctx.body = {
        status: 50008,
        msg: "refreshToken已过期",
        tokenCode: 0,
      });
    }
    const username = userInfo.username;
    const token = jwt.sign({ username: username }, config.secretKey, {
      expiresIn: "3s",
    });
    return (ctx.body = {
      status: 200,
      msg: "获取新的token成功",
      tokenCode: 2,
      token: token,
    });
  } else {
    return (ctx.body = { status: 200, msg: "token未过期", tokenCode: 1 });
  }
};
