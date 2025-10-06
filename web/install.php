<?php
// Elit Bilişim - POS Sistemi
// Kurulum Sihirbazı

session_start();
?>
<!DOCTYPE html>
<html lang="tr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Elit Bilişim POS - Kurulum Sihirbazı</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css" rel="stylesheet">
</head>
<body class="bg-gradient-to-br from-blue-500 to-purple-600 min-h-screen">
    <div class="container mx-auto px-4 py-8">
        <div class="max-w-4xl mx-auto">
            <!-- Header -->
            <div class="text-center mb-8">
                <div class="bg-white rounded-xl shadow-lg p-8 mb-8">
                    <div class="flex items-center justify-center mb-4">
                        <i class="fas fa-chart-bar text-orange-500 text-4xl mr-3"></i>
                        <h1 class="text-3xl font-bold text-gray-800">Elit Bilişim</h1>
                    </div>
                    <p class="text-lg text-gray-600">Stok & Satış Yönetim Sistemi</p>
                    <p class="text-sm text-gray-500 mt-2">Kurulum Sihirbazı</p>
                </div>
            </div>

            <div class="bg-white rounded-xl shadow-lg overflow-hidden">
                <div class="p-8">
                    <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        <!-- Sol Kolon - Bilgiler -->
                        <div>
                            <h2 class="text-2xl font-bold text-gray-800 mb-6 flex items-center">
                                <i class="fas fa-info-circle text-blue-500 mr-3"></i>
                                Sistem Özellikleri
                            </h2>
                            
                            <div class="space-y-4 mb-6">
                                <div class="flex items-center text-green-600">
                                    <i class="fas fa-check-circle mr-3"></i>
                                    <span>Dashboard ve anlık raporlar</span>
                                </div>
                                <div class="flex items-center text-green-600">
                                    <i class="fas fa-check-circle mr-3"></i>
                                    <span>Ürün ve stok yönetimi</span>
                                </div>
                                <div class="flex items-center text-green-600">
                                    <i class="fas fa-check-circle mr-3"></i>
                                    <span>POS satış sistemi</span>
                                </div>
                                <div class="flex items-center text-green-600">
                                    <i class="fas fa-check-circle mr-3"></i>
                                    <span>Müşteri ve borç takibi</span>
                                </div>
                                <div class="flex items-center text-green-600">
                                    <i class="fas fa-check-circle mr-3"></i>
                                    <span>Vadesi geçmiş borç uyarıları</span>
                                </div>
                                <div class="flex items-center text-green-600">
                                    <i class="fas fa-check-circle mr-3"></i>
                                    <span>Çoklu ödeme türü desteği</span>
                                </div>
                            </div>

                            <div class="bg-blue-50 p-4 rounded-lg">
                                <h3 class="font-semibold text-blue-800 mb-2">📋 Gereksinimler</h3>
                                <ul class="text-sm text-blue-700 space-y-1">
                                    <li>• PHP 7.4+ (PHP 8.0+ önerilen)</li>
                                    <li>• MySQL 5.7+ veya MariaDB</li>
                                    <li>• Apache web sunucu</li>
                                    <li>• mod_rewrite modülü aktif</li>
                                </ul>
                            </div>
                        </div>

                        <!-- Sağ Kolon - Kurulum Adımları -->
                        <div>
                            <h2 class="text-2xl font-bold text-gray-800 mb-6 flex items-center">
                                <i class="fas fa-cogs text-orange-500 mr-3"></i>
                                Kurulum Adımları
                            </h2>

                            <div class="space-y-6">
                                <!-- Adım 1 -->
                                <div class="border-l-4 border-blue-500 pl-4">
                                    <h3 class="font-semibold text-gray-800 flex items-center">
                                        <span class="bg-blue-500 text-white w-6 h-6 rounded-full flex items-center justify-center text-sm mr-2">1</span>
                                        Veritabanı Hazırlığı
                                    </h3>
                                    <p class="text-sm text-gray-600 mt-1">
                                        cPanel'den MySQL veritabanı ve kullanıcı oluşturun
                                    </p>
                                </div>

                                <!-- Adım 2 -->
                                <div class="border-l-4 border-orange-500 pl-4">
                                    <h3 class="font-semibold text-gray-800 flex items-center">
                                        <span class="bg-orange-500 text-white w-6 h-6 rounded-full flex items-center justify-center text-sm mr-2">2</span>
                                        Dosya Yükleme
                                    </h3>
                                    <p class="text-sm text-gray-600 mt-1">
                                        Tüm dosyaları public_html klasörüne yükleyin
                                    </p>
                                </div>

                                <!-- Adım 3 -->
                                <div class="border-l-4 border-green-500 pl-4">
                                    <h3 class="font-semibold text-gray-800 flex items-center">
                                        <span class="bg-green-500 text-white w-6 h-6 rounded-full flex items-center justify-center text-sm mr-2">3</span>
                                        Veritabanı Kurulumu
                                    </h3>
                                    <p class="text-sm text-gray-600 mt-1">
                                        Aşağıdaki butona tıklayarak veritabanı tablolarını oluşturun
                                    </p>
                                </div>

                                <!-- Kurulum Butonu -->
                                <div class="bg-gradient-to-r from-green-500 to-blue-500 p-6 rounded-lg text-center">
                                    <button id="installBtn" onclick="runInstall()" 
                                            class="bg-white text-green-600 font-bold py-3 px-8 rounded-lg hover:bg-gray-100 transition-colors shadow-lg">
                                        <i class="fas fa-play mr-2"></i>
                                        Veritabanı Kurulumunu Başlat
                                    </button>
                                    <p class="text-white text-sm mt-2">
                                        Bu işlem sadece bir kez yapılmalıdır
                                    </p>
                                </div>

                                <!-- Sonuç Alanı -->
                                <div id="installResult" class="hidden">
                                    <!-- JavaScript ile doldurulacak -->
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Footer -->
                <div class="bg-gray-50 px-8 py-4 border-t">
                    <div class="flex items-center justify-between text-sm text-gray-600">
                        <div>
                            <i class="fas fa-shield-alt mr-1"></i>
                            Güvenli kurulum süreci
                        </div>
                        <div>
                            © 2024 Elit Bilişim - POS Sistemi
                        </div>
                    </div>
                </div>
            </div>

            <!-- Yardım Kutusu -->
            <div class="bg-white rounded-xl shadow-lg p-6 mt-8">
                <h3 class="text-lg font-semibold text-gray-800 mb-3 flex items-center">
                    <i class="fas fa-question-circle text-blue-500 mr-2"></i>
                    Yardım ve Destek
                </h3>
                
                <div class="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div>
                        <h4 class="font-medium text-gray-700 mb-1">📧 Veritabanı Ayarları</h4>
                        <p class="text-gray-600">config/database.php dosyasından veritabanı bilgilerinizi kontrol edin</p>
                    </div>
                    <div>
                        <h4 class="font-medium text-gray-700 mb-1">🔧 Sorun Giderme</h4>
                        <p class="text-gray-600">Hata alırsanız hosting sağlayıcınızın PHP ve MySQL ayarlarını kontrol edin</p>
                    </div>
                    <div>
                        <h4 class="font-medium text-gray-700 mb-1">📖 Dokümantasyon</h4>
                        <p class="text-gray-600">Detaylı kullanım kılavuzu için README.md dosyasını inceleyin</p>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <script>
        async function runInstall() {
            const button = document.getElementById('installBtn');
            const result = document.getElementById('installResult');
            
            // Butonu deaktive et
            button.disabled = true;
            button.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Kurulum yapılıyor...';
            
            try {
                // Kurulum isteği gönder
                const response = await fetch('config/init_db.php');
                const text = await response.text();
                
                // Sonucu göster
                result.classList.remove('hidden');
                
                if (text.includes('başarıyla')) {
                    result.innerHTML = `
                        <div class="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-lg">
                            <div class="flex items-center">
                                <i class="fas fa-check-circle text-2xl mr-3"></i>
                                <div>
                                    <h4 class="font-bold">Kurulum Başarılı!</h4>
                                    <p class="text-sm mt-1">${text}</p>
                                    <div class="mt-3">
                                        <a href="index.php" class="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition-colors">
                                            <i class="fas fa-arrow-right mr-1"></i>
                                            Sisteme Giriş Yap
                                        </a>
                                    </div>
                                </div>
                            </div>
                        </div>
                    `;
                } else {
                    result.innerHTML = `
                        <div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg">
                            <div class="flex items-center">
                                <i class="fas fa-exclamation-triangle text-2xl mr-3"></i>
                                <div>
                                    <h4 class="font-bold">Kurulum Hatası</h4>
                                    <p class="text-sm mt-1">${text}</p>
                                    <p class="text-sm mt-2">Lütfen veritabanı ayarlarınızı kontrol edin.</p>
                                </div>
                            </div>
                        </div>
                    `;
                }
                
            } catch (error) {
                result.classList.remove('hidden');
                result.innerHTML = `
                    <div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg">
                        <div class="flex items-center">
                            <i class="fas fa-times-circle text-2xl mr-3"></i>
                            <div>
                                <h4 class="font-bold">Bağlantı Hatası</h4>
                                <p class="text-sm mt-1">Kurulum sırasında bir hata oluştu: ${error.message}</p>
                            </div>
                        </div>
                    </div>
                `;
            }
            
            // Butonu tekrar aktive et
            button.disabled = false;
            button.innerHTML = '<i class="fas fa-redo mr-2"></i>Tekrar Dene';
        }
    </script>
</body>
</html>