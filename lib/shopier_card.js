const crypto = require('crypto');

class Shopier {
  /**
   * @param {Object} config
   * @param {string} config.apiKey - Shopier API Key
   * @param {string} config.apiSecret - Shopier API Secret
   */
  constructor(config) {
    this.config = config || {};
    const requiredFields = ['apiKey', 'apiSecret', 'website'];
    
    for (let field of requiredFields) {
      if (!config[field]) throw new Error(`Shopier: Missing required config field: ${field}`);
    }

    this.apiKey = config.apiKey;
    this.websiteIndex = Number(config.website);
    this.apiSecret = config.apiSecret;
    this.paymentUrl = 'https://www.shopier.com/ShowProduct/api_pay4.php';
    this.moduleVersion = '1.0.4';
  }

  /**
   * Ödeme Formunu Oluşturur
   * @param {Object} paymentDetails
   * @param {number} paymentDetails.amount - Ödenecek tutar (Örn: 15.50)
   * @param {string} paymentDetails.currency - Para birimi (TRY, USD, EUR) varsayılan: TRY
   * @param {string} paymentDetails.orderId - Sipariş numarası (Benzersiz olmalı)
   * @param {Object} paymentDetails.buyer - Alıcı bilgileri { first_name, last_name, email, phone, id_nr }
   * @param {Object} paymentDetails.billingAddress - Fatura adresi { address, city, country, postcode }
   * @param {Object} paymentDetails.shippingAddress - Teslimat adresi { address, city, country, postcode }
   */
  createPayment(paymentDetails) {
    try {
      // 1. Temel Doğrulamalar
      if (!paymentDetails.amount) throw new Error('Shopier: Amount is required');
      if (!paymentDetails.buyer) throw new Error('Shopier: Buyer information is required');
      if (!paymentDetails.billingAddress) throw new Error('Shopier: Billing address is required');
      if (!paymentDetails.shippingAddress) throw new Error('Shopier: Shipping address is required');

      const currency = paymentDetails.currency || 'TRY';
      const currentLang = 0; // 0: TR, 1: EN (Otomatik TR ayarlandı, isteğe göre parametreye bağlanabilir)
      const randomNr = Math.floor(Math.random() * (999999 - 100000 + 1)) + 100000;
      
      // Sipariş ID yoksa rastgele oluştur
      const platformOrderId = paymentDetails.orderId || `Ord-${randomNr}`;

      // 2. Shopier İçin Argümanları Hazırla
      const args = {
        API_key: this.apiKey,
        website_index: this.websiteIndex || 0,
        platform_order_id: platformOrderId,
        product_name: paymentDetails.product_name || 'Balance Payment',
        product_type: 0, // 0: Reel nesne, 1: Sanal
        buyer_name: paymentDetails.buyer.first_name,
        buyer_surname: paymentDetails.buyer.last_name,
        buyer_email: paymentDetails.buyer.email,
        buyer_account_age: 0,
        buyer_id_nr: paymentDetails.buyer.id_nr || '0', // Opsiyonel ID
        buyer_phone: paymentDetails.buyer.phone,
        
        // Fatura
        billing_address: paymentDetails.billingAddress.address,
        billing_city: paymentDetails.billingAddress.city,
        billing_country: paymentDetails.billingAddress.country,
        billing_postcode: paymentDetails.billingAddress.postcode,
        
        // Teslimat
        shipping_address: paymentDetails.shippingAddress.address,
        shipping_city: paymentDetails.shippingAddress.city,
        shipping_country: paymentDetails.shippingAddress.country,
        shipping_postcode: paymentDetails.shippingAddress.postcode,
        
        total_order_value: paymentDetails.amount,
        currency: this._mapCurrency(currency),
        platform: 0,
        is_in_frame: 0,
        current_language: currentLang,
        modul_version: this.moduleVersion,
        random_nr: randomNr
      };

      // 3. Eksik Alan Kontrolü
      Object.keys(args).forEach(key => {
        if (args[key] === undefined || args[key] === null) {
           // Opsiyonel alanlar için esneklik sağlanabilir ama kritik alanlar için hata fırlatıyoruz
           // throw new Error(`Shopier: Parameter ${key} is missing`);
        }
      });

      // 4. İmza Oluşturma (Native Crypto)
      const dataToSign = args.random_nr + args.platform_order_id + args.total_order_value + args.currency;
      const signature = crypto.createHmac('sha256', this.apiSecret)
                              .update(dataToSign)
                              .digest('base64');

      args.signature = signature;

      // 5. HTML Formunu Oluştur
      const formHtml = this._generateHtml(args);

      return {
        status: 'success',
        data: {
          orderId: platformOrderId,
          amount: paymentDetails.amount,
          html: formHtml // Frontend'de bu HTML'i ekrana basıp formu submit edeceksin
        }
      };

    } catch (error) {
       throw new Error(`Error in Shopier payment creation: ${error.message}`);
    }
  }

  /**
   * Callback (Geri Dönüş) İşleme
   * @param {Object} body - POST request body
   */
  handleCallback(body) {
    try {
      const data = body.random_nr + body.platform_order_id;
      // Gelen imza base64, bunu normal stringe çevirip karşılaştırmalıyız ya da direkt ürettiğimizi karşılaştırmalıyız.
      // Shopier dökümantasyonuna göre: HmacSHA256(random_nr + platform_order_id, secret) == signature (base64)
      
      const expectedSignature = crypto.createHmac('sha256', this.apiSecret)
                                      .update(data)
                                      .digest('base64');

      if (body.signature === expectedSignature) {
        if (body.status === 'success') {
          return {
            success: true,
            order_id: body.platform_order_id,
            payment_id: body.payment_id,
            installment: body.installment,
            random_nr: body.random_nr
          };
        } else {
          return { success: false, message: "Shopier: Payment status is not success." };
        }
      } else {
        throw new Error('Shopier: Signature mismatch. Invalid callback.');
      }
    } catch (error) {
      throw new Error(`Error in Shopier callback handling: ${error.message}`);
    }
  }

  // --- Private Helpers ---

  _generateHtml(args) {
    let inputs = '';
    Object.keys(args).forEach(key => {
      inputs += `<input type="hidden" name="${key}" value="${args[key]}">`;
    });

    return `<!doctype html>
    <html lang="tr">
    <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, user-scalable=no, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0">
    <title>Ödeme Yapılıyor...</title>
    </head>
    <body>
      <form id="shopier_payment_form" method="post" action="${this.paymentUrl}">
        ${inputs}
      </form>
      <script type="text/javascript">
        document.getElementById("shopier_payment_form").submit();
      </script>
    </body>
    </html>`;
  }

  _mapCurrency(currency) {
    switch(currency) {
      case 'TL':
      case 'TRY': return 0;
      case 'USD': return 1;
      case 'EUR': return 2;
      default: return 0;
    }
  }
}

module.exports = Shopier;