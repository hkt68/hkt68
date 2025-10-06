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

            <!-- Ürünler Sayfası -->
            <div x-show="currentPage === 'products'">
                <div class="mb-6 flex items-center justify-between">
                    <h1 class="text-2xl font-bold text-gray-900 flex items-center">
                        <i class="fas fa-box text-orange-600 mr-3"></i>
                        Ürün Yönetimi
                    </h1>
                    <div class="flex space-x-2">
                        <button @click="loadLowStockProducts(); showLowStock = true" 
                                class="bg-yellow-600 text-white px-4 py-2 rounded-lg hover:bg-yellow-700 transition-colors">
                            <i class="fas fa-exclamation-triangle mr-2"></i>
                            Düşük Stok (<span x-text="lowStockProducts.length"></span>)
                        </button>
                        <button @click="showAddProduct = true; resetForms()" 
                                class="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                            <i class="fas fa-plus mr-2"></i>
                            Yeni Ürün
                        </button>
                    </div>
                </div>

                <!-- Arama ve Filtre -->
                <div class="bg-white p-4 rounded-xl shadow-sm border border-gray-100 mb-6">
                    <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div>
                            <input type="text" x-model="productSearch" @input="filterProducts()" 
                                   placeholder="Ürün ara..." 
                                   class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                        </div>
                        <div>
                            <select x-model="categoryFilter" @change="filterProducts()" 
                                    class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                                <option value="">Tüm Kategoriler</option>
                                <template x-for="category in categories" :key="category.id">
                                    <option :value="category.id" x-text="category.ad"></option>
                                </template>
                            </select>
                        </div>
                        <div>
                            <select x-model="stockFilter" @change="filterProducts()" 
                                    class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                                <option value="">Stok Durumu</option>
                                <option value="normal">Normal Stok</option>
                                <option value="low">Düşük Stok</option>
                                <option value="out">Stok Yok</option>
                            </select>
                        </div>
                        <div>
                            <button @click="refreshProducts()" 
                                    class="w-full bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors">
                                <i class="fas fa-sync-alt mr-2"></i>
                                Yenile
                            </button>
                        </div>
                    </div>
                </div>

                <!-- Ürün Listesi -->
                <div class="bg-white rounded-xl shadow-sm border border-gray-100">
                    <div class="overflow-x-auto">
                        <table class="w-full">
                            <thead class="bg-gray-50">
                                <tr>
                                    <th class="px-4 py-3 text-left text-sm font-medium text-gray-700">Ürün</th>
                                    <th class="px-4 py-3 text-left text-sm font-medium text-gray-700">Kategori</th>
                                    <th class="px-4 py-3 text-left text-sm font-medium text-gray-700">Barkod</th>
                                    <th class="px-4 py-3 text-left text-sm font-medium text-gray-700">Stok</th>
                                    <th class="px-4 py-3 text-left text-sm font-medium text-gray-700">Alış</th>
                                    <th class="px-4 py-3 text-left text-sm font-medium text-gray-700">Satış</th>
                                    <th class="px-4 py-3 text-left text-sm font-medium text-gray-700">Durum</th>
                                    <th class="px-4 py-3 text-center text-sm font-medium text-gray-700">İşlemler</th>
                                </tr>
                            </thead>
                            <tbody class="divide-y divide-gray-200">
                                <template x-for="product in filteredProducts" :key="product.id">
                                    <tr class="hover:bg-gray-50">
                                        <td class="px-4 py-3">
                                            <div class="font-medium text-gray-900" x-text="product.ad"></div>
                                            <div class="text-sm text-gray-500" x-text="product.birim"></div>
                                        </td>
                                        <td class="px-4 py-3">
                                            <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                                                  :style="`background-color: ${product.kategori_renk}20; color: ${product.kategori_renk}`"
                                                  x-text="product.kategori_ad || 'Kategori Yok'"></span>
                                        </td>
                                        <td class="px-4 py-3 text-sm text-gray-900" x-text="product.barkod || '-'"></td>
                                        <td class="px-4 py-3">
                                            <div class="flex items-center">
                                                <span class="text-sm font-medium" 
                                                      :class="product.stok_miktari <= product.min_stok_seviyesi ? 'text-red-600' : 'text-gray-900'"
                                                      x-text="product.stok_miktari"></span>
                                                <button @click="showStockUpdate = true; selectedProduct = product" 
                                                        class="ml-2 text-blue-600 hover:text-blue-800">
                                                    <i class="fas fa-edit text-xs"></i>
                                                </button>
                                            </div>
                                            <div class="text-xs text-gray-500">Min: <span x-text="product.min_stok_seviyesi"></span></div>
                                        </td>
                                        <td class="px-4 py-3 text-sm text-gray-900" x-text="formatCurrency(product.alis_fiyati)"></td>
                                        <td class="px-4 py-3 text-sm font-medium text-gray-900" x-text="formatCurrency(product.satis_fiyati)"></td>
                                        <td class="px-4 py-3">
                                            <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                                                  :class="product.stok_miktari <= 0 ? 'bg-red-100 text-red-800' : 
                                                          product.stok_miktari <= product.min_stok_seviyesi ? 'bg-yellow-100 text-yellow-800' : 
                                                          'bg-green-100 text-green-800'"
                                                  x-text="product.stok_miktari <= 0 ? 'Stok Yok' : 
                                                          product.stok_miktari <= product.min_stok_seviyesi ? 'Düşük Stok' : 
                                                          'Normal'"></span>
                                        </td>
                                        <td class="px-4 py-3 text-center">
                                            <div class="flex items-center justify-center space-x-2">
                                                <button @click="editProduct(product)" 
                                                        class="text-blue-600 hover:text-blue-800" title="Düzenle">
                                                    <i class="fas fa-edit"></i>
                                                </button>
                                                <button @click="showStockUpdate = true; selectedProduct = product" 
                                                        class="text-green-600 hover:text-green-800" title="Stok Güncelle">
                                                    <i class="fas fa-boxes"></i>
                                                </button>
                                                <button @click="deleteProduct(product.id)" 
                                                        class="text-red-600 hover:text-red-800" title="Sil">
                                                    <i class="fas fa-trash"></i>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                </template>
                            </tbody>
                        </table>
                        
                        <!-- Ürün Yok Mesajı -->
                        <div x-show="filteredProducts.length === 0" class="text-center py-8">
                            <i class="fas fa-box-open text-4xl text-gray-300 mb-2"></i>
                            <p class="text-gray-500">Henüz ürün bulunamadı</p>
                            <button @click="showAddProduct = true; resetForms()" 
                                    class="mt-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                                İlk Ürününüzü Ekleyin
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Kategoriler Sayfası -->
            <div x-show="currentPage === 'categories'">
                <div class="mb-6 flex items-center justify-between">
                    <h1 class="text-2xl font-bold text-gray-900 flex items-center">
                        <i class="fas fa-tags text-yellow-600 mr-3"></i>
                        Kategori Yönetimi
                    </h1>
                    <button @click="showAddCategory = true; resetForms()" 
                            class="bg-yellow-600 text-white px-4 py-2 rounded-lg hover:bg-yellow-700 transition-colors">
                        <i class="fas fa-plus mr-2"></i>
                        Yeni Kategori
                    </button>
                </div>

                <!-- Kategori Grid -->
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <template x-for="category in categories" :key="category.id">
                        <div class="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                            <div class="flex items-center justify-between mb-4">
                                <div class="w-4 h-4 rounded-full" :style="`background-color: ${category.renk}`"></div>
                                <div class="flex space-x-2">
                                    <button @click="editCategory(category)" 
                                            class="text-blue-600 hover:text-blue-800" title="Düzenle">
                                        <i class="fas fa-edit"></i>
                                    </button>
                                    <button @click="deleteCategory(category.id)" 
                                            class="text-red-600 hover:text-red-800" title="Sil">
                                        <i class="fas fa-trash"></i>
                                    </button>
                                </div>
                            </div>
                            <h3 class="text-lg font-semibold text-gray-900 mb-2" x-text="category.ad"></h3>
                            <p class="text-sm text-gray-600 mb-4" x-text="category.aciklama || 'Açıklama bulunmuyor'"></p>
                            <div class="flex items-center justify-between">
                                <span class="text-sm text-gray-500">
                                    <span x-text="category.urun_sayisi || 0"></span> ürün
                                </span>
                                <span class="text-xs text-gray-400" x-text="formatDate(category.olusturma_tarihi)"></span>
                            </div>
                        </div>
                    </template>
                </div>

                <!-- Kategori Yok Mesajı -->
                <div x-show="categories.length === 0" class="text-center py-12">
                    <i class="fas fa-tags text-6xl text-gray-300 mb-4"></i>
                    <h2 class="text-xl font-semibold text-gray-700 mb-2">Henüz kategori yok</h2>
                    <p class="text-gray-500 mb-4">Ürünlerinizi organize etmek için kategoriler oluşturun</p>
                    <button @click="showAddCategory = true; resetForms()" 
                            class="bg-yellow-600 text-white px-6 py-2 rounded-lg hover:bg-yellow-700 transition-colors">
                        İlk Kategorinizi Oluşturun
                    </button>
                </div>
            </div>

            <!-- POS Satış Sayfası -->
            <div x-show="currentPage === 'pos'">
                <div class="mb-6 flex items-center justify-between">
                    <h1 class="text-2xl font-bold text-gray-900 flex items-center">
                        <i class="fas fa-cash-register text-green-600 mr-3"></i>
                        Satış Yap
                    </h1>
                    <div class="flex space-x-2">
                        <button @click="clearSale()" 
                                class="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors">
                            <i class="fas fa-times mr-2"></i>
                            Temizle
                        </button>
                        <button x-show="saleItems.length > 0" @click="completeSale()" 
                                class="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors">
                            <i class="fas fa-check mr-2"></i>
                            Satışı Tamamla
                        </button>
                    </div>
                </div>

                <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <!-- Sol: Ürün Seçimi -->
                    <div class="lg:col-span-2 space-y-6">
                        <!-- Ürün Arama -->
                        <div class="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                            <h3 class="text-lg font-semibold text-gray-900 mb-4">Ürün Seç</h3>
                            <div class="flex space-x-4 mb-4">
                                <div class="flex-1">
                                    <input type="text" x-model="productSearchPos" @input="searchProductsPos()" 
                                           placeholder="Ürün adı veya barkod ile ara..." 
                                           class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500">
                                </div>
                                <button @click="clearProductSearch()" 
                                        class="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600">
                                    Temizle
                                </button>
                            </div>
                            
                            <!-- Kategori Filtreleme -->
                            <div class="flex space-x-2 mb-4 overflow-x-auto">
                                <button @click="posCategory = ''" 
                                        :class="posCategory === '' ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-700'"
                                        class="px-3 py-1 rounded-full text-sm whitespace-nowrap">
                                    Tümü
                                </button>
                                <template x-for="category in categories" :key="category.id">
                                    <button @click="posCategory = category.id" 
                                            :class="posCategory == category.id ? 'text-white' : 'text-gray-700'"
                                            :style="posCategory == category.id ? `background-color: ${category.renk}` : 'background-color: #f3f4f6'"
                                            class="px-3 py-1 rounded-full text-sm whitespace-nowrap" 
                                            x-text="category.ad">
                                    </button>
                                </template>
                            </div>
                        </div>

                        <!-- Ürün Grid -->
                        <div class="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                            <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                                <template x-for="product in filteredPosProducts" :key="product.id">
                                    <button @click="addToSale(product)" 
                                            :disabled="product.stok_miktari <= 0"
                                            :class="product.stok_miktari <= 0 ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-md'"
                                            class="bg-gray-50 p-3 rounded-lg border border-gray-200 text-left transition-all">
                                        <div class="font-medium text-gray-900 text-sm mb-1" x-text="product.ad"></div>
                                        <div class="text-xs text-gray-500 mb-2" x-text="product.kategori_ad || 'Genel'"></div>
                                        <div class="text-sm font-bold text-green-600" x-text="formatCurrency(product.satis_fiyati)"></div>
                                        <div class="text-xs" :class="product.stok_miktari <= product.min_stok_seviyesi ? 'text-red-600' : 'text-gray-500'">
                                            Stok: <span x-text="product.stok_miktari"></span>
                                        </div>
                                    </button>
                                </template>
                            </div>
                            
                            <!-- Ürün Yok Mesajı -->
                            <div x-show="filteredPosProducts.length === 0" class="text-center py-8">
                                <i class="fas fa-search text-4xl text-gray-300 mb-2"></i>
                                <p class="text-gray-500">Aradığınız ürün bulunamadı</p>
                            </div>
                        </div>
                    </div>

                    <!-- Sağ: Sepet ve Ödeme -->
                    <div class="space-y-6">
                        <!-- Müşteri Seçimi -->
                        <div class="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                            <h3 class="text-lg font-semibold text-gray-900 mb-3">Müşteri</h3>
                            <select x-model="selectedCustomer" 
                                    class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500">
                                <option value="">Seçiniz (Perakende Satış)</option>
                                <template x-for="customer in customers" :key="customer.id">
                                    <option :value="customer.id" 
                                            x-text="customer.ad + ' ' + (customer.soyad || '') + (customer.telefon ? ' (' + customer.telefon + ')' : '')">
                                    </option>
                                </template>
                            </select>
                        </div>

                        <!-- Sepet -->
                        <div class="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                            <h3 class="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                                <i class="fas fa-shopping-cart mr-2"></i>
                                Sepet (<span x-text="saleItems.length"></span>)
                            </h3>
                            
                            <div class="space-y-2 max-h-80 overflow-y-auto">
                                <template x-for="(item, index) in saleItems" :key="index">
                                    <div class="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                                        <div class="flex-1">
                                            <div class="font-medium text-sm" x-text="item.name"></div>
                                            <div class="text-xs text-gray-500" x-text="formatCurrency(item.price) + ' x ' + item.quantity"></div>
                                        </div>
                                        <div class="flex items-center space-x-2">
                                            <button @click="updateQuantity(index, -1)" 
                                                    class="w-6 h-6 bg-red-500 text-white rounded-full text-xs flex items-center justify-center">
                                                -
                                            </button>
                                            <span class="text-sm font-medium w-8 text-center" x-text="item.quantity"></span>
                                            <button @click="updateQuantity(index, 1)" 
                                                    class="w-6 h-6 bg-green-500 text-white rounded-full text-xs flex items-center justify-center">
                                                +
                                            </button>
                                            <button @click="removeFromSale(index)" 
                                                    class="w-6 h-6 bg-gray-400 text-white rounded-full text-xs flex items-center justify-center ml-2">
                                                ×
                                            </button>
                                        </div>
                                    </div>
                                </template>
                            </div>

                            <!-- Sepet Boş -->
                            <div x-show="saleItems.length === 0" class="text-center py-8">
                                <i class="fas fa-shopping-cart text-4xl text-gray-300 mb-2"></i>
                                <p class="text-gray-500 text-sm">Sepetiniz boş</p>
                                <p class="text-gray-400 text-xs">Ürün seçerek satışa başlayın</p>
                            </div>
                        </div>

                        <!-- Toplam ve Ödeme -->
                        <div x-show="saleItems.length > 0" class="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                            <h3 class="text-lg font-semibold text-gray-900 mb-4">Ödeme</h3>
                            
                            <!-- Toplam -->
                            <div class="border-t border-gray-200 pt-4 mb-4">
                                <div class="flex justify-between items-center text-xl font-bold">
                                    <span>TOPLAM:</span>
                                    <span class="text-green-600" x-text="formatCurrency(saleTotal)"></span>
                                </div>
                            </div>

                            <!-- Ödeme Türü -->
                            <div class="mb-4">
                                <label class="block text-sm font-medium text-gray-700 mb-2">Ödeme Türü</label>
                                <select x-model="paymentType" 
                                        class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500">
                                    <option value="nakit">Nakit</option>
                                    <option value="kart">Kredi/Banka Kartı</option>
                                    <option value="havale">Havale/EFT</option>
                                    <option value="veresiye">Veresiye</option>
                                </select>
                            </div>

                            <!-- Ödenen Tutar -->
                            <div class="mb-4">
                                <label class="block text-sm font-medium text-gray-700 mb-2">Ödenen Tutar</label>
                                <input type="number" step="0.01" x-model="paidAmount" @input="calculateChange()"
                                       :max="paymentType === 'veresiye' ? saleTotal : ''"
                                       class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500">
                            </div>

                            <!-- Para Üstü -->
                            <div x-show="paymentType !== 'veresiye' && parseFloat(paidAmount) > saleTotal" 
                                 class="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                                <div class="flex justify-between items-center">
                                    <span class="text-blue-800 font-medium">Para Üstü:</span>
                                    <span class="text-blue-800 font-bold" x-text="formatCurrency(parseFloat(paidAmount || 0) - saleTotal)"></span>
                                </div>
                            </div>

                            <!-- Kalan Borç -->
                            <div x-show="parseFloat(paidAmount || 0) < saleTotal" 
                                 class="mb-4 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                                <div class="flex justify-between items-center">
                                    <span class="text-orange-800 font-medium">Kalan Borç:</span>
                                    <span class="text-orange-800 font-bold" x-text="formatCurrency(saleTotal - parseFloat(paidAmount || 0))"></span>
                                </div>
                                
                                <!-- Vade Tarihi (Veresiye için) -->
                                <div x-show="paymentType === 'veresiye' && parseFloat(paidAmount || 0) < saleTotal" class="mt-3">
                                    <label class="block text-sm font-medium text-orange-700 mb-1">Vade Tarihi</label>
                                    <input type="date" x-model="dueDate" 
                                           class="w-full px-3 py-2 border border-orange-300 rounded-lg focus:ring-2 focus:ring-orange-500">
                                </div>
                            </div>

                            <!-- Hızlı Ödeme Butonları -->
                            <div x-show="paymentType === 'nakit'" class="grid grid-cols-3 gap-2 mb-4">
                                <button @click="paidAmount = saleTotal; calculateChange()" 
                                        class="bg-green-100 text-green-800 py-2 rounded text-sm hover:bg-green-200">
                                    Tam Para
                                </button>
                                <button @click="paidAmount = Math.ceil(saleTotal / 5) * 5; calculateChange()" 
                                        class="bg-blue-100 text-blue-800 py-2 rounded text-sm hover:bg-blue-200">
                                    5₺'ye Yuvarla
                                </button>
                                <button @click="paidAmount = Math.ceil(saleTotal / 10) * 10; calculateChange()" 
                                        class="bg-purple-100 text-purple-800 py-2 rounded text-sm hover:bg-purple-200">
                                    10₺'ye Yuvarla
                                </button>
                            </div>

                            <!-- Satış Tamamla Butonu -->
                            <button @click="completeSale()" 
                                    :disabled="saleItems.length === 0 || (!paidAmount && paymentType !== 'veresiye')"
                                    class="w-full bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed">
                                <i class="fas fa-check mr-2"></i>
                                Satışı Tamamla
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Müşteriler Sayfası -->
            <div x-show="currentPage === 'customers'">
                <div class="mb-6 flex items-center justify-between">
                    <h1 class="text-2xl font-bold text-gray-900 flex items-center">
                        <i class="fas fa-users text-purple-600 mr-3"></i>
                        Müşteri Yönetimi
                    </h1>
                    <button @click="showAddCustomer = true; resetForms()" 
                            class="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors">
                        <i class="fas fa-plus mr-2"></i>
                        Yeni Müşteri
                    </button>
                </div>

                <!-- Müşteri Arama -->
                <div class="bg-white p-4 rounded-xl shadow-sm border border-gray-100 mb-6">
                    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div class="md:col-span-2">
                            <input type="text" x-model="customerSearch" @input="filterCustomers()" 
                                   placeholder="Ad, soyad veya telefon ile ara..." 
                                   class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500">
                        </div>
                        <button @click="refreshCustomers()" 
                                class="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors">
                            <i class="fas fa-sync-alt mr-2"></i>
                            Yenile
                        </button>
                    </div>
                </div>

                <!-- Müşteri Listesi -->
                <div class="bg-white rounded-xl shadow-sm border border-gray-100">
                    <div class="overflow-x-auto">
                        <table class="w-full">
                            <thead class="bg-gray-50">
                                <tr>
                                    <th class="px-4 py-3 text-left text-sm font-medium text-gray-700">Müşteri</th>
                                    <th class="px-4 py-3 text-left text-sm font-medium text-gray-700">İletişim</th>
                                    <th class="px-4 py-3 text-left text-sm font-medium text-gray-700">Toplam Alışveriş</th>
                                    <th class="px-4 py-3 text-left text-sm font-medium text-gray-700">Toplam Borç</th>
                                    <th class="px-4 py-3 text-left text-sm font-medium text-gray-700">Kayıt Tarihi</th>
                                    <th class="px-4 py-3 text-center text-sm font-medium text-gray-700">İşlemler</th>
                                </tr>
                            </thead>
                            <tbody class="divide-y divide-gray-200">
                                <template x-for="customer in filteredCustomers" :key="customer.id">
                                    <tr class="hover:bg-gray-50">
                                        <td class="px-4 py-3">
                                            <div class="font-medium text-gray-900" x-text="customer.ad + ' ' + (customer.soyad || '')"></div>
                                            <div class="text-sm text-gray-500" x-text="customer.borc_limiti > 0 ? 'Borç Limiti: ' + formatCurrency(customer.borc_limiti) : 'Peşin müşteri'"></div>
                                        </td>
                                        <td class="px-4 py-3">
                                            <div class="text-sm text-gray-900" x-text="customer.telefon || '-'"></div>
                                            <div class="text-sm text-gray-500" x-text="customer.email || '-'"></div>
                                        </td>
                                        <td class="px-4 py-3">
                                            <div class="text-sm font-medium text-gray-900" x-text="formatCurrency(customer.toplam_alisveris || 0)"></div>
                                            <div class="text-sm text-gray-500" x-text="(customer.toplam_satis || 0) + ' satış'"></div>
                                        </td>
                                        <td class="px-4 py-3">
                                            <span class="text-sm font-medium" 
                                                  :class="customer.toplam_borc > 0 ? 'text-red-600' : 'text-green-600'"
                                                  x-text="formatCurrency(customer.toplam_borc || 0)"></span>
                                        </td>
                                        <td class="px-4 py-3 text-sm text-gray-900" x-text="formatDate(customer.olusturma_tarihi)"></td>
                                        <td class="px-4 py-3 text-center">
                                            <div class="flex items-center justify-center space-x-2">
                                                <button @click="viewCustomerDetails(customer)" 
                                                        class="text-blue-600 hover:text-blue-800" title="Detaylar">
                                                    <i class="fas fa-eye"></i>
                                                </button>
                                                <button @click="editCustomer(customer)" 
                                                        class="text-green-600 hover:text-green-800" title="Düzenle">
                                                    <i class="fas fa-edit"></i>
                                                </button>
                                                <button @click="deleteCustomer(customer.id)" 
                                                        class="text-red-600 hover:text-red-800" title="Sil">
                                                    <i class="fas fa-trash"></i>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                </template>
                            </tbody>
                        </table>

                        <!-- Müşteri Yok -->
                        <div x-show="filteredCustomers.length === 0" class="text-center py-8">
                            <i class="fas fa-users text-4xl text-gray-300 mb-2"></i>
                            <p class="text-gray-500">Henüz müşteri kaydı yok</p>
                            <button @click="showAddCustomer = true; resetForms()" 
                                    class="mt-2 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700">
                                İlk Müşterinizi Ekleyin
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Borç Takibi Sayfası -->
            <div x-show="currentPage === 'debts'">
                <div class="mb-6 flex items-center justify-between">
                    <h1 class="text-2xl font-bold text-gray-900 flex items-center">
                        <i class="fas fa-exclamation-triangle text-red-600 mr-3"></i>
                        Borç Takibi
                    </h1>
                    <div class="flex space-x-2">
                        <button @click="refreshDebts()" 
                                class="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors">
                            <i class="fas fa-sync-alt mr-2"></i>
                            Yenile
                        </button>
                    </div>
                </div>

                <!-- Özet Kartlar -->
                <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                    <div class="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                        <div class="flex items-center">
                            <div class="p-2 bg-orange-100 rounded-lg">
                                <i class="fas fa-clock text-orange-600"></i>
                            </div>
                            <div class="ml-4">
                                <p class="text-sm font-medium text-gray-500">Toplam Bekleyen Borç</p>
                                <p class="text-xl font-bold text-orange-600" x-text="formatCurrency(totalDebtAmount)"></p>
                            </div>
                        </div>
                    </div>

                    <div class="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                        <div class="flex items-center">
                            <div class="p-2 bg-red-100 rounded-lg">
                                <i class="fas fa-exclamation-triangle text-red-600"></i>
                            </div>
                            <div class="ml-4">
                                <p class="text-sm font-medium text-gray-500">Vadesi Geçmiş</p>
                                <p class="text-xl font-bold text-red-600" x-text="overdueCount + ' adet'"></p>
                            </div>
                        </div>
                    </div>

                    <div class="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                        <div class="flex items-center">
                            <div class="p-2 bg-yellow-100 rounded-lg">
                                <i class="fas fa-calendar text-yellow-600"></i>
                            </div>
                            <div class="ml-4">
                                <p class="text-sm font-medium text-gray-500">Bu Hafta Vadeli</p>
                                <p class="text-xl font-bold text-yellow-600" x-text="thisWeekCount + ' adet'"></p>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Borç Listesi -->
                <div class="bg-white rounded-xl shadow-sm border border-gray-100">
                    <div class="p-4 border-b border-gray-200">
                        <h3 class="text-lg font-semibold text-gray-900">Bekleyen Borçlar</h3>
                    </div>
                    
                    <div class="overflow-x-auto">
                        <table class="w-full">
                            <thead class="bg-gray-50">
                                <tr>
                                    <th class="px-4 py-3 text-left text-sm font-medium text-gray-700">Satış</th>
                                    <th class="px-4 py-3 text-left text-sm font-medium text-gray-700">Müşteri</th>
                                    <th class="px-4 py-3 text-left text-sm font-medium text-gray-700">Toplam Tutar</th>
                                    <th class="px-4 py-3 text-left text-sm font-medium text-gray-700">Ödenen</th>
                                    <th class="px-4 py-3 text-left text-sm font-medium text-gray-700">Kalan Borç</th>
                                    <th class="px-4 py-3 text-left text-sm font-medium text-gray-700">Vade Tarihi</th>
                                    <th class="px-4 py-3 text-center text-sm font-medium text-gray-700">İşlemler</th>
                                </tr>
                            </thead>
                            <tbody class="divide-y divide-gray-200">
                                <template x-for="debt in debts" :key="debt.id">
                                    <tr class="hover:bg-gray-50" 
                                        :class="debt.geciken_gun > 0 ? 'bg-red-50' : debt.geciken_gun >= -7 ? 'bg-yellow-50' : ''">
                                        <td class="px-4 py-3">
                                            <div class="font-medium text-gray-900" x-text="'Satış #' + debt.id"></div>
                                            <div class="text-sm text-gray-500" x-text="formatDateTime(debt.olusturma_tarihi)"></div>
                                        </td>
                                        <td class="px-4 py-3">
                                            <div class="font-medium text-gray-900" x-text="debt.musteri_ad + ' ' + (debt.musteri_soyad || '')"></div>
                                            <div class="text-sm text-gray-500" x-text="debt.musteri_telefon || '-'"></div>
                                        </td>
                                        <td class="px-4 py-3 font-medium text-gray-900" x-text="formatCurrency(debt.toplam_tutar)"></td>
                                        <td class="px-4 py-3 text-gray-600" x-text="formatCurrency(debt.odenen_tutar)"></td>
                                        <td class="px-4 py-3">
                                            <span class="font-bold text-red-600" x-text="formatCurrency(debt.kalan_borc)"></span>
                                        </td>
                                        <td class="px-4 py-3">
                                            <div x-show="debt.vade_tarihi">
                                                <span :class="debt.geciken_gun > 0 ? 'text-red-600 font-bold' : debt.geciken_gun >= -7 ? 'text-yellow-600 font-medium' : 'text-gray-900'"
                                                      x-text="formatDate(debt.vade_tarihi)"></span>
                                                <div class="text-xs" :class="debt.geciken_gun > 0 ? 'text-red-600' : debt.geciken_gun >= -7 ? 'text-yellow-600' : 'text-gray-500'">
                                                    <span x-text="debt.geciken_gun > 0 ? debt.geciken_gun + ' gün gecikmiş' : 
                                                                  debt.geciken_gun >= -7 ? Math.abs(debt.geciken_gun) + ' gün kaldı' : 'Normal'"></span>
                                                </div>
                                            </div>
                                            <span x-show="!debt.vade_tarihi" class="text-gray-400">Vade yok</span>
                                        </td>
                                        <td class="px-4 py-3 text-center">
                                            <div class="flex items-center justify-center space-x-2">
                                                <button @click="showPaymentModal(debt)" 
                                                        class="text-green-600 hover:text-green-800" title="Ödeme Al">
                                                    <i class="fas fa-money-bill"></i>
                                                </button>
                                                <button @click="viewSaleDetails(debt)" 
                                                        class="text-blue-600 hover:text-blue-800" title="Detaylar">
                                                    <i class="fas fa-eye"></i>
                                                </button>
                                                <button @click="deleteSale(debt.id)" 
                                                        class="text-red-600 hover:text-red-800" title="Satış İptal">
                                                    <i class="fas fa-trash"></i>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                </template>
                            </tbody>
                        </table>

                        <!-- Borç Yok -->
                        <div x-show="debts.length === 0" class="text-center py-12">
                            <i class="fas fa-check-circle text-6xl text-green-300 mb-4"></i>
                            <h3 class="text-xl font-semibold text-gray-700 mb-2">Tüm borçlar ödendi!</h3>
                            <p class="text-gray-500">Şu anda bekleyen borç bulunmuyor.</p>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Raporlar Sayfası -->
            <div x-show="currentPage === 'reports'">
                <div class="mb-6 flex items-center justify-between">
                    <h1 class="text-2xl font-bold text-gray-900 flex items-center">
                        <i class="fas fa-chart-bar text-gray-600 mr-3"></i>
                        Raporlar
                    </h1>
                    <button @click="refreshReports()" 
                            class="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors">
                        <i class="fas fa-sync-alt mr-2"></i>
                        Yenile
                    </button>
                </div>

                <!-- Rapor Kategorileri -->
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <!-- Satış Raporları -->
                    <div class="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                        <h3 class="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                            <i class="fas fa-shopping-cart text-green-600 mr-2"></i>
                            Satış Raporları
                        </h3>
                        <div class="space-y-3">
                            <button class="w-full text-left p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                                <div class="font-medium text-gray-900">Günlük Satış</div>
                                <div class="text-sm text-gray-500">Bugünün satış detayları</div>
                            </button>
                            <button class="w-full text-left p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                                <div class="font-medium text-gray-900">Aylık Satış</div>
                                <div class="text-sm text-gray-500">Bu ay satış özeti</div>
                            </button>
                            <button class="w-full text-left p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                                <div class="font-medium text-gray-900">En Çok Satanlar</div>
                                <div class="text-sm text-gray-500">Popüler ürünler</div>
                            </button>
                        </div>
                    </div>

                    <!-- Stok Raporları -->
                    <div class="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                        <h3 class="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                            <i class="fas fa-boxes text-orange-600 mr-2"></i>
                            Stok Raporları
                        </h3>
                        <div class="space-y-3">
                            <button class="w-full text-left p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                                <div class="font-medium text-gray-900">Mevcut Stoklar</div>
                                <div class="text-sm text-gray-500">Tüm ürün stok durumu</div>
                            </button>
                            <button class="w-full text-left p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                                <div class="font-medium text-gray-900">Düşük Stoklar</div>
                                <div class="text-sm text-gray-500">Kritik seviyedeki ürünler</div>
                            </button>
                            <button class="w-full text-left p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                                <div class="font-medium text-gray-900">Stok Hareketleri</div>
                                <div class="text-sm text-gray-500">Giriş ve çıkış işlemleri</div>
                            </button>
                        </div>
                    </div>

                    <!-- Mali Raporlar -->
                    <div class="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                        <h3 class="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                            <i class="fas fa-chart-line text-blue-600 mr-2"></i>
                            Mali Raporlar
                        </h3>
                        <div class="space-y-3">
                            <button class="w-full text-left p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                                <div class="font-medium text-gray-900">Kâr-Zarar</div>
                                <div class="text-sm text-gray-500">Gelir ve gider analizi</div>
                            </button>
                            <button class="w-full text-left p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                                <div class="font-medium text-gray-900">Alacak-Verecek</div>
                                <div class="text-sm text-gray-500">Müşteri borçları</div>
                            </button>
                            <button class="w-full text-left p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                                <div class="font-medium text-gray-900">Ödeme Analizi</div>
                                <div class="text-sm text-gray-500">Ödeme türleri dağılımı</div>
                            </button>
                        </div>
                    </div>
                </div>

                <!-- Rapor Geliştirme Notu -->
                <div class="mt-8 bg-blue-50 border border-blue-200 p-6 rounded-xl">
                    <div class="flex items-center mb-3">
                        <i class="fas fa-info-circle text-blue-600 mr-2"></i>
                        <h4 class="font-semibold text-blue-900">Raporlar Geliştiriliyor</h4>
                    </div>
                    <p class="text-blue-800 text-sm">
                        Detaylı rapor sayfaları ve grafik analizler yakında eklenecektir. 
                        Şu anda Dashboard üzerindeki özet bilgileri kullanabilirsiniz.
                    </p>
                </div>
            </div>

            <!-- Other Pages Placeholder -->
            <div x-show="!['dashboard', 'products', 'categories', 'pos', 'customers', 'debts', 'reports'].includes(currentPage)">
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

    <!-- Modals -->
    
    <!-- Ürün Ekleme Modal -->
    <div x-show="showAddProduct" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" x-cloak>
        <div class="bg-white rounded-xl p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
            <div class="flex items-center justify-between mb-6">
                <h2 class="text-xl font-bold text-gray-900">
                    <i class="fas fa-plus text-blue-600 mr-2"></i>
                    Yeni Ürün Ekle
                </h2>
                <button @click="showAddProduct = false" class="text-gray-400 hover:text-gray-600">
                    <i class="fas fa-times text-xl"></i>
                </button>
            </div>

            <form @submit.prevent="addProduct()">
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div class="md:col-span-2">
                        <label class="block text-sm font-medium text-gray-700 mb-2">Ürün Adı *</label>
                        <input type="text" x-model="productForm.ad" required 
                               class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                    </div>
                    
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">Barkod</label>
                        <input type="text" x-model="productForm.barkod" 
                               class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                    </div>
                    
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">Kategori</label>
                        <select x-model="productForm.kategori_id" 
                                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                            <option value="">Kategori Seçin</option>
                            <template x-for="category in categories" :key="category.id">
                                <option :value="category.id" x-text="category.ad"></option>
                            </template>
                        </select>
                    </div>
                    
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">Alış Fiyatı</label>
                        <input type="number" step="0.01" x-model="productForm.alis_fiyati" 
                               class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                    </div>
                    
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">Satış Fiyatı *</label>
                        <input type="number" step="0.01" x-model="productForm.satis_fiyati" required 
                               class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                    </div>
                    
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">Başlangıç Stok</label>
                        <input type="number" x-model="productForm.stok_miktari" 
                               class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                    </div>
                    
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">Min Stok Seviyesi</label>
                        <input type="number" x-model="productForm.min_stok_seviyesi" 
                               class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                    </div>
                    
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">Birim</label>
                        <select x-model="productForm.birim" 
                                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                            <option value="adet">Adet</option>
                            <option value="kg">Kg</option>
                            <option value="gram">Gram</option>
                            <option value="litre">Litre</option>
                            <option value="metre">Metre</option>
                            <option value="paket">Paket</option>
                        </select>
                    </div>
                    
                    <div class="md:col-span-2">
                        <label class="block text-sm font-medium text-gray-700 mb-2">Açıklama</label>
                        <textarea x-model="productForm.aciklama" rows="3" 
                                  class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"></textarea>
                    </div>
                </div>

                <div class="flex justify-end space-x-4 mt-6">
                    <button type="button" @click="showAddProduct = false" 
                            class="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors">
                        İptal
                    </button>
                    <button type="submit" 
                            class="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                        <i class="fas fa-save mr-2"></i>
                        Kaydet
                    </button>
                </div>
            </form>
        </div>
    </div>

    <!-- Kategori Ekleme Modal -->
    <div x-show="showAddCategory" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" x-cloak>
        <div class="bg-white rounded-xl p-6 w-full max-w-lg mx-4">
            <div class="flex items-center justify-between mb-6">
                <h2 class="text-xl font-bold text-gray-900">
                    <i class="fas fa-tags text-yellow-600 mr-2"></i>
                    Yeni Kategori
                </h2>
                <button @click="showAddCategory = false" class="text-gray-400 hover:text-gray-600">
                    <i class="fas fa-times text-xl"></i>
                </button>
            </div>

            <form @submit.prevent="addCategory()">
                <div class="space-y-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">Kategori Adı *</label>
                        <input type="text" x-model="categoryForm.ad" required 
                               class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                    </div>
                    
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">Renk</label>
                        <div class="flex items-center space-x-2">
                            <input type="color" x-model="categoryForm.renk" 
                                   class="w-12 h-10 border border-gray-300 rounded cursor-pointer">
                            <input type="text" x-model="categoryForm.renk" 
                                   class="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                        </div>
                    </div>
                    
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">Açıklama</label>
                        <textarea x-model="categoryForm.aciklama" rows="3" 
                                  class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"></textarea>
                    </div>
                </div>

                <div class="flex justify-end space-x-4 mt-6">
                    <button type="button" @click="showAddCategory = false" 
                            class="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors">
                        İptal
                    </button>
                    <button type="submit" 
                            class="bg-yellow-600 text-white px-4 py-2 rounded-lg hover:bg-yellow-700 transition-colors">
                        <i class="fas fa-save mr-2"></i>
                        Kaydet
                    </button>
                </div>
            </form>
        </div>
    </div>

    <!-- Stok Güncelleme Modal -->
    <div x-show="showStockUpdate" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" x-cloak>
        <div class="bg-white rounded-xl p-6 w-full max-w-md mx-4">
            <div class="flex items-center justify-between mb-6">
                <h2 class="text-xl font-bold text-gray-900">
                    <i class="fas fa-boxes text-green-600 mr-2"></i>
                    Stok Güncelle
                </h2>
                <button @click="showStockUpdate = false" class="text-gray-400 hover:text-gray-600">
                    <i class="fas fa-times text-xl"></i>
                </button>
            </div>

            <div x-show="selectedProduct">
                <div class="bg-gray-50 p-4 rounded-lg mb-4">
                    <h3 class="font-semibold text-gray-900" x-text="selectedProduct?.ad"></h3>
                    <p class="text-sm text-gray-600">
                        Mevcut Stok: <span class="font-medium" x-text="selectedProduct?.stok_miktari"></span>
                        <span x-text="selectedProduct?.birim"></span>
                    </p>
                </div>

                <form @submit.prevent="updateStock()">
                    <div class="space-y-4">
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">Yeni Stok Miktarı *</label>
                            <input type="number" x-model="newStockAmount" required 
                                   class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                        </div>
                        
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">Açıklama</label>
                            <textarea x-model="stockUpdateNote" rows="2" 
                                      placeholder="Stok güncelleme nedeni..." 
                                      class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"></textarea>
                        </div>
                    </div>

                    <div class="flex justify-end space-x-4 mt-6">
                        <button type="button" @click="showStockUpdate = false" 
                                class="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors">
                            İptal
                        </button>
                        <button type="submit" 
                                class="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors">
                            <i class="fas fa-save mr-2"></i>
                            Güncelle
                        </button>
                    </div>
                </form>
            </div>
        </div>
    </div>

    <style>
        [x-cloak] { display: none !important; }
    </style>

    <script src="js/app.js"></script>
</body>
</html>