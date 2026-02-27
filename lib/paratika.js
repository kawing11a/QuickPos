const crypto = require('crypto');

class TwoCheckoutClient {
    constructor(config) {
        const requiredFields = ['merchantCode', 'secretWord'];
        for (let field of requiredFields) {
            if (!config[field]) throw new Error(`Missing required field: ${field}`);
        }

        this.merchantCode = config.merchantCode;
        this.secretWord = config.secretWord;
        this.sandbox = config.sandbox || false;
    }

    generateHash(params, algo = 'md5') {
        let signatureString = '';

        Object.keys(params).forEach(key => {
            const value = String(params[key]); // Değer string olmalı
            if (value.length > 0) { // Boş değerler bazen hash'e katılmaz
                 signatureString += value.length + value;
            }
        });

        return crypto
            .createHmac(algo, this.secretWord)
            .update(signatureString)
            .digest('hex');
    }

    createPaymentUrl(options) {
        const orderId = options.orderId || `ORDER-${Date.now()}`;
        
        const params = {
            'merchant': this.merchantCode,
            'dynamic': '1', // Dinamik ürün modu
            'prod-name[]': options.name || 'Payment',
            'prod-type[]': 'GLOBAL_SERVICE', // Ürün tipi
            'prod-price[]': parseFloat(options.amount).toFixed(2),
            'prod-qty[]': '1',
            'currency': options.currency || 'USD',
            'return-type': 'redirect',
            'return-url': options.callbackUrl,
            'expiration': Math.floor(Date.now() / 1000) + 3600, // 1 saat geçerli
            'order-ext-ref': orderId,
            'customer-ref': options.customerId || '',
            'customer-email': options.email || ''
        };

        let signatureData = '';
        
        const keysToSign = [
            'merchant', 'dynamic', 'prod-name[]', 'prod-type[]', 'prod-price[]', 
            'prod-qty[]', 'currency', 'return-type', 'return-url', 'expiration', 
            'order-ext-ref', 'customer-ref', 'customer-email'
        ];
        
        keysToSign.forEach(key => {
            const val = String(params[key] || '');
            if(val) signatureData += val.length + val;
        });

        const signature = crypto.createHmac('md5', this.secretWord).update(signatureData).digest('hex');
        params['signature'] = signature;

        // URL Parametrelerini oluştur
        const queryParams = new URLSearchParams();
        Object.keys(params).forEach(key => queryParams.append(key, params[key]));

        return `https://secure.2checkout.com/order/checkout.php?${queryParams.toString()}`;
    }

    /**
     * IPN (Callback) Doğrulama
     * Bu kısım, sunucunuza gelen POST isteğini doğrular.
     */
    verifyCallback(postData) {
        try {
            // Gelen veriden HASH'i ayıralım
            const receivedHash = postData['HASH'];
            if (!receivedHash) {
                return { status: false, message: 'No hash found' };
            }

            let hashString = '';
            
            // 2Checkout, HASH parametresi hariç tüm parametreleri gönderdiği sırayla kullanır.
            for (let key in postData) {
                if (key !== 'HASH') {
                    const val = String(postData[key]);
                    hashString += val.length + val;
                }
            }

            const calculatedHash = crypto
                .createHmac('md5', this.secretWord) 
                .update(hashString)
                .digest('hex');

            if (calculatedHash === receivedHash) {
                const date = new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '');
                const responseHash = crypto.createHmac('md5', this.secretWord).update(postData.IPN_PID[0].length + postData.IPN_PID[0] + postData.IPN_PNAME[0].length + postData.IPN_PNAME[0] + postData.IPN_DATE.length + postData.IPN_DATE + date.length + date).digest('hex');
                
                return { 
                    status: true, 
                    transactionId: postData.REFNO,
                    orderStatus: postData.ORDERSTATUS,
                    raw: postData
                };
            } else {
                console.error("Hash Mismatch. Calculated:", calculatedHash, "Received:", receivedHash);
                return { status: false, message: 'Invalid hash signature' };
            }

        } catch (error) {
            return { status: false, message: error.message };
        }
    }
}

module.exports = TwoCheckoutClient;