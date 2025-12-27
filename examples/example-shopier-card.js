const Shopier = require('../lib/shopier_card'); // Dosya yolu

// 1. Başlatma (Config)
const shopier = new Shopier({
  website: '1',
  apiKey: 'XXXXX',
  apiSecret: 'XXXXXX'
});

// 2. Ödeme Oluşturma (Tüm veriler tek nesnede)
const run = async () => {
    try {
        const result = shopier.createPayment({
            amount: 25.50,
            currency: 'EUR', // Opsiyonel, varsayılan: TRY, DESTEKLENEN: TRY, USD, EUR
            orderId: `TEST-${Math.floor(Math.random() * 1000000)}`, // Opsiyonel
            product_name: 'Bakiye Yükleme',
            buyer: {
                first_name: 'Ahmet',
                last_name: 'Yılmaz',
                email: 'ahmet@mail.com',
                phone: '05555555555',
                id_nr: '11111111111'
            },
            billingAddress: {
                address: 'Kadikoy Sokak No 1',
                city: 'Istanbul',
                country: 'Turkiye',
                postcode: '34000'
            },
            shippingAddress: {
                address: 'Kadikoy Sokak No 1',
                city: 'Istanbul',
                country: 'Turkiye',
                postcode: '34000'
            }
        });

        // result.data.html -> Bu HTML string'i frontend'e (res.send) olarak dönmelisin.
        console.log(result.data.html); 
        return result;
    } catch (err) {
        console.error(err);
    }
};
const app = require('express')();
app.use(require('body-parser').urlencoded({ extended: false }));
app.use(require('body-parser').json());

app.get('/', async (req, res) => {
    let result = await run();
    res.send(result.data.html); // Ödeme formunu gönder
});

app.listen(81, () => {
    console.log('Server running on http://localhost:81');
});

// 3. Callback (Webhook) İşleme
// app.post('/callback/shopier', (req, res) => {
//    try {
//       const verified = shopier.handleCallback(req.body);
//       if(verified.success) {
//          // Siparişi onayla
//       }
//    } catch(e) { ... }
// });