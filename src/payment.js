async function createPayment(){
 const err=new Error('Gateway QRIS belum dikonfigurasi.');
 err.code='PAYMENT_NOT_CONFIGURED';
 throw err;
}
function verifyWebhook(){ return false; }
module.exports={createPayment,verifyWebhook};
