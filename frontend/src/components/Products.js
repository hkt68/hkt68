import { useState, useEffect } from 'react';
import axios from 'axios';

const Products = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    category_id: '',
    sku: '',
    barcode: '',
    description: '',
    cost_price: '',
    selling_price: '',
    min_stock_level: '',
    max_stock_level: '',
    image_url: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [filters, setFilters] = useState({
    search: '',
    category_id: '',
    low_stock_only: false
  });

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [filters]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [productsResponse, categoriesResponse] = await Promise.all([
        axios.get('/products'),
        axios.get('/categories')
      ]);
      setProducts(productsResponse.data);
      setCategories(categoriesResponse.data);
    } catch (err) {
      setError('Veriler yüklenirken hata oluştu');
      console.error('Data fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchProducts = async () => {
    try {
      const params = new URLSearchParams();
      if (filters.search) params.append('search', filters.search);
      if (filters.category_id) params.append('category_id', filters.category_id);
      if (filters.low_stock_only) params.append('low_stock_only', 'true');
      
      const response = await axios.get(`/products?${params}`);
      setProducts(response.data);
    } catch (err) {
      console.error('Products fetch error:', err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.category_id) return;

    try {
      setSubmitting(true);
      
      // Convert numeric fields
      const submitData = {
        ...formData,
        cost_price: parseFloat(formData.cost_price) || 0,
        selling_price: parseFloat(formData.selling_price) || 0,
        min_stock_level: parseInt(formData.min_stock_level) || 0,
        max_stock_level: formData.max_stock_level ? parseInt(formData.max_stock_level) : null
      };
      
      if (editingProduct) {
        await axios.put(`/products/${editingProduct.id}`, submitData);
      } else {
        await axios.post('/products', submitData);
      }
      
      await fetchProducts();
      resetForm();
    } catch (err) {
      setError(editingProduct ? 'Ürün güncellenirken hata oluştu' : 'Ürün eklenirken hata oluştu');
      console.error('Product submit error:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      category_id: product.category_id,
      sku: product.sku || '',
      barcode: product.barcode || '',
      description: product.description || '',
      cost_price: product.cost_price.toString(),
      selling_price: product.selling_price.toString(),
      min_stock_level: product.min_stock_level.toString(),
      max_stock_level: product.max_stock_level?.toString() || '',
      image_url: product.image_url || ''
    });
    setShowForm(true);
  };

  const handleDelete = async (productId) => {
    if (!window.confirm('Bu ürünü silmek istediğinizden emin misiniz?')) return;

    try {
      await axios.delete(`/products/${productId}`);
      await fetchProducts();
    } catch (err) {
      setError('Ürün silinirken hata oluştu');
      console.error('Delete product error:', err);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      category_id: '',
      sku: '',
      barcode: '',
      description: '',
      cost_price: '',
      selling_price: '',
      min_stock_level: '',
      max_stock_level: '',
      image_url: ''
    });
    setEditingProduct(null);
    setShowForm(false);
    setError(null);
  };

  const getCategoryName = (categoryId) => {
    const category = categories.find(c => c.id === categoryId);
    return category ? category.name : 'Bilinmeyen Kategori';
  };

  const getStockStatus = (product) => {
    if (product.current_stock === 0) return { text: 'Stokta Yok', class: 'status-out', color: 'text-red-600' };
    if (product.current_stock <= product.min_stock_level) return { text: 'Düşük Stok', class: 'status-low', color: 'text-orange-600' };
    return { text: 'Stokta Var', class: 'status-active', color: 'text-green-600' };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="spinner"></div>
        <span className="ml-2">Yükleniyor...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 fade-in">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold text-gray-800 flex items-center">
          <span className="mr-3">📦</span>
          Ürünler
        </h2>
        <button 
          onClick={() => setShowForm(true)}
          className="btn btn-primary"
          data-testid="add-product-btn"
        >
          <span>➕</span>
          Yeni Ürün
        </button>
      </div>

      {error && (
        <div className="alert alert-error">
          {error}
          <button onClick={() => setError(null)} className="ml-4 text-xl">×</button>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-lg p-4 shadow-sm" data-testid="product-filters">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="form-label">Ürün Ara</label>
            <input
              type="text"
              className="form-input"
              placeholder="Ürün adı, SKU veya barkod..."
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              data-testid="search-products-input"
            />
          </div>
          <div>
            <label className="form-label">Kategori</label>
            <select
              className="form-select"
              value={filters.category_id}
              onChange={(e) => setFilters({ ...filters, category_id: e.target.value })}
              data-testid="filter-category-select"
            >
              <option value="">Tüm Kategoriler</option>
              {categories.map(category => (
                <option key={category.id} value={category.id}>{category.name}</option>
              ))}
            </select>
          </div>
          <div className="flex items-end">
            <label className="flex items-center">
              <input
                type="checkbox"
                className="mr-2"
                checked={filters.low_stock_only}
                onChange={(e) => setFilters({ ...filters, low_stock_only: e.target.checked })}
                data-testid="low-stock-filter-checkbox"
              />
              <span className="text-sm">Sadece Düşük Stok</span>
            </label>
          </div>
          <div className="flex items-end">
            <button 
              onClick={() => setFilters({ search: '', category_id: '', low_stock_only: false })}
              className="btn btn-secondary w-full"
              data-testid="clear-filters-btn"
            >
              Filtreleri Temizle
            </button>
          </div>
        </div>
      </div>

      {/* Product Form Modal */}
      {showForm && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && resetForm()}>
          <div className="modal-content p-6 w-full max-w-2xl max-h-90vh overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold">
                {editingProduct ? 'Ürün Düzenle' : 'Yeni Ürün Ekle'}
              </h3>
              <button 
                onClick={resetForm}
                className="text-gray-400 hover:text-gray-600 text-2xl"
              >
                ×
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="form-group">
                  <label className="form-label">Ürün Adı *</label>
                  <input
                    type="text"
                    className="form-input"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Örn: Samsung Galaxy S23"
                    required
                    data-testid="product-name-input"
                  />
                </div>
                
                <div className="form-group">
                  <label className="form-label">Kategori *</label>
                  <select
                    className="form-select"
                    value={formData.category_id}
                    onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                    required
                    data-testid="product-category-select"
                  >
                    <option value="">Kategori Seçin</option>
                    {categories.map(category => (
                      <option key={category.id} value={category.id}>{category.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="form-group">
                  <label className="form-label">SKU</label>
                  <input
                    type="text"
                    className="form-input"
                    value={formData.sku}
                    onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                    placeholder="Örn: SAM-GAL-S23"
                    data-testid="product-sku-input"
                  />
                </div>
                
                <div className="form-group">
                  <label className="form-label">Barkod</label>
                  <input
                    type="text"
                    className="form-input"
                    value={formData.barcode}
                    onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                    placeholder="Örn: 1234567890123"
                    data-testid="product-barcode-input"
                  />
                </div>
              </div>
              
              <div className="form-group">
                <label className="form-label">Açıklama</label>
                <textarea
                  className="form-input"
                  rows="2"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Ürün hakkında detaylar..."
                  data-testid="product-description-input"
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="form-group">
                  <label className="form-label">Maliyet Fiyatı (₺)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    className="form-input"
                    value={formData.cost_price}
                    onChange={(e) => setFormData({ ...formData, cost_price: e.target.value })}
                    placeholder="0.00"
                    data-testid="product-cost-price-input"
                  />
                </div>
                
                <div className="form-group">
                  <label className="form-label">Satış Fiyatı (₺)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    className="form-input"
                    value={formData.selling_price}
                    onChange={(e) => setFormData({ ...formData, selling_price: e.target.value })}
                    placeholder="0.00"
                    data-testid="product-selling-price-input"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="form-group">
                  <label className="form-label">Minimum Stok Seviyesi</label>
                  <input
                    type="number"
                    min="0"
                    className="form-input"
                    value={formData.min_stock_level}
                    onChange={(e) => setFormData({ ...formData, min_stock_level: e.target.value })}
                    placeholder="0"
                    data-testid="product-min-stock-input"
                  />
                </div>
                
                <div className="form-group">
                  <label className="form-label">Maksimum Stok Seviyesi</label>
                  <input
                    type="number"
                    min="0"
                    className="form-input"
                    value={formData.max_stock_level}
                    onChange={(e) => setFormData({ ...formData, max_stock_level: e.target.value })}
                    placeholder="Boş bırakılabilir"
                    data-testid="product-max-stock-input"
                  />
                </div>
              </div>
              
              <div className="form-group">
                <label className="form-label">Ürün Resmi URL</label>
                <input
                  type="url"
                  className="form-input"
                  value={formData.image_url}
                  onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                  placeholder="https://example.com/product-image.jpg"
                  data-testid="product-image-url-input"
                />
              </div>
              
              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  className="btn btn-primary flex-1"
                  disabled={submitting || !formData.name.trim() || !formData.category_id}
                  data-testid="save-product-btn"
                >
                  {submitting ? (
                    <><div className="spinner"></div> Kaydediliyor...</>
                  ) : (
                    <><span>💾</span> {editingProduct ? 'Güncelle' : 'Kaydet'}</>
                  )}
                </button>
                <button
                  type="button"
                  onClick={resetForm}
                  className="btn btn-secondary"
                  data-testid="cancel-product-btn"
                >
                  İptal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Products Table */}
      <div className="table-container" data-testid="products-table">
        <div className="table-header p-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Ürün Listesi ({products.length})</h3>
            <button 
              onClick={fetchProducts}
              className="btn btn-secondary btn-sm"
              data-testid="refresh-products-btn"
            >
              🔄 Yenile
            </button>
          </div>
        </div>
        
        {products.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="table-header">
                <tr>
                  <th className="text-left p-3">Ürün</th>
                  <th className="text-left p-3">Kategori</th>
                  <th className="text-left p-3">SKU/Barkod</th>
                  <th className="text-center p-3">Mevcut Stok</th>
                  <th className="text-left p-3">Fiyatlar</th>
                  <th className="text-left p-3">Durum</th>
                  <th className="text-center p-3">İşlemler</th>
                </tr>
              </thead>
              <tbody>
                {products.map((product) => {
                  const status = getStockStatus(product);
                  return (
                    <tr key={product.id} className="table-row">
                      <td className="p-3">
                        <div className="flex items-center">
                          {product.image_url && (
                            <img 
                              src={product.image_url} 
                              alt={product.name}
                              className="w-12 h-12 object-cover rounded mr-3"
                              onError={(e) => e.target.style.display = 'none'}
                            />
                          )}
                          <div>
                            <div className="font-semibold text-gray-800">{product.name}</div>
                            {product.description && (
                              <div className="text-sm text-gray-500 truncate max-w-xs">
                                {product.description}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="p-3">
                        <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm">
                          {getCategoryName(product.category_id)}
                        </span>
                      </td>
                      <td className="p-3">
                        <div className="text-sm">
                          {product.sku && <div><strong>SKU:</strong> {product.sku}</div>}
                          {product.barcode && <div><strong>Barkod:</strong> {product.barcode}</div>}
                        </div>
                      </td>
                      <td className="p-3 text-center">
                        <div className={`font-bold text-lg ${status.color}`}>
                          {product.current_stock}
                        </div>
                        <div className="text-xs text-gray-500">
                          Min: {product.min_stock_level}
                        </div>
                      </td>
                      <td className="p-3">
                        <div className="text-sm">
                          <div><strong>Maliyet:</strong> ₺{product.cost_price.toFixed(2)}</div>
                          <div><strong>Satış:</strong> ₺{product.selling_price.toFixed(2)}</div>
                        </div>
                      </td>
                      <td className="p-3">
                        <span className={`status-dot ${status.class}`}></span>
                        <span className={`text-sm ${status.color} font-medium`}>
                          {status.text}
                        </span>
                      </td>
                      <td className="p-3">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => handleEdit(product)}
                            className="btn btn-warning btn-sm"
                            data-testid={`edit-product-${product.id}`}
                          >
                            <span>✏️</span>
                          </button>
                          <button
                            onClick={() => handleDelete(product.id)}
                            className="btn btn-danger btn-sm"
                            data-testid={`delete-product-${product.id}`}
                          >
                            <span>🗑️</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-8 text-center text-gray-500">
            <div className="text-6xl mb-4">📦</div>
            <div className="text-xl mb-2">
              {filters.search || filters.category_id || filters.low_stock_only 
                ? 'Arama kriterlerinize uygun ürün bulunamadı' 
                : 'Henüz ürün eklenmemiş'
              }
            </div>
            {!filters.search && !filters.category_id && !filters.low_stock_only && (
              <>
                <div className="mb-4">Satış yapabilmek için önce ürünlerinizi ekleyin.</div>
                <button 
                  onClick={() => setShowForm(true)}
                  className="btn btn-primary"
                >
                  İlk Ürünü Ekle
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Products;