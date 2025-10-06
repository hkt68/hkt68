<?php
// Elit Bilişim - POS Sistemi
// Ana Sayfa

session_start();
?>
<!DOCTYPE html>
<html lang="tr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Elit Bilişim - Stok & Satış Yönetimi</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <script src="https://unpkg.com/alpinejs@3.x.x/dist/cdn.min.js" defer></script>
    <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css" rel="stylesheet">
    <script>
        tailwind.config = {
            theme: {
                extend: {
                    colors: {
                        primary: '#1e40af',
                        secondary: '#64748b'
                    }
                }
            }
        }
    </script>
</head>
<body class="bg-gray-50" x-data="app()">
    <!-- Navigation -->
    <nav class="bg-slate-800 shadow-lg">
        <div class="max-w-7xl mx-auto px-4">
            <div class="flex justify-between items-center h-16">
                <div class="flex items-center space-x-4">
                    <div class="flex items-center">
                        <i class="fas fa-chart-bar text-orange-500 text-2xl mr-2"></i>
                        <span class="text-white text-xl font-bold">Elit Bilişim</span>
                    </div>
                    <span class="text-gray-300 text-sm">Stok & Satış Yönetimi</span>
                </div>
                <div class="flex items-center space-x-2 text-gray-300 text-sm">
                    <i class="fas fa-calendar"></i>
                    <span x-text="new Date().toLocaleDateString('tr-TR', {weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'})"></span>
                </div>
            </div>
        </div>
    </nav>

    <div class="flex">
        <!-- Sidebar -->
        <div class="w-64 bg-white shadow-sm min-h-screen">
            <div class="p-4">
                <nav class="space-y-2">
                    <button @click="currentPage = 'dashboard'" 
                            :class="currentPage === 'dashboard' ? 'bg-blue-100 text-blue-700 border-r-2 border-blue-700' : 'text-gray-700 hover:bg-gray-100'"
                            class="w-full flex items-center px-3 py-2 rounded-lg transition-colors">
                        <i class="fas fa-home w-5"></i>
                        <span class="ml-3">Dashboard</span>
                    </button>
                    
                    <button @click="currentPage = 'products'" 
                            :class="currentPage === 'products' ? 'bg-orange-100 text-orange-700 border-r-2 border-orange-700' : 'text-gray-700 hover:bg-gray-100'"
                            class="w-full flex items-center px-3 py-2 rounded-lg transition-colors">
                        <i class="fas fa-box w-5"></i>
                        <span class="ml-3">Ürünler</span>
                    </button>
                    
                    <button @click="currentPage = 'categories'" 
                            :class="currentPage === 'categories' ? 'bg-yellow-100 text-yellow-700 border-r-2 border-yellow-700' : 'text-gray-700 hover:bg-gray-100'"
                            class="w-full flex items-center px-3 py-2 rounded-lg transition-colors">
                        <i class="fas fa-tags w-5"></i>
                        <span class="ml-3">Kategoriler</span>
                    </button>
                    
                    <button @click="currentPage = 'pos'" 
                            :class="currentPage === 'pos' ? 'bg-green-100 text-green-700 border-r-2 border-green-700' : 'text-gray-700 hover:bg-gray-100'"
                            class="w-full flex items-center px-3 py-2 rounded-lg transition-colors">
                        <i class="fas fa-cash-register w-5"></i>
                        <span class="ml-3">Satış Yap</span>
                    </button>
                    
                    <button @click="currentPage = 'customers'" 
                            :class="currentPage === 'customers' ? 'bg-purple-100 text-purple-700 border-r-2 border-purple-700' : 'text-gray-700 hover:bg-gray-100'"
                            class="w-full flex items-center px-3 py-2 rounded-lg transition-colors">
                        <i class="fas fa-users w-5"></i>
                        <span class="ml-3">Müşteriler</span>
                    </button>
                    
                    <button @click="currentPage = 'sales'" 
                            :class="currentPage === 'sales' ? 'bg-indigo-100 text-indigo-700 border-r-2 border-indigo-700' : 'text-gray-700 hover:bg-gray-100'"
                            class="w-full flex items-center px-3 py-2 rounded-lg transition-colors">
                        <i class="fas fa-receipt w-5"></i>
                        <span class="ml-3">Satış İşlemleri</span>
                    </button>
                    
                    <button @click="currentPage = 'debts'" 
                            :class="currentPage === 'debts' ? 'bg-red-100 text-red-700 border-r-2 border-red-700' : 'text-gray-700 hover:bg-gray-100'"
                            class="w-full flex items-center px-3 py-2 rounded-lg transition-colors">
                        <i class="fas fa-exclamation-triangle w-5"></i>
                        <span class="ml-3">Borç Takibi</span>
                        <span x-show="stats.vadesi_gecmis && stats.vadesi_gecmis.sayi > 0" 
                              class="ml-auto bg-red-500 text-white text-xs rounded-full px-2 py-0.5" 
                              x-text="stats.vadesi_gecmis.sayi"></span>
                    </button>
                    
                    <button @click="currentPage = 'reports'" 
                            :class="currentPage === 'reports' ? 'bg-gray-100 text-gray-700 border-r-2 border-gray-700' : 'text-gray-700 hover:bg-gray-100'"
                            class="w-full flex items-center px-3 py-2 rounded-lg transition-colors">
                        <i class="fas fa-chart-bar w-5"></i>
                        <span class="ml-3">Raporlar</span>
                    </button>
                </nav>
            </div>

            <!-- Low Stock Alert -->
            <div x-show="lowStockProducts.length > 0" class="mx-4 mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div class="flex items-center text-yellow-800 text-sm font-medium mb-2">
                    <i class="fas fa-exclamation-triangle mr-2"></i>
                    <span>Stok Uyarısı</span>
                </div>
                <div class="text-yellow-700 text-xs">
                    <span x-text="lowStockProducts.length"></span> ürünün stoğu düşük seviyede
                </div>
                <button @click="currentPage = 'products'" 
                        class="text-yellow-800 text-xs underline hover:no-underline mt-1">
                    Ürünleri Gör
                </button>
            </div>
        </div>

        <!-- Main Content -->
        <div class="flex-1 p-6">
            <!-- Dashboard -->
            <div x-show="currentPage === 'dashboard'">
                <div class="mb-6 flex items-center justify-between">
                    <h1 class="text-2xl font-bold text-gray-900 flex items-center">
                        <i class="fas fa-home text-blue-600 mr-3"></i>
                        Dashboard
                    </h1>
                    <button @click="refreshStats()" class="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                        <i class="fas fa-sync-alt mr-2"></i>
                        Yenile
                    </button>
                </div>

                <!-- Stats Cards -->
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
                    <!-- Toplam Ürün -->
                    <div class="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                        <div class="flex items-center">
                            <div class="p-2 bg-blue-100 rounded-lg">
                                <i class="fas fa-box text-blue-600"></i>
                            </div>
                            <div class="ml-4">
                                <p class="text-sm font-medium text-gray-500">Toplam Ürün</p>
                                <p class="text-2xl font-bold text-gray-900" x-text="productCount || '0'"></p>
                            </div>
                        </div>
                    </div>

                    <!-- Kategori -->
                    <div class="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                        <div class="flex items-center">
                            <div class="p-2 bg-orange-100 rounded-lg">
                                <i class="fas fa-tags text-orange-600"></i>
                            </div>
                            <div class="ml-4">
                                <p class="text-sm font-medium text-gray-500">Kategori</p>
                                <p class="text-2xl font-bold text-gray-900" x-text="categoryCount || '0'"></p>
                            </div>
                        </div>
                    </div>

                    <!-- Bugünkü Satış -->
                    <div class="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                        <div class="flex items-center">
                            <div class="p-2 bg-green-100 rounded-lg">
                                <i class="fas fa-shopping-cart text-green-600"></i>
                            </div>
                            <div class="ml-4">
                                <p class="text-sm font-medium text-gray-500">Bugünkü Satış</p>
                                <p class="text-2xl font-bold text-gray-900" x-text="stats.bugun ? stats.bugun.sayi : '0'"></p>
                            </div>
                        </div>
                    </div>

                    <!-- Bugünkü Ciro -->
                    <div class="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                        <div class="flex items-center">
                            <div class="p-2 bg-yellow-100 rounded-lg">
                                <i class="fas fa-lira-sign text-yellow-600"></i>
                            </div>
                            <div class="ml-4">
                                <p class="text-sm font-medium text-gray-500">Bugünkü Ciro</p>
                                <p class="text-lg font-bold text-gray-900" x-text="formatCurrency(stats.bugun ? stats.bugun.tutar : 0)"></p>
                            </div>
                        </div>
                    </div>

                    <!-- Toplam Müşteri -->
                    <div class="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                        <div class="flex items-center">
                            <div class="p-2 bg-purple-100 rounded-lg">
                                <i class="fas fa-users text-purple-600"></i>
                            </div>
                            <div class="ml-4">
                                <p class="text-sm font-medium text-gray-500">Toplam Müşteri</p>
                                <p class="text-2xl font-bold text-gray-900" x-text="customerCount || '0'"></p>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Additional Stats -->
                <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                    <!-- Bu Ay Özet -->
                    <div class="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                        <h3 class="text-lg font-semibold text-gray-900 mb-4">Bu Ay Özet</h3>
                        <div class="space-y-3">
                            <div class="flex justify-between items-center">
                                <span class="text-gray-600">Toplam Satış:</span>
                                <span class="font-semibold" x-text="stats.bu_ay ? stats.bu_ay.sayi : '0'"></span>
                            </div>
                            <div class="flex justify-between items-center">
                                <span class="text-gray-600">Toplam Ciro:</span>
                                <span class="font-semibold text-green-600" x-text="formatCurrency(stats.bu_ay ? stats.bu_ay.tutar : 0)"></span>
                            </div>
                        </div>
                    </div>

                    <!-- Borç Durumu -->
                    <div class="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                        <h3 class="text-lg font-semibold text-gray-900 mb-4">Borç Durumu</h3>
                        <div class="space-y-3">
                            <div class="flex justify-between items-center">
                                <span class="text-gray-600">Toplam Borç:</span>
                                <span class="font-semibold text-orange-600" x-text="formatCurrency(stats.toplam_borc ? stats.toplam_borc.toplam_borc : 0)"></span>
                            </div>
                            <div class="flex justify-between items-center">
                                <span class="text-gray-600">Vadesi Geçmiş:</span>
                                <div class="text-right">
                                    <span class="font-semibold text-red-600" x-text="stats.vadesi_gecmis ? stats.vadesi_gecmis.sayi : '0'"></span>
                                    <span class="text-gray-500 text-sm">adet</span>
                                </div>
                            </div>
                        </div>
                        <button x-show="stats.vadesi_gecmis && stats.vadesi_gecmis.sayi > 0" 
                                @click="currentPage = 'debts'" 
                                class="mt-3 w-full bg-red-100 text-red-700 py-2 rounded-lg hover:bg-red-200 transition-colors text-sm">
                            Vadesi Geçmiş Borçları Gör
                        </button>
                    </div>
                </div>

                <!-- Hızlı İşlemler -->
                <div class="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <h3 class="text-lg font-semibold text-gray-900 mb-4">
                        <i class="fas fa-bolt text-yellow-500 mr-2"></i>
                        Hızlı İşlemler
                    </h3>
                    <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <button @click="currentPage = 'products'; showAddProduct = true" 
                                class="bg-blue-500 text-white p-4 rounded-lg hover:bg-blue-600 transition-colors text-center">
                            <i class="fas fa-plus text-2xl mb-2"></i>
                            <div class="text-sm">Yeni Ürün Ekle</div>
                        </button>
                        
                        <button @click="currentPage = 'pos'" 
                                class="bg-green-500 text-white p-4 rounded-lg hover:bg-green-600 transition-colors text-center">
                            <i class="fas fa-cash-register text-2xl mb-2"></i>
                            <div class="text-sm">Satış Yap</div>
                        </button>
                        
                        <button @click="currentPage = 'sales'" 
                                class="bg-orange-500 text-white p-4 rounded-lg hover:bg-orange-600 transition-colors text-center">
                            <i class="fas fa-receipt text-2xl mb-2"></i>
                            <div class="text-sm">Stok İşlemi</div>
                        </button>
                        
                        <button @click="currentPage = 'reports'" 
                                class="bg-gray-500 text-white p-4 rounded-lg hover:bg-gray-600 transition-colors text-center">
                            <i class="fas fa-chart-bar text-2xl mb-2"></i>
                            <div class="text-sm">Raporlar</div>
                        </button>
                    </div>
                </div>
            </div>

            <!-- Other Pages Placeholder -->
            <div x-show="currentPage !== 'dashboard'">
                <div class="text-center py-20">
                    <i class="fas fa-cog text-6xl text-gray-300 mb-4"></i>
                    <h2 class="text-2xl font-bold text-gray-700 mb-2" x-text="getPageTitle()"></h2>
                    <p class="text-gray-500">Bu sayfa geliştirme aşamasında...</p>
                    <button @click="currentPage = 'dashboard'" 
                            class="mt-4 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                        Dashboard'a Dön
                    </button>
                </div>
            </div>
        </div>
    </div>

    <script src="js/app.js"></script>
</body>
</html>