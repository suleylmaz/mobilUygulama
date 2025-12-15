# Odaklanma ve Verimlilik Uygulaması

Bu proje, **React Native** kullanılarak geliştirilmiş, **Pomodoro** tekniğini temel alan ve kullanıcıların odaklanma sürelerini analiz etmesini sağlayan bir mobil uygulamadır.

Uygulamanın en ayırt edici özelliği, kullanıcı uygulamadan çıktığında (arka plana attığında) bunu bir **"Dikkat Dağınıklığı"** olarak algılayıp sayacı durdurması ve raporlamasıdır.

## Özellikler

### Zamanlayıcı
- Özelleştirilebilir saat ve dakika girişi
- Başlat, duraklat ve sıfırlama kontrolleri
- Gerçek zamanlı geri sayım
- Görsel dairesel zamanlayıcı

### Kategori Yönetimi
- Önceden tanımlanmış kategoriler (Ders Çalışma, Kodlama, Proje, Kitap Okuma)
- Yeni kategori ekleme ve silme

### Odaklanma Takibi
- Dikkat dağılımı sayacı
- Uygulamadan çıkıldığında otomatik duraklatma ve uyarı
- Detaylı seans özeti (kategori, süre, dikkat dağılımı sayısı)

### Raporlama
- Tüm çalışma seanslarının listesi
- Kategori bazlı filtreleme
- Seans detayları ve silme özellikleri

### Teknolojiler

- **React Native** - Mobil uygulama framework'ü
- **React Navigation** - Tab ve Stack navigasyon
- **AsyncStorage** - Yerel veri saklama
- **Expo Vector Icons** - İkon kütüphanesi
- **React Native Modal Selector** - Kategori seçici

### Kurulum

### Gereksinimler
- Node.js
- npm 
- React Native geliştirme ortamı

### Adımlar

1. Projeyi klonlayın:
```bash
git clone https://github.com/suleylmaz/mobilUygulama
cd mobilUygulama
```

2. Bağımlılıkları yükleyin:
```bash
npm install
```

3. Uygulamayı çalıştırın:
```bash
npm start
```

##Proje Yapısı

```
mobilUygulama/
├── App.js                          # Ana uygulama ve navigasyon
├── src/
│   ├── screens/
│   │   ├── HomeScreen.js          # Ana ekran - Zamanlayıcı
│   │   ├── ReportsScreen.js       # Raporlar ekranı
│   │   └── CategoryManagementScreen.js  # Kategori yönetimi
│   └── storage/
│       └── storage.js             # AsyncStorage fonksiyonları
```

###Kullanım

### Zamanlayıcı Başlatma
1. Ana ekranda saat ve dakika değerlerini girin
2. Açılır menüden bir kategori seçin
3. "Başlat" butonuna tıklayın
4. Çalışmanıza odaklanın!

### Dikkat Dağılımı
- Uygulamadan çıktığınızda zamanlayıcı otomatik duraklar
- Dikkat dağılımı sayacı artırılır
- Kaldığınız yerden devam edebilirsiniz

### Seans Kaydetme
- "Duraklat & Kaydet" butonuna basın
- Seans otomatik kaydedilir
- Raporlar ekranından seanslarınızı görüntüleyin
