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
        showAddCustomer: false,
        showStockUpdate: false,
        showLowStock: false,
        selectedProduct: null,
        selectedCategory: null,

        // Filtreleme
        productSearch: '',
        categoryFilter: '',
        stockFilter: '',
        filteredProducts: [],
        customerSearch: '',
        filteredCustomers: [],

        // Borç takibi
        debts: [],
        totalDebtAmount: 0,
        overdueCount: 0,
        thisWeekCount: 0,

        // Stok güncelleme
        newStockAmount: '',
        stockUpdateNote: '',

        // POS sistem
        productSearchPos: '',
        posCategory: '',
        filteredPosProducts: [],
        saleItems: [],
        selectedCustomer: '',
        paymentType: 'nakit',
        paidAmount: '',
        dueDate: '',
        saleTotal: 0,

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
            // İlk filtreleme
            this.$watch('products', () => {
                this.filterProducts();
                this.filterPosProducts();
            });
        },

        // İlk veri yükleme
        async loadInitialData() {
            await this.refreshStats();
            await this.loadProducts();
            await this.loadCategories(); 
            await this.loadCustomers();
            await this.loadLowStockProducts();
            await this.loadDebts();
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
        },

        // POS Fonksiyonları
        searchProductsPos() {
            this.filterPosProducts();
        },

        clearProductSearch() {
            this.productSearchPos = '';
            this.filterPosProducts();
        },

        filterPosProducts() {
            this.filteredPosProducts = this.products.filter(product => {
                // Sadece aktif ve stokta olan ürünler
                if (!product.aktif) return false;

                // Arama filtresi
                const searchMatch = !this.productSearchPos || 
                    product.ad.toLowerCase().includes(this.productSearchPos.toLowerCase()) ||
                    (product.barkod && product.barkod.toLowerCase().includes(this.productSearchPos.toLowerCase()));

                // Kategori filtresi
                const categoryMatch = !this.posCategory || 
                    product.kategori_id == this.posCategory;

                return searchMatch && categoryMatch;
            });
        },

        addToSale(product) {
            if (product.stok_miktari <= 0) {
                this.showError('Bu ürünün stoğu yok!');
                return;
            }

            // Sepette var mı kontrol et
            const existingIndex = this.saleItems.findIndex(item => item.id === product.id);
            
            if (existingIndex !== -1) {
                // Stok kontrolü
                if (this.saleItems[existingIndex].quantity >= product.stok_miktari) {
                    this.showError('Yetersiz stok!');
                    return;
                }
                this.saleItems[existingIndex].quantity++;
            } else {
                // Yeni ürün ekle
                this.saleItems.push({
                    id: product.id,
                    name: product.ad,
                    price: product.satis_fiyati,
                    quantity: 1,
                    stock: product.stok_miktari,
                    unit: product.birim || 'adet'
                });
            }

            this.calculateSaleTotal();
        },

        updateQuantity(index, change) {
            const newQuantity = this.saleItems[index].quantity + change;
            
            if (newQuantity <= 0) {
                this.removeFromSale(index);
                return;
            }

            if (newQuantity > this.saleItems[index].stock) {
                this.showError('Yetersiz stok!');
                return;
            }

            this.saleItems[index].quantity = newQuantity;
            this.calculateSaleTotal();
        },

        removeFromSale(index) {
            this.saleItems.splice(index, 1);
            this.calculateSaleTotal();
        },

        calculateSaleTotal() {
            this.saleTotal = this.saleItems.reduce((total, item) => {
                return total + (item.price * item.quantity);
            }, 0);
        },

        calculateChange() {
            // Para üstü hesaplama otomatik yapılıyor (template'te)
        },

        clearSale() {
            if (this.saleItems.length > 0) {
                if (!this.confirmAction('Sepeti temizlemek istediğinizden emin misiniz?')) {
                    return;
                }
            }
            
            this.saleItems = [];
            this.selectedCustomer = '';
            this.paymentType = 'nakit';
            this.paidAmount = '';
            this.dueDate = '';
            this.saleTotal = 0;
        },

        async completeSale() {
            if (this.saleItems.length === 0) {
                this.showError('Sepette ürün bulunmamaktadır!');
                return;
            }

            if (!this.paidAmount && this.paymentType !== 'veresiye') {
                this.showError('Ödenen tutarı giriniz!');
                return;
            }

            const saleData = {
                musteri_id: this.selectedCustomer || null,
                toplam_tutar: this.saleTotal,
                odenen_tutar: parseFloat(this.paidAmount || 0),
                odeme_turu: this.paymentType,
                vade_tarihi: this.dueDate || null,
                aciklama: `POS Satış - ${this.saleItems.length} ürün`,
                urunler: this.saleItems.map(item => ({
                    id: item.id,
                    miktar: item.quantity,
                    fiyat: item.price
                }))
            };

            try {
                const response = await fetch('api/sales.php', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(saleData)
                });

                const result = await response.json();
                
                if (result.success) {
                    // Para üstü varsa göster
                    const change = parseFloat(this.paidAmount || 0) - this.saleTotal;
                    let message = `Satış başarıyla tamamlandı!\nSatış No: ${result.satis_id}`;
                    
                    if (change > 0) {
                        message += `\n\nPara Üstü: ${this.formatCurrency(change)}`;
                    } else if (change < 0) {
                        message += `\n\nKalan Borç: ${this.formatCurrency(Math.abs(change))}`;
                        if (this.dueDate) {
                            message += `\nVade Tarihi: ${this.formatDate(this.dueDate)}`;
                        }
                    }

                    this.showSuccess(message);
                    this.clearSale();
                    
                    // Verileri yenile
                    await this.loadInitialData();
                    await this.filterPosProducts();
                    
                } else {
                    this.showError(result.error || 'Satış işlemi sırasında hata oluştu');
                }
            } catch (error) {
                this.showError('Bağlantı hatası: ' + error.message);
            }
        },

        // Müşteri Fonksiyonları
        async refreshCustomers() {
            await this.loadCustomers();
            this.filterCustomers();
        },

        filterCustomers() {
            this.filteredCustomers = this.customers.filter(customer => {
                const searchMatch = !this.customerSearch ||
                    customer.ad.toLowerCase().includes(this.customerSearch.toLowerCase()) ||
                    (customer.soyad && customer.soyad.toLowerCase().includes(this.customerSearch.toLowerCase())) ||
                    (customer.telefon && customer.telefon.includes(this.customerSearch));

                return searchMatch;
            });
        },

        async addCustomer() {
            try {
                const response = await fetch('api/customers.php', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(this.customerForm)
                });

                const result = await response.json();
                
                if (result.success) {
                    this.showSuccess('Müşteri başarıyla eklendi!');
                    this.showAddCustomer = false;
                    this.resetForms();
                    await this.refreshCustomers();
                } else {
                    this.showError(result.error || 'Müşteri eklenirken hata oluştu');
                }
            } catch (error) {
                this.showError('Bağlantı hatası: ' + error.message);
            }
        },

        editCustomer(customer) {
            this.customerForm = {
                ad: customer.ad,
                soyad: customer.soyad || '',
                telefon: customer.telefon || '',
                email: customer.email || '',
                adres: customer.adres || '',
                borc_limiti: customer.borc_limiti || 0
            };
            this.selectedCustomer = customer;
            this.showAddCustomer = true;
        },

        async deleteCustomer(id) {
            if (!this.confirmAction('Bu müşteriyi silmek istediğinizden emin misiniz?')) {
                return;
            }

            try {
                const response = await fetch(`api/customers.php/${id}`, {
                    method: 'DELETE'
                });

                const result = await response.json();
                
                if (result.success) {
                    this.showSuccess('Müşteri başarıyla silindi!');
                    await this.refreshCustomers();
                } else {
                    this.showError(result.error || 'Müşteri silinirken hata oluştu');
                }
            } catch (error) {
                this.showError('Bağlantı hatası: ' + error.message);
            }
        },

        // Borç Takibi
        async loadDebts() {
            try {
                const response = await fetch('api/sales.php/debts');
                this.debts = await response.json();
                
                // İstatistikleri hesapla
                this.totalDebtAmount = this.debts.reduce((sum, debt) => sum + debt.kalan_borc, 0);
                this.overdueCount = this.debts.filter(debt => debt.geciken_gun > 0).length;
                this.thisWeekCount = this.debts.filter(debt => debt.geciken_gun >= -7 && debt.geciken_gun <= 0).length;
                
            } catch (error) {
                console.error('Borçlar yüklenirken hata:', error);
            }
        },

        async refreshDebts() {
            await this.loadDebts();
        },

        async showPaymentModal(debt) {
            // Ödeme modal'ı göster - basit prompt ile
            const payment = prompt(`${debt.musteri_ad} için ödeme tutarını giriniz:\n\nKalan Borç: ${this.formatCurrency(debt.kalan_borc)}`);
            
            if (payment && parseFloat(payment) > 0) {
                await this.addPayment(debt.id, parseFloat(payment));
            }
        },

        async addPayment(saleId, amount) {
            try {
                const response = await fetch('api/sales.php/payment', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        satis_id: saleId,
                        odeme_tutari: amount,
                        odeme_turu: 'nakit',
                        aciklama: 'Manuel ödeme'
                    })
                });

                const result = await response.json();
                
                if (result.success) {
                    this.showSuccess('Ödeme başarıyla kaydedildi!');
                    await this.refreshDebts();
                    await this.refreshStats();
                } else {
                    this.showError(result.error || 'Ödeme kaydedilirken hata oluştu');
                }
            } catch (error) {
                this.showError('Bağlantı hatası: ' + error.message);
            }
        },

        async deleteSale(id) {
            if (!this.confirmAction('Bu satışı iptal etmek istediğinizden emin misiniz?\n\nBu işlem geri alınamaz ve stoklar iade edilecektir.')) {
                return;
            }

            try {
                const response = await fetch(`api/sales.php/${id}`, {
                    method: 'DELETE'
                });

                const result = await response.json();
                
                if (result.success) {
                    this.showSuccess('Satış başarıyla iptal edildi ve stoklar iade edildi!');
                    await this.refreshDebts();
                    await this.loadInitialData();
                } else {
                    this.showError(result.error || 'Satış iptal edilirken hata oluştu');
                }
            } catch (error) {
                this.showError('Bağlantı hatası: ' + error.message);
            }
        },

        // Raporlar
        refreshReports() {
            this.showSuccess('Raporlar sayfası geliştirme aşamasında!');
        }
    }
}