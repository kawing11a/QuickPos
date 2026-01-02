const crypto = require('crypto');
const axios = require('axios');

class Paynkolay {
    /**
     * @param {Object} config
     * @param {string} config.sx - SX parametresi (Panelden alınır)
     * @param {string} config.merchantSecretKey - Gizli Anahtar
     * @param {string} config.merchantNo - Mağaza Numarası (Callback doğrulama için)
     * @param {boolean} [config.isTest=true] - Test ortamı mı?
     */
    constructor(config) {
        this.sx = config.sx;
        this.merchantSecretKey = config.merchantSecretKey;
        this.merchantNo = config.merchantNo;
        
        // Postman'deki host bilgisine göre
        this.baseUrl = config.isTest 
            ? 'https://paynkolaytest.nkolayislem.com.tr' 
            : 'https://paynkolay.nkolayislem.com.tr';
    }

    /**
     * Link ile Ödeme Oluşturma (/Vpos/by-link-create)
     * Postman'deki 'Link Oluştur' script'ine göre hazırlanmıştır.
     */
    async createPaymentLink(params) {
        try {
            const endpoint = '/Vpos/by-link-create';
            
            // Zorunlu alanlar için varsayılan değerler ve kontroller
            const rnd = params.rnd || Date.now().toString();
            const clientRefCode = params.clientRefCode || ('REF-' + rnd);
            const customerKey = params.customerKey || ""; // Kart saklama yoksa boş
            const amount = parseFloat(params.amount).toFixed(2); // 1000.00 formatı

            // 1. HASH OLUŞTURMA (Postman Script'ine göre)
            // Sıralama: sx|clientRefCode|amount|successUrl|failUrl|rnd|customerKey|merchantSecretKey
            const hashString = [
                this.sx,
                clientRefCode,
                amount,
                params.successUrl,
                params.failUrl,
                rnd,
                customerKey,
                this.merchantSecretKey
            ].join("|");

            const hashDatav2 = this.generateHash(hashString);

            // 2. FORM DATA HAZIRLAMA
            const data = new URLSearchParams();
            data.append('sx', this.sx);
            data.append('clientRefCode', clientRefCode);
            data.append('amount', amount);
            data.append('successUrl', params.successUrl);
            data.append('failUrl', params.failUrl);
            data.append('rnd', rnd);
            data.append('hashDatav2', hashDatav2);
            data.append('use3D', params.use3D || 'true');
            data.append('currencyCode', params.currencyCode || '949'); // 949 = TL
            data.append('transactionType', 'SALES');
            
            // Opsiyonel (Link Detayları)
            if (params.instalments) data.append('instalments', params.instalments);
            if (params.second) data.append('second', params.second); // Link süresi (saniye)
            if (params.cardHolderIP) data.append('cardHolderIP', params.cardHolderIP);
            
            // Link Sayfası Görünen Bilgiler
            data.append('detail', 'true');
            data.append('inputNamesurname', params.inputNamesurname || '');
            data.append('inputDescription', params.inputDescription || '');
            data.append('inputEmail', params.inputEmail || '');
            data.append('inputAddress', params.inputAddress || '');
            data.append('inputTckn', params.inputTckn || '');
            data.append('inputPhone', params.inputPhone || '');

            // 3. İSTEK GÖNDERME
            const response = await axios.post(`${this.baseUrl}${endpoint}`, data, {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                }
            });

            return response.data;

        } catch (error) {
            throw new Error(`Paynkolay Link Oluşturma Hatası: ${error.message}`);
        }
    }

    /**
     * Link Silme (/Vpos/by-link-url-remove)
     */
    async removePaymentLink(qParam) {
        try {
            const endpoint = '/Vpos/by-link-url-remove';

            // HASH OLUŞTURMA (Link Sil Script'ine göre)
            // Sıralama: sx|q|merchantSecretKey
            const hashString = [
                this.sx,
                qParam, // Bu değer genelde referans kodudur
                this.merchantSecretKey
            ].join("|");

            const hashDatav2 = this.generateHash(hashString);

            const data = new URLSearchParams();
            data.append('sx', this.sx);
            data.append('q', qParam);
            data.append('hashDatav2', hashDatav2);

            const response = await axios.post(`${this.baseUrl}${endpoint}`, data, {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                }
            });

            return response.data;

        } catch (error) {
            throw new Error(`Paynkolay Link Silme Hatası: ${error.message}`);
        }
    }

    /**
     * Callback (Bildirim) Doğrulama
     * Ödeme sonrası Paynkolay'ın successUrl'e gönderdiği veriyi doğrular.
     */
    handleCallback(params) {
        const {
            RESPONSE_CODE,
            MERCHANT_NO,
            REFERENCE_CODE,
            AUTH_CODE,
            USE_3D,
            RND,
            INSTALLMENT,
            AUTHORIZATION_AMOUNT,
            CURRENCY_CODE,
            hashDataV2
        } = params;

        // 1. İşlem Başarılı mı kontrolü
        if (RESPONSE_CODE !== "2" && RESPONSE_CODE !== 2) {
            return { status: false, message: 'İşlem başarısız (RESPONSE_CODE != 2)' };
        }

        // 2. Hash Hesaplama (Dokümantasyondaki 'Response Hash Testi' sırası)
        // MERCHANT_NO | REFERENCE_CODE | AUTH_CODE | RESPONSE_CODE | USE_3D | RND | INSTALLMENT | AUTHORIZATION_AMOUNT | CURRENCY_CODE | MERCHANT_SECRET_KEY
        
        const hashString = [
            MERCHANT_NO,
            REFERENCE_CODE,
            AUTH_CODE,
            RESPONSE_CODE,
            USE_3D, // Gelen değer string "true" veya "false" olabilir, olduğu gibi kullanılmalı
            RND,
            INSTALLMENT,
            AUTHORIZATION_AMOUNT,
            CURRENCY_CODE,
            this.merchantSecretKey
        ].join("|");

        const calculatedHash = this.generateHash(hashString);

        if (calculatedHash === hashDataV2) {
            return { 
                status: 'success', 
                message: 'Doğrulama Başarılı',
                amount: AUTHORIZATION_AMOUNT,
                orderId: params.CLIENT_REFERENCE_CODE || REFERENCE_CODE
            };
        } else {
            console.error("Hash String (Local):", hashString);
            console.error("Calculated:", calculatedHash);
            console.error("Received:", hashDataV2);
            return { status: false, message: 'Hash uyuşmazlığı (Güvenlik Hatası)' };
        }
    }

    /**
     * SHA-512 Base64 Helper
     */
    generateHash(str) {
        // UTF-8 encoding önemlidir (CryptoJS.SHA512 davranışı)
        return crypto.createHash('sha512').update(str, 'utf8').digest('base64');
    }
}

module.exports = Paynkolay;