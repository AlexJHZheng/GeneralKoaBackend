const Koa = require('koa') 
const cors = require('koa2-cors')
const bodyParser = require('koa-bodyparser')
const user_router=require('./router/index')
const koaJWT = require('koa-jwt') //token解密模块
const config = require('./config')

const app =new Koa() //项目入口

// 除了这个地址，其他的URL都需要验证
app.use(koaJWT({ secret: config.secretKey }).unless({ path: [/^\/api\/(login|refresh)/] }))

// 错误处理
const errFn=async (ctx,next)=>{
    try{
        await next()
    }catch(err){
        //错误
        ctx.body={status:1,msg:err.message}
    }
}


app.use(errFn) //错误处理
app.use(cors()) //跨域
app.use(bodyParser()) //解析接口传递body
app.use(user_router.routes()) //注册路由

app.listen(8609,()=>{ //端口
    console.log('服务器启动成功')
})