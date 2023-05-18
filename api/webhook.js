
// webhook功能，首先打印body
exports.webhookReceve = async ctx => {
    // 打印请求信息
    console.log(ctx.request.body)
    // 打印请求头
    console.log(ctx.request.header)

    ctx.body={status:200,msg:'ok'}

    console.log('post')
}

// 接收数据范例
// {
//     date_register: '2023-05-18 14:34:52',
//     date_update: '2023-05-18 16:47:12',
//     status: '0',
//     status_legend: '0: Recebido, 1: Pendente, 2: Parcial, 3: Cancelado, 4: Estornado',
//     description: 'Coca-cola',
//     email: 'suporte@suprem.cash',
//     amount_pay: '10.23',
//     amount: '10.23',
//     amount_wallet: '1.91',
//     pix_path: 'kk6g232xel65a0daee4dd13kk817745376',
//     pix_wallet: 'https://supremcash.s3.amazonaws.com/resources/supremcash/all/10acc91f018a1cfa10975e2bffc372ef.png',
//     pix_expiration: '1969-12-31 18:00:00',
//     debit_party: {
//       Account: '12345678',
//       Bank: '60746948',
//       Branch: '1469',
//       PersonType: 'NATURAL_PERSON',
//       TaxId: '89480669943',
//       AccountType: 'CACC',
//       Name: 'Natalja Test'
//     }
//   }
// 接收数据头范例
//   {
//     host: '201.93.162.198:8609',
//     accept: '*/*',
//     'content-length': '725',
//     'content-type': 'application/x-www-form-urlencoded'
//   }