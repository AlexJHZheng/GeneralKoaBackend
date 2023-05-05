const Router=require('koa-router')
const api_user=require('../api/user')
const api_pay=require('../api/pay')

const router = new Router({
    // prefix:'/api'  //路由前缀
    prefix:'/api'
})
// 注册接口路由
router.post('/register',api_user.register)
// 登录接口路由
router.post('/login',api_user.login)
// 添加支付流水路由
router.put('/addPayFlow',api_pay.addPayFlow)
// 修改支付流水状态路由
router.post('/updatePayFlow',api_pay.updatePayStatus)


router.get('/cauculator',api_user.cauculator)

router.get('/',async ctx=>{
    ctx.body='servece ok'
})


module.exports=router