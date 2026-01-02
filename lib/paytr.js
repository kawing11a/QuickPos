const crypto = require('crypto');
const axios = require('axios');

class PayTR {
  constructor(config) {
    this.config = config || {};
    
    const requiredFields = ['merchantId', 'merchantKey', 'merchantSalt'];
    for (let field of requiredFields) {
      if (!this.config[field]) throw new Error(`Missing required field: ${field}`);
    }

    this.merchantId = this.config.merchantId;
    this.merchantKey = this.config.merchantKey;
    this.merchantSalt = this.config.merchantSalt;
    this.testMode = this.config.testMode ? '1' : '0';
    this.debugOn = this.config.debugOn ? '1' : '0';

    this.iframe = {
      createToken: this.createIframeToken.bind(this)
    };

    this.direct = {
      createPayment: this.createDirectPayment.bind(this)
    };

    this.link = {
      createPayment: this.createLinkPayment.bind(this)
    };
  }

  async createLinkPayment(paymentDetails) {
    try {
      const requiredFields = ['name', 'amount', 'currency', 'maxInstallment', 'expiry_date'];
      for (let field of requiredFields) {
        if (!paymentDetails[field]) throw new Error(`Missing required data: ${field}`);
      }
      
      const price = Math.round(paymentDetails.amount * 100).toString();
      const linkType = paymentDetails.linkType || 'product';
      const currency = paymentDetails.currency || 'TL';
      const lang = paymentDetails.lang || 'tr';
      const minCount = paymentDetails.min_count || '1';

      const required = paymentDetails.name + price + currency + paymentDetails.maxInstallment + linkType + lang + minCount;
      const paytrToken = this.generateToken(required);

      const formData = {
        merchant_id: this.merchantId,
        name: paymentDetails.name,
        price: price,
        currency: currency,
        max_installment: paymentDetails.maxInstallment,
        link_type: linkType,
        lang: lang,
        min_count: minCount,
        paytr_token: paytrToken,
        expiry_date: paymentDetails.expiry_date,
        get_qr: '1',
        max_count: Number(paymentDetails.max_count) || '1',
        debug_on: this.debugOn
      };

      const optionalData = ['email', 'callback_link', 'callback_id'];
      for (let data of optionalData) { 
        if(paymentDetails[data]) formData[data] = paymentDetails[data]; 
      }

      const response = await axios({
        method: 'POST',
        url: 'https://www.paytr.com/odeme/api/link/create',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        data: new URLSearchParams(formData).toString()
      });

      const responseData = response.data;

      if (responseData.status === 'success') {
        return {
          status: 'success',
          data: {
            transactionId: responseData.id,
            url: responseData.link,
            id: responseData.id,
            qr: responseData.base64_qr
          }
        };
      } else {
        throw new Error(responseData.reason || 'Unknown error occurred');
      }
    } catch (error) {
      if (error.response) {
        throw new Error(`PayTR API error: ${error.response.data.reason || error.response.statusText}`);
      }
      throw error;
    }
  }

  async createDirectPayment(params) {
    try {
      const userBasket = JSON.stringify(params.userBasket);
      const userIp = params.userIp;
      const merchantOid = params.merchantOid;
      const email = params.email;
      const paymentAmount = params.paymentAmount.toString();
      const currency = params.currency || 'TL';
      const installmentCount = params.installmentCount || '0';
      const paymentType = 'card';
      const non3D = params.non3D ? params.non3D : '0'; 

      const rawString = `${this.merchantId}${userIp}${merchantOid}${email}${paymentAmount}${paymentType}${installmentCount}${currency}${this.testMode}${non3D}`;
      const paytrToken = this.generateToken(rawString);

      const formData = new URLSearchParams();
      formData.append('merchant_id', this.merchantId);
      formData.append('user_ip', userIp);
      formData.append('merchant_oid', merchantOid);
      formData.append('email', email);
      formData.append('payment_amount', paymentAmount);
      formData.append('paytr_token', paytrToken);
      formData.append('user_basket', userBasket);
      formData.append('debug_on', this.debugOn);
      formData.append('test_mode', this.testMode);
      formData.append('payment_type', paymentType);
      formData.append('installment_count', installmentCount);
      formData.append('currency', currency);
      formData.append('non_3d', non3D);
      formData.append('cc_owner', params.cardOwner);
      formData.append('card_number', params.cardNumber);
      formData.append('expiry_month', params.cardExpireMonth);
      formData.append('expiry_year', params.cardExpireYear);
      formData.append('cvc', params.cardCvc);
      formData.append('user_name', params.userName);
      formData.append('user_address', params.userAddress);
      formData.append('user_phone', params.userPhone);
      formData.append('merchant_ok_url', params.merchantOkUrl);
      formData.append('merchant_fail_url', params.merchantFailUrl);

      const response = await axios({
        method: 'POST',
        url: 'https://www.paytr.com/odeme/api/direct',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        data: formData
      });

      const result = response.data;

      if (result.status === 'success') {
        return result; 
      } else {
        throw new Error(result.reason || 'PayTR Direct API Hatası');
      }
    } catch (error) {
       if (error.response) throw new Error(`PayTR API Error: ${error.response.data.reason || error.response.statusText}`);
      throw error;
    }
  }

  async createIframeToken(params) {
    try {
      const userBasket = JSON.stringify(params.userBasket);
      const userIp = params.userIp;
      const merchantOid = params.merchantOid;
      const email = params.email;
      const paymentAmount = params.paymentAmount.toString();
      const currency = params.currency || 'TL';
      const noInstallment = params.noInstallment ? '1' : '0';
      const maxInstallment = params.maxInstallment || '0';
      const paymentType = params.paymentType || 'card';

      let rawString;
      
      // DÜZELTME BURADA YAPILDI:
      if (paymentType === 'eft') {
        // Python örneğindeki EFT Hash yapısı:
        // merchant_id + user_ip + merchant_oid + email + payment_amount + payment_type + test_mode
        rawString = `${this.merchantId}${userIp}${merchantOid}${email}${paymentAmount}${paymentType}${this.testMode}`;
      } else {
        // Standart Kredi Kartı Hash yapısı:
        // merchant_id + user_ip + merchant_oid + email + payment_amount + user_basket + no_installment + max_installment + currency + test_mode
        rawString = `${this.merchantId}${userIp}${merchantOid}${email}${paymentAmount}${userBasket}${noInstallment}${maxInstallment}${currency}${this.testMode}`;
      }

      // generateToken fonksiyonu sonuna merchantSalt ekleyip şifreler
      const paytrToken = this.generateToken(rawString);

      const formData = new URLSearchParams();
      formData.append('merchant_id', this.merchantId);
      formData.append('user_ip', userIp);
      formData.append('merchant_oid', merchantOid);
      formData.append('email', email);
      formData.append('payment_amount', paymentAmount);
      formData.append('paytr_token', paytrToken);
      formData.append('debug_on', this.debugOn);
      formData.append('test_mode', this.testMode);
      formData.append('payment_type', paymentType);
      
      // timeout_limit parametresi (Python kodunda vardı, ekleyelim)
      formData.append('timeout_limit', params.timeoutLimit || '30');

      // EFT değilse diğer parametreleri de ekleyelim
      if (paymentType !== 'eft') {
        formData.append('user_basket', userBasket);
        formData.append('no_installment', noInstallment);
        formData.append('max_installment', maxInstallment);
        formData.append('user_name', params.userName);
        formData.append('user_address', params.userAddress);
        formData.append('user_phone', params.userPhone);
        formData.append('merchant_ok_url', params.merchantOkUrl);
        formData.append('merchant_fail_url', params.merchantFailUrl);
        formData.append('currency', currency);
        if (params.lang) formData.append('lang', params.lang);
      } else {
        // EFT ise banka parametresi varsa ekle
        if (params.bank) formData.append('bank', params.bank);
      }

      const response = await axios({
        method: 'POST',
        url: 'https://www.paytr.com/odeme/api/get-token',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        data: formData
      });

      const result = response.data;
      if (result.status === 'success') {
        return { status: 'success', token: result.token };
      } else {
        // Hata detayını daha net görelim
        throw new Error(result.reason || 'PayTR Token alma hatası');
      }

    } catch (error) {
      if (error.response) throw new Error(`PayTR API Error: ${error.response.data.reason || error.response.statusText}`);
      throw error;
    }
  }

  handleCallback(callbackData) {
    const { merchant_oid, status, total_amount, hash } = callbackData;
    
    if (!hash) throw new Error('Hash param missing');

    const token = `${merchant_oid}${this.merchantSalt}${status}${total_amount}`;
    
    const generatedHash = crypto
      .createHmac('sha256', this.merchantKey)
      .update(token)
      .digest('base64');

    if (generatedHash !== hash) {
      throw new Error("PAYTR notification failed: bad hash");
    }

    if (status === 'success') {
      return {
        status: 'success',
        orderId: callbackData.callback_id || merchant_oid,
        merchant_oid: merchant_oid,
        amount: parseFloat(total_amount) / 100,
        currency: callbackData.currency,
        paymentType: callbackData.payment_type
      };
    } else {
      throw new Error("Payment failed");
    }
  }

  generateToken(data) {
    return crypto.createHmac('sha256', this.merchantKey)
      .update(data + this.merchantSalt)
      .digest('base64');
  }
}

module.exports = PayTR;