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
        }
    }
}