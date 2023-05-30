# 通用后端文档
## 技术栈
-Node.js Koa
## 作者
-Alex
## 文件组成结构
- api 接口构成
  - user 用户接口
    - login 登录接口 -post
- db 数据库
  - index.js 数据库连接(mysql)
  - user.js 数据库操作方法
- router 路由
  - index.js 分配路由访问到api文档中对应的接口
- app.js 启动文件
- config.js 配置文件
## 项目启动
-默认端口为8609  
-运行app.js文件  
`node app.js`  
-访问接口 http://localhost:8609/api
-外网 http://201.93.162.198:8609/api

## 本地测试
-mac测试