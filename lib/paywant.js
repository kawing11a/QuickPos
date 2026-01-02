const crypto = require('crypto');
const axios = require('axios');

class Paywant {
  /**
   * Paywant Kurucu Metodu
   * @param {Object} config
   * @param {string} config.apiKey - Paywant API Anahtarı
   * @param {string} config.apiSecret - Paywant Gizli Anahtar
   */
  constructor(config) {
    if (!config.apiKey || !config.apiSecret) {
      throw new Error('Paywant: apiKey ve apiSecret zorunludur.');
    }
    this.apiKey = config.apiKey;
    this.apiSecret = config.apiSecret;
    this.baseUrl = 'https://secure.paywant.com';
  }

  /**
   * Ödeme Linki Oluşturma (/payment/token)
   * @param {Object} params
   */
  async createPayment(params) {
    try {
      // Zorunlu alan kontrolü
      const required = ['userID', 'userEmail', 'userAccountName', 'userIp', 'productData'];
      for (const field of required) {
        if (!params[field]) throw new Error(`Paywant: ${field} alanı zorunludur.`);
      }

      // 1. Hash Oluşturma (Dokümantasyona Göre)
      // Sıralama: userName|userEmail|userID + ApiKey
      const hashString = `${params.userAccountName}|${params.userEmail}|${params.userID}${this.apiKey}`;
      const hash = this.generateHash(hashString);

      // 2. API'ye Gönderilecek Veri
      const payload = {
        apiKey: this.apiKey,
        userAccountName: params.userAccountName,
        userEmail: params.userEmail,
        userID: parseInt(params.userID), // int64 olmalı
        userIPAddress: params.userIp,
        hash: hash,
        proApi: true, // Ürün verisini biz gönderiyoruz
        productData: {
          name: params.productData.name, // Ürün adı
          amount: parseFloat(params.productData.amount), // Tutar (100.00 gibi)
          extraData: params.productData.extraData || '', // Sipariş No vb.
          paymentChannel: params.productData.paymentChannel || '0', // 0 = Hepsi
          commissionType: params.productData.commissionType || '1' // 1: Müşteri, 2: Mağaza öder
        }
      };

      // 3. İsteği Gönder
      const response = await axios.post(`${this.baseUrl}/payment/token`, payload, {
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const result = response.data;

      if (result.status === true) {
        // Başarılı ise ödeme linkini döndür
        return {
          status: 'success',
          link: result.message // Örn: https://secure.paywant.com/common/TOKEN
        };
      } else {
        // Paywant'tan dönen hata
        throw new Error(result.message || 'Paywant ödeme oluşturulamadı.');
      }

    } catch (error) {
      if (error.response) {
        throw new Error(`Paywant API Hatası: ${JSON.stringify(error.response.data)}`);
      }
      throw error;
    }
  }

  /**
   * IPN (Bildirim) Doğrulama
   * Paywant'tan gelen POST isteğini doğrular.
   * @param {Object} reqBody - Express request body
   */
  handleCallback(reqBody) {
    const {
      transactionID,
      extraData,
      userID,
      userAccountName,
      status,
      paymentChannel,
      paymentTotal,
      netProfit,
      hash
    } = reqBody;

    if (!hash) throw new Error('Hash parametresi eksik.');

    // Dokümantasyondaki IPN Hash Formülü:
    // transactionID|extraData|userID|userAccountName|status|paymentChannel|paymentTotal|netProfit + ApiKey
    const hashString = `${transactionID}|${extraData}|${userID}|${userAccountName}|${status}|${paymentChannel}|${paymentTotal}|${netProfit}${this.apiKey}`;
    
    const generatedHash = this.generateHash(hashString);

    if (hash === generatedHash) {
      // Status 100 = Başarılı
      if (parseInt(status) === 100) {
        return {
          status: 'success',
          orderId: extraData, // Genelde sipariş no extraData'ya konur
          transactionId: transactionID,
          amount: parseFloat(paymentTotal),
          netAmount: parseFloat(netProfit)
        };
      } else {
        return { success: false, message: 'Ödeme başarısız veya beklemede.' };
      }
    } else {
      throw new Error('Hash uyuşmazlığı (Bad Hash)');
    }
  }

  /**
   * HMAC-SHA256 Hash Üretici (Base64)
   */
  generateHash(data) {
    return crypto.createHmac('sha256', this.apiSecret)
      .update(data)
      .digest('base64');
  }
}

module.exports = Paywant;