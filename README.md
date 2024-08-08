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
  - index.js 分配路由访问到 api 文档中对应的接口
- app.js 启动文件
- config.js 配置文件
- .env 环境配置处
- certification 证书存放处，存放 crt 证书和 key

## .env

env 是敏感信息处，因此不上传到 git 中，请自行建立，内容为

#mysql 的连接方式
DB_HOST=
DB_USER=
DB_PASSWORD=n
DB_DATABASE=

#BBapi 的连接方式
API_Login=
API_HOST=
API_client_id=
API_client_secret=
API_developer_application_key=
API_BBchavepix=
API_BBbankName=

## 项目启动

-默认端口为 8609 -运行 app.js 文件
`node app.js` -访问接口 http://localhost:8609/api -外网 http://201.93.162.198:8609/api

## 本地测试

-mac 测试
