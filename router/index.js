const Router=require('koa-router')
const api_user=require('../api/user')

const router = new Router({
    prefix:'/api'  //路由前缀
})

router.post('/register',api_user.register)

router.post('/login',api_user.login)

router.get('/cauculator',api_user.cauculator)

router.get('/',async ctx=>{
    ctx.body='servece ok'
})


module.exports=router