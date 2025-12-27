## 2Checkout Hataları

- **Eski API Kullanımı**: Kod, 2Checkout'un eski API endpoint'lerini ve yöntemlerini kullanıyor. 2Checkout artık Verifone altında ve yeni REST API, JSON-RPC veya SOAP API'lerini kullanmalı.
- **Hash Algoritması**: IPN callback doğrulama için MD5 kullanıyor, ancak dokümantasyon MD5'nin 15 Ağustos 2024'te durdurulduğunu belirtiyor ve SHA2/SHA3'e geçiş öneriyor.
- **Signature Hesaplama**: Buy link signature için sha256 kullanılıyor, bu doğru olabilir ama genel entegrasyon güncellenmeli.
- **Dokümantasyon Uyumsuzluğu**: Yeni Verifone dokümantasyonuna göre entegrasyon yeniden yazılmalı.

[x] 2Checkout (sorun var, güncelleme gerekli)

## Amazon Pay Hataları

- **Yanlış Signature Algoritması**: Kod HMAC SHA256 kullanıyor, ancak Amazon Pay API v2 RSA PSS (RSASSA-PSS) signature gerektirir. Private key ile RSA signature yapılmalı.
- **Authorization Header**: Header `AMZN-PAY-RSASSA-PSS` diyor ama HMAC ile signature yapıyor, bu uyumsuz.
- **API Yapısı**: Genel olarak Amazon Pay API dokümantasyonuna uymuyor, canonical request ve proper headers eksik.

[x] Amazon Pay (sorun var, yeniden yazılmalı)

## AnyPay Hataları

- **Callback Güvenliği Eksik**: handleCallback metodunda notification validation (signature ve IP kontrolü) comment edilmiş. Dokümantasyona göre SHA256 signature ve IP whitelist kontrolü gerekli.
- **Güvenlik Açığı**: Callback verisi doğrulanmadan işleniyor, bu saldırılara açık bırakır.

[x] AnyPay (sorun var, güvenlik eklenmeli)

## Billplz Hataları

- **Callback Güvenliği Eksik**: handleCallback metodunda sadece `paid` kontrolü var, ancak Billplz API dokümantasyonuna göre X Signature Callback Url ile signature validation gerekli. Callback verisi HMAC_SHA256 ile doğrulanmalı, aksi takdirde saldırılara açık.
- **Güvenlik Açığı**: Callback verisi doğrulanmadan işleniyor, bu spoofing saldırılarına neden olabilir.

[x] Billplz (sorun var, signature validation eklenmeli)

## BitPay Hataları

- **Extended Notifications Eksik**: Invoice oluştururken `"extendedNotifications": true` parametresi eklenmemiş. Dokümantasyona göre extended format öneriliyor ve daha fazla status notification sağlar.
- **Callback Güvenliği**: BitPay IPN'lerinde signature validation yok, ancak dokümantasyona göre HTTPS kullanılmalı ve IPN verisi invoice API ile doğrulanmalı. Kodda invoice kontrolü var, bu iyi, ama extended notifications eksik.

[x] BitPay (sorun var, extended notifications eklenmeli)

[x] BufPay

## Cardcom Hataları

- **Callback Güvenliği Eksik**: handleCallback metodunda verifyCallback çağırılıyor, ancak verifyCallback sadece OperationResponse === '0' kontrolü yapıyor. Cardcom API dokümantasyonuna göre callback'lar signature ile doğrulanmalı, ancak kodda signature validation yok.
- **Güvenlik Açığı**: Callback verisi doğrulanmadan işleniyor, bu spoofing saldırılarına açık bırakır.

[x] Cardcom (sorun var, signature validation eklenmeli)

[x] Cashfree

## Checkout Hataları

- **Webhook Signature Validation Eksik**: verifyWebhook metodunda sadece basit kontrol var, gerçek signature validation yok. Checkout.com dokümantasyonuna göre webhook'lar HMAC SHA256 ile signature doğrulanmalı.
- **Güvenlik Açığı**: Webhook verisi doğrulanmadan işleniyor, comment'te "simplified version" diyor ama production'da gerekli.

[x] Checkout (sorun var, signature validation uygulanmalı)

## CoinGate Hataları

- **Callback Güvenliği Eksik**: handleCallback metodunda order API ile kontrol ediliyor, ancak callback signature validation yok. CoinGate dokümantasyonuna göre callback'lar HMAC SHA256 ile doğrulanmalı.
- **Güvenlik Açığı**: Callback verisi doğrulanmadan işleniyor, spoofing saldırılarına açık.

[x] CoinGate (sorun var, signature validation eklenmeli)

[x] CoinPayments

[x] Cryptomus

[x] Doku

[x] ePay

[x] Epoint

## EsnekPOS Hataları

- **Callback Güvenliği Eksik**: handleCallback metodunda sadece STATUS kontrolü var, signature validation yok. Esnekpos dokümantasyonuna göre callback'lar doğrulanmalı, ancak kodda eksik.
- **Güvenlik Açığı**: Callback verisi doğrulanmadan işleniyor, spoofing saldırılarına açık.

[x] EsnekPOS (sorun var, signature validation eklenmeli)

## FedaPay Hataları

- **Callback Güvenliği Eksik**: handleCallback metodunda signature validation yok, sadece transaction retrieve ediliyor. verifySignature metod var ama kullanılmıyor. FedaPay dokümantasyonuna göre webhook'lar doğrulanmalı.
- **Güvenlik Açığı**: Callback verisi doğrulanmadan işleniyor.

[x] FedaPay (sorun var, signature validation uygulanmalı)

[x] FreeKassa

[x] Heleket

## Iyzico Hataları

- **Callback Güvenliği Eksik**: handleCallback metodunda checkout form retrieve ediliyor, ancak Iyzipay kütüphanesinin samples'ında görüldüğü gibi callback signature validation gerekli. HMAC SHA256 ile signature doğrulanmalı.
- **Güvenlik Açığı**: Callback verisi doğrulanmadan işleniyor, Iyzipay dokümantasyonuna göre signature kontrolü zorunlu.

[x] Iyzico (sorun var, signature validation eklenmeli)

## Instamojo Hataları

- **Callback Güvenliği Eksik**: handleCallback metodunda webhook verilerinin signature validation yok. Instamojo dokümantasyonuna göre webhook'lar "mac" (Message Authentication Code) parametresi ile doğrulanmalı, ancak kodda eksik.
- **Güvenlik Açığı**: Callback verisi doğrulanmadan işleniyor, spoofing saldırılarına açık.

[x] Instamojo (sorun var, signature validation eklenmeli)

[x] Konnect

[x] Midtrans

## Noonpayments Hataları

- **Callback Güvenliği Eksik**: handleCallback metodunda webhook signature validation yok. Noonpayments dokümantasyonuna göre callback'lar HMAC SHA512 ile signature doğrulanmalı, ancak kodda eksik.
- **Güvenlik Açığı**: Callback verisi doğrulanmadan işleniyor, spoofing saldırılarına açık.

[x] Noonpayments (sorun var, signature validation eklenmeli)

[x] NOWPayments

## Omise Hataları

- **Callback Güvenliği Eksik**: handleCallback metodunda webhook signature validation yok. Omise dokümantasyonuna göre callback'lar doğrulanmalı, ancak kodda eksik.
- **Güvenlik Açığı**: Callback verisi doğrulanmadan işleniyor, spoofing saldırılarına açık.

[x] Omise (sorun var, signature validation eklenmeli)

[x] PayPal

[x] Razorpay

## Xendit Hataları

- **Callback Güvenliği Eksik**: handleCallback metodunda sadece webhook token kontrolü var, gerçek signature validation yok. Xendit dokümantasyonuna göre callback'lar doğrulanmalı.
- **Güvenlik Açığı**: Callback verisi doğrulanmadan işleniyor, spoofing saldırılarına açık.

[x] Xendit (sorun var, signature validation eklenmeli)

[x] Paytm

## Yookassa Hataları

- **Callback Güvenliği Eksik**: handleCallback metodunda webhook signature validation yok. Yookassa dokümantasyonuna göre callback'lar doğrulanmalı, ancak kodda eksik.
- **Güvenlik Açığı**: Callback verisi doğrulanmadan işleniyor, spoofing saldırılarına açık.

[x] Yookassa (sorun var, signature validation eklenmeli)

[x] Coinbase

[x] PayUIndia

[x] PayULatam
[x] PayULatam

[x] PayTR

[x] PerfectMoney

## Paddle Hataları

- **Webhook Signature Validation Eksik**: verifyWebhook metodunda sadece `return true;` placeholder var, gerçek signature validation yok. Paddle dokümantasyonuna göre webhook'lar HMAC SHA256 ile signature doğrulanmalı. Paddle-Signature header'dan ts ve h1 çıkarılıp, ts + ":" + raw body ile HMAC SHA256 hash hesaplanmalı ve h1 ile karşılaştırılmalı.
- **Güvenlik Açığı**: Callback verisi doğrulanmadan işleniyor, spoofing saldırılarına açık.

[x] Paddle (sorun var, signature validation uygulanmalı)

## Papara Hataları

- **Callback Güvenliği Eksik**: verifyPaymentCallback metodunda sadece status kontrolü ve merchantSecretKey karşılaştırması var, gerçek signature validation yok. Papara API dokümantasyonuna göre webhook callback'lar doğrulanmalı, ancak kodda eksik.
- **Güvenlik Açığı**: Callback verisi doğrulanmadan işleniyor, spoofing saldırılarına açık.

[x] Papara (sorun var, signature validation eklenmeli)

## Payoneer Hataları

- **Callback Güvenliği Eksik**: handleCallback metodunda webhook signature validation yok. Payoneer API dokümantasyonuna göre callback'lar doğrulanmalı, ancak kodda eksik.
- **Güvenlik Açığı**: Callback verisi doğrulanmadan işleniyor, spoofing saldırılarına açık.

[x] Payoneer (sorun var, signature validation eklenmeli)

## Payop Hataları

- **Callback Güvenliği Eksik**: handleCallback metodunda verifyNotification çağrılmıyor. verifyNotification metodu signature validation yapıyor ama kullanılmıyor. Payop dokümantasyonuna göre IPN'ler doğrulanmalı, ancak kodda eksik.
- **Güvenlik Açığı**: Callback verisi doğrulanmadan işleniyor, spoofing saldırılarına açık.

[x] Payop (sorun var, signature validation uygulanmalı)

[x] Payriff

## Paysend Hataları

- **Callback Güvenliği Eksik**: verifyCallback metodunda sadece status kontrolü var, gerçek signature validation yok. Paysend API dokümantasyonuna göre webhook callback'lar doğrulanmalı, ancak kodda eksik.
- **Güvenlik Açığı**: Callback verisi doğrulanmadan işleniyor, spoofing saldırılarına açık.

[x] Paysend (sorun var, signature validation eklenmeli)

[x] Payspace

## Payssion Hataları

- **Yanlış Signature Algoritması**: generateSignature metodunda MD5 kullanılıyor, ancak Payssion dokümantasyonuna göre webhook signature validation HMAC SHA256 ile yapılmalı. Payssion-Signature header'dan signature alınmalı ve payload ile HMAC SHA256 hesaplanmalı.
- **Güvenlik Açığı**: Yanlış signature algoritması kullanılması nedeniyle callback verisi doğru doğrulanamıyor, spoofing saldırılarına açık.

[x] Payssion (sorun var, signature algoritması düzeltilmeli)

## Paytabs Hataları

- **Callback Güvenliği Eksik**: handleCallback metodunda verifyPayment çağırılıyor ama bu sadece API sorgusu yapıyor, gerçek signature validation yok. Paytabs API dokümantasyonuna göre webhook callback'lar doğrulanmalı, ancak kodda eksik.
- **Güvenlik Açığı**: Callback verisi doğrulanmadan işleniyor, spoofing saldırılarına açık.

[x] Paytabs (sorun var, signature validation eklenmeli)

[x] Paytm

## Paycom Hataları

- **Callback Güvenliği Eksik**: handleCallback metodunda verifyCallback çağrılmıyor. verifyCallback metodu X-Auth header kontrolü yapıyor ama dokümantasyona göre Authorization: Basic auth gerekli. Kodda authentication yapılmadan callback işleniyor.
- **Güvenlik Açığı**: Callback verisi doğrulanmadan işleniyor, spoofing saldırılarına açık.

[x] Paycom (sorun var, authentication uygulanmalı)

[x] Paydisini

[x] Payeer

[x] Payid19

## Paykun Hataları

- **Callback Güvenliği Eksik**: handleCallback metodunda signature validation yok. Paykun dokümantasyonuna göre callback'lar SHA512 HMAC ile signature doğrulanmalı, ancak kodda eksik.
- **Güvenlik Açığı**: Callback verisi doğrulanmadan işleniyor, spoofing saldırılarına açık.

[x] Paykun (sorun var, signature validation eklenmeli)

## Paymaya Hataları

- **Callback Güvenliği Eksik**: handleCallback metodunda verifyWebhookSignature çağrılmıyor. verifyWebhookSignature metodu signature validation yapıyor ama kullanılmıyor. Maya Checkout dokümantasyonuna göre webhook'lar doğrulanmalı.
- **Güvenlik Açığı**: Callback verisi doğrulanmadan işleniyor, spoofing saldırılarına açık.

[x] Paymaya (sorun var, signature validation uygulanmalı)

## Payme Hataları

- **Callback Güvenliği Eksik**: handleCallback metodunda signature validation yok. Kodda comment edilmiş "İleri düzey implementasyon: Signature doğrulaması" ama uygulanmamış. Payme dokümantasyonuna göre callback'lar doğrulanmalı.
- **Güvenlik Açığı**: Callback verisi doğrulanmadan işleniyor, spoofing saldırılarına açık.

[x] Payme (sorun var, signature validation eklenmeli)

[x] Paymentwall

[x] Paynet

[x] Paynettr

[x] Phonepe

## Picpay Hataları

- **Callback Güvenliği Eksik**: handleCallback metodunda signature validation yok. Sadece referenceId ile API'ye sorgu yapıyor, ancak Picpay webhook dokümantasyonuna göre callback verisi HMAC SHA256 signature ile doğrulanmalı.
- **Güvenlik Açığı**: Callback verisi doğrulanmadan işleniyor, bu spoofing saldırılarına açık bırakır. API çağrısı ile doğrulama yetersiz, çünkü callback verisi değiştirilebilir.

[x] Picpay (sorun var, signature validation eklenmeli)

## Plisio Hataları

- **Callback Güvenliği Eksik**: handleCallback metodunda verifyCallback çağırılıyor ve generateVerifyHash ile doğrulama yapılıyor, ancak implementasyon yanlış. Dokümantasyona göre HMAC SHA1 kullanılmalı, ancak kodda sadece SHA1 hash kullanılıyor (HMAC değil).
- **Yanlış Hash Algoritması**: generateVerifyHash fonksiyonunda crypto.createHash('sha1') kullanılıyor, ancak dokümantasyona göre crypto.createHmac('sha1', secretKey) kullanılmalı.
- **Yanlış Veri Sıralaması**: Kodda Object.keys().sort() sonra join('|') kullanılıyor, ancak dokümantasyona göre serialize() veya JSON.stringify() kullanılmalı.
- **Güvenlik Açığı**: Yanlış signature doğrulama nedeniyle callback verisi spoofing saldırılarına açık bırakır.

[x] Plisio (sorun var, signature validation düzeltilmeli)

## Portwallet Hataları

- **Callback Güvenliği Koşullu**: handleCallback metodunda verifyCallback çağırılıyor ancak sadece secretKey varsa. Eğer secretKey verilmezse callback doğrulanmadan işleniyor.
- **Güvenlik Açığı**: secretKey optional olduğu için, yanlış yapılandırma durumunda callback verisi spoofing saldırılarına açık bırakır.
- **Dokümantasyon Eksik**: Portwallet dokümantasyonuna erişilemedi, ancak genel payment gateway standartlarına göre callback signature validation zorunlu olmalı.

[x] Portwallet (sorun var, secretKey kontrolü düzeltilmeli)

## Primepayments Hataları

- **Callback Güvenliği Eksik**: handleCallback metodunda verifyNotification çağırılıyor ancak bu fonksiyon tanımlanmamış. Kod çalışmayacak.
- **Güvenlik Açığı**: verifyNotification fonksiyonu eksik olduğu için callback doğrulanmadan işleniyor, bu spoofing saldırılarına açık bırakır.
- **Eksik Implementasyon**: Primepayments API dokümantasyonuna göre secret word 2 ile MD5 signature validation gerekli, ancak kodda eksik.

[x] Primepayments (sorun var, verifyNotification fonksiyonu eklenmeli)

[x] Razorpay

[x] Senangpay

[x] Shopier

## Shurjopay Hataları

- **Callback Güvenliği Eksik**: handleCallback metodunda signature validation yok. Sadece orderId ile API'ye sorgu yapıyor, ancak Shurjopay webhook dokümantasyonuna göre callback verisi HMAC SHA256 signature ile doğrulanmalı.
- **Güvenlik Açığı**: Callback verisi doğrulanmadan işleniyor, bu spoofing saldırılarına açık bırakır. API çağrısı ile doğrulama yetersiz, çünkü callback verisi değiştirilebilir.

[x] Shurjopay (sorun var, signature validation eklenmeli)

## Toyyibpay Hataları

- **Callback Güvenliği Eksik**: verifyCallback metodunda sadece status_id kontrolü var, hash verification yok. Toyyibpay API dokümantasyonuna göre callback verisi hash ile doğrulanmalı.
- **Güvenlik Açığı**: Callback verisi doğrulanmadan işleniyor, bu spoofing saldırılarına açık bırakır.

[x] Toyyibpay (sorun var, hash validation eklenmeli)

[x] Tripay

[x] Unitpay

[x] Urway

[x] Volet

## Xendit Hataları

- **Callback Güvenliği Eksik**: handleCallback metodunda sadece webhook token kontrolü var, signature validation yok. Xendit webhook dokümantasyonuna göre callback verisi HMAC SHA256 signature ile doğrulanmalı.
- **Güvenlik Açığı**: Callback verisi doğrulanmadan işleniyor, bu spoofing saldırılarına açık bırakır.

[x] Xendit (sorun var, signature validation eklenmeli)

## Yallapay Hataları

- **Callback Güvenliği Eksik**: handleWebhook metodunda sadece webhook secret kontrolü var, signature validation yok. Yallapay webhook dokümantasyonuna göre callback verisi hash ile doğrulanmalı.
- **Güvenlik Açığı**: Callback verisi doğrulanmadan işleniyor, bu spoofing saldırılarına açık bırakır.

[x] Yallapay (sorun var, signature validation eklenmeli)

## Yookassa Hataları

- **Callback Güvenliği Eksik**: handleCallback metodunda signature validation yok. Sadece payment.id ile API'ye sorgu yapıyor, ancak Yookassa webhook dokümantasyonuna göre callback verisi HMAC SHA256 signature ile doğrulanmalı.
- **Güvenlik Açığı**: Callback verisi doğrulanmadan işleniyor, bu spoofing saldırılarına açık bırakır. API çağrısı ile doğrulama yetersiz.

[x] Yookassa (sorun var, signature validation eklenmeli)

## Youcanpay Hataları

- **Callback Güvenliği Eksik**: handleCallback metodunda signature validation yok. Sadece transactionId ile API'ye sorgu yapıyor, ancak Youcanpay webhook dokümantasyonuna göre callback verisi signature ile doğrulanmalı.
- **Güvenlik Açığı**: Callback verisi doğrulanmadan işleniyor, bu spoofing saldırılarına açık bırakır. API çağrısı ile doğrulama yetersiz.

[x] Youcanpay (sorun var, signature validation eklenmeli)

## Zarinpal Hataları

- **Callback Güvenliği Eksik**: handleCallback metodunda sadece Status kontrolü var, signature validation yok. Zarinpal webhook dokümantasyonuna göre callback verisi doğrulanmalı.
- **Güvenlik Açığı**: Callback verisi doğrulanmadan işleniyor, bu spoofing saldırılarına açık bırakır.

[x] Zarinpal (sorun var, signature validation eklenmeli)
