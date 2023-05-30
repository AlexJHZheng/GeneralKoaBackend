const Router=require('koa-router')
const api_user=require('../api/user')
const api_pay=require('../api/pay')
const api_weebhook=require('../api/webhook')

const router = new Router({
    // prefix:'/api'  //路由前缀
    prefix:'/api'
})
//webhook接口路由
router.post('/webhook',api_weebhook.webhookReceve)
// 注册接口路由
router.post('/register',api_user.register)
// 登录接口路由
router.post('/login',api_user.login)
// 添加支付流水路由
router.put('/addPayFlow',api_pay.addPayFlow)
// 修改支付流水状态路由
router.post('/updatePayFlow',api_pay.updatePayStatus)
// 通过token获取用户信息
router.get('/getUserInfo',api_user.getUserInfo)

// 通过token刷新token
router.post('/refreshToken',api_user.refreshToken)

// 核验token和refreshToken是否过期
router.post('/checkToken',api_user.checkToken)

// 获取支付流水列表
router.get('/getPayFlowList',api_pay.getPayFlowList)

router.get('/',async ctx=>{
    ctx.body='servece ok 182555'
})


module.exports=router