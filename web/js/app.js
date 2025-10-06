// Elit Bilişim - POS Sistemi
// Ana JavaScript Dosyası

function app() {
    return {
        // Sayfa durumu
        currentPage: 'dashboard',
        loading: false,
        
        // Veriler
        stats: {},
        products: [],
        categories: [],
        customers: [],
        sales: [],
        lowStockProducts: [],
        
        // Sayaçlar
        productCount: 0,
        categoryCount: 0,
        customerCount: 0,

        // Modal durumları
        showAddProduct: false,
        showEditProduct: false,
        showAddCategory: false,
        showStockUpdate: false,
        showLowStock: false,
        selectedProduct: null,
        selectedCategory: null,

        // Filtreleme
        productSearch: '',
        categoryFilter: '',
        stockFilter: '',
        filteredProducts: [],

        // Stok güncelleme
        newStockAmount: '',
        stockUpdateNote: '',

        // Form verileri
        productForm: {
            ad: '',
            barkod: '',
            kategori_id: '',
            alis_fiyati: '',
            satis_fiyati: '',
            stok_miktari: '',
            min_stok_seviyesi: 5,
            birim: 'adet',
            aciklama: ''
        },

        categoryForm: {
            ad: '',
            aciklama: '',
            renk: '#3B82F6'
        },

        customerForm: {
            ad: '',
            soyad: '',
            telefon: '',
            email: '',
            adres: '',
            borc_limiti: 0
        },

        // Başlatma
        init() {
            this.loadInitialData();
        },

        // İlk veri yükleme
        async loadInitialData() {
            await this.refreshStats();
            await this.loadProducts();
            await this.loadCategories(); 
            await this.loadCustomers();
            await this.loadLowStockProducts();
        },

        // İstatistikleri yenile
        async refreshStats() {
            try {
                const response = await fetch('api/sales.php/stats');
                this.stats = await response.json();
            } catch (error) {
                console.error('İstatistikler yüklenirken hata:', error);
            }
        },

        // Ürünleri yükle
        async loadProducts() {
            try {
                const response = await fetch('api/products.php');
                this.products = await response.json();
                this.productCount = this.products.length;
            } catch (error) {
                console.error('Ürünler yüklenirken hata:', error);
            }
        },

        // Kategorileri yükle
        async loadCategories() {
            try {
                const response = await fetch('api/categories.php');
                this.categories = await response.json();
                this.categoryCount = this.categories.length;
            } catch (error) {
                console.error('Kategoriler yüklenirken hata:', error);
            }
        },

        // Müşterileri yükle
        async loadCustomers() {
            try {
                const response = await fetch('api/customers.php');
                this.customers = await response.json();
                this.customerCount = this.customers.length;
            } catch (error) {
                console.error('Müşteriler yüklenirken hata:', error);
            }
        },

        // Düşük stoklu ürünleri yükle
        async loadLowStockProducts() {
            try {
                const response = await fetch('api/products.php/low-stock');
                this.lowStockProducts = await response.json();
            } catch (error) {
                console.error('Düşük stoklu ürünler yüklenirken hata:', error);
            }
        },

        // Sayfa başlığını getir
        getPageTitle() {
            const titles = {
                'dashboard': 'Dashboard',
                'products': 'Ürün Yönetimi', 
                'categories': 'Kategori Yönetimi',
                'pos': 'Satış İşlemleri',
                'customers': 'Müşteri Yönetimi',
                'sales': 'Satış Geçmişi',
                'debts': 'Borç Takibi',
                'reports': 'Raporlar'
            };
            return titles[this.currentPage] || 'Sayfa';
        },

        // Para formatla
        formatCurrency(amount) {
            return new Intl.NumberFormat('tr-TR', {
                style: 'currency',
                currency: 'TRY',
                minimumFractionDigits: 2
            }).format(amount || 0);
        },

        // Tarih formatla
        formatDate(dateString) {
            return new Date(dateString).toLocaleDateString('tr-TR', {
                day: '2-digit',
                month: '2-digit', 
                year: 'numeric'
            });
        },

        // Tarih ve saat formatla
        formatDateTime(dateString) {
            return new Date(dateString).toLocaleString('tr-TR', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        },

        // Başarı mesajı göster
        showSuccess(message) {
            // Basit alert - gerçek uygulamada toast notification kullanılabilir
            alert('✅ ' + message);
        },

        // Hata mesajı göster
        showError(message) {
            alert('❌ ' + message);
        },

        // Onay mesajı göster
        confirmAction(message) {
            return confirm('⚠️ ' + message);
        },

        // Form sıfırla
        resetForms() {
            this.productForm = {
                ad: '',
                barkod: '',
                kategori_id: '',
                alis_fiyati: '',
                satis_fiyati: '',
                stok_miktari: '',
                min_stok_seviyesi: 5,
                birim: 'adet',
                aciklama: ''
            };

            this.categoryForm = {
                ad: '',
                aciklama: '',
                renk: '#3B82F6'
            };

            this.customerForm = {
                ad: '',
                soyad: '',
                telefon: '',
                email: '',
                adres: '',
                borc_limiti: 0
            };

            this.newStockAmount = '';
            this.stockUpdateNote = '';
        },

        // Ürün işlemleri
        async refreshProducts() {
            await this.loadProducts();
            this.filterProducts();
        },

        async addProduct() {
            try {
                const response = await fetch('api/products.php', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(this.productForm)
                });

                const result = await response.json();
                
                if (result.success) {
                    this.showSuccess('Ürün başarıyla eklendi!');
                    this.showAddProduct = false;
                    this.resetForms();
                    await this.refreshProducts();
                    await this.loadInitialData();
                } else {
                    this.showError(result.error || 'Ürün eklenirken hata oluştu');
                }
            } catch (error) {
                this.showError('Bağlantı hatası: ' + error.message);
            }
        },

        editProduct(product) {
            this.productForm = {
                ad: product.ad,
                barkod: product.barkod || '',
                kategori_id: product.kategori_id || '',
                alis_fiyati: product.alis_fiyati || '',
                satis_fiyati: product.satis_fiyati,
                min_stok_seviyesi: product.min_stok_seviyesi || 5,
                birim: product.birim || 'adet',
                aciklama: product.aciklama || ''
            };
            this.selectedProduct = product;
            this.showEditProduct = true;
        },

        async updateProduct() {
            try {
                const response = await fetch(`api/products.php/${this.selectedProduct.id}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(this.productForm)
                });

                const result = await response.json();
                
                if (result.success) {
                    this.showSuccess('Ürün başarıyla güncellendi!');
                    this.showEditProduct = false;
                    this.resetForms();
                    await this.refreshProducts();
                } else {
                    this.showError(result.error || 'Ürün güncellenirken hata oluştu');
                }
            } catch (error) {
                this.showError('Bağlantı hatası: ' + error.message);
            }
        },

        async deleteProduct(id) {
            if (!this.confirmAction('Bu ürünü silmek istediğinizden emin misiniz?')) {
                return;
            }

            try {
                const response = await fetch(`api/products.php/${id}`, {
                    method: 'DELETE'
                });

                const result = await response.json();
                
                if (result.success) {
                    this.showSuccess('Ürün başarıyla silindi!');
                    await this.refreshProducts();
                    await this.loadInitialData();
                } else {
                    this.showError(result.error || 'Ürün silinirken hata oluştu');
                }
            } catch (error) {
                this.showError('Bağlantı hatası: ' + error.message);
            }
        },

        async updateStock() {
            if (!this.selectedProduct || !this.newStockAmount) return;

            try {
                const response = await fetch(`api/products.php/${this.selectedProduct.id}/stock`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        yeni_stok: this.newStockAmount,
                        aciklama: this.stockUpdateNote || 'Stok güncelleme'
                    })
                });

                const result = await response.json();
                
                if (result.success) {
                    this.showSuccess('Stok başarıyla güncellendi!');
                    this.showStockUpdate = false;
                    this.resetForms();
                    await this.refreshProducts();
                    await this.loadLowStockProducts();
                } else {
                    this.showError(result.error || 'Stok güncellenirken hata oluştu');
                }
            } catch (error) {
                this.showError('Bağlantı hatası: ' + error.message);
            }
        },

        // Kategori işlemleri
        async addCategory() {
            try {
                const response = await fetch('api/categories.php', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(this.categoryForm)
                });

                const result = await response.json();
                
                if (result.success) {
                    this.showSuccess('Kategori başarıyla eklendi!');
                    this.showAddCategory = false;
                    this.resetForms();
                    await this.loadCategories();
                } else {
                    this.showError(result.error || 'Kategori eklenirken hata oluştu');
                }
            } catch (error) {
                this.showError('Bağlantı hatası: ' + error.message);
            }
        },

        editCategory(category) {
            this.categoryForm = {
                ad: category.ad,
                aciklama: category.aciklama || '',
                renk: category.renk || '#3B82F6'
            };
            this.selectedCategory = category;
            this.showAddCategory = true;
        },

        async updateCategory() {
            try {
                const response = await fetch(`api/categories.php/${this.selectedCategory.id}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(this.categoryForm)
                });

                const result = await response.json();
                
                if (result.success) {
                    this.showSuccess('Kategori başarıyla güncellendi!');
                    this.showAddCategory = false;
                    this.resetForms();
                    await this.loadCategories();
                } else {
                    this.showError(result.error || 'Kategori güncellenirken hata oluştu');
                }
            } catch (error) {
                this.showError('Bağlantı hatası: ' + error.message);
            }
        },

        async deleteCategory(id) {
            if (!this.confirmAction('Bu kategoriyi silmek istediğinizden emin misiniz?')) {
                return;
            }

            try {
                const response = await fetch(`api/categories.php/${id}`, {
                    method: 'DELETE'
                });

                const result = await response.json();
                
                if (result.success) {
                    this.showSuccess('Kategori başarıyla silindi!');
                    await this.loadCategories();
                } else {
                    this.showError(result.error || 'Kategori silinirken hata oluştu');
                }
            } catch (error) {
                this.showError('Bağlantı hatası: ' + error.message);
            }
        },

        // Filtreleme
        filterProducts() {
            this.filteredProducts = this.products.filter(product => {
                // Arama filtresi
                const searchMatch = !this.productSearch || 
                    product.ad.toLowerCase().includes(this.productSearch.toLowerCase()) ||
                    (product.barkod && product.barkod.toLowerCase().includes(this.productSearch.toLowerCase()));

                // Kategori filtresi
                const categoryMatch = !this.categoryFilter || 
                    product.kategori_id == this.categoryFilter;

                // Stok filtresi
                let stockMatch = true;
                if (this.stockFilter === 'normal') {
                    stockMatch = product.stok_miktari > product.min_stok_seviyesi;
                } else if (this.stockFilter === 'low') {
                    stockMatch = product.stok_miktari <= product.min_stok_seviyesi && product.stok_miktari > 0;
                } else if (this.stockFilter === 'out') {
                    stockMatch = product.stok_miktari <= 0;
                }

                return searchMatch && categoryMatch && stockMatch;
            });
        }
    }
}