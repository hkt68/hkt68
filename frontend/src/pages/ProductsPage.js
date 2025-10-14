import { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import axios from 'axios';
import { Plus, Edit, Trash2, Star } from 'lucide-react';
import { toast, Toaster } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

function ProductsPage({ user, onLogout }) {
  const [products, setProducts] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [formData, setFormData] = useState({
    barcode: '',
    name: '',
    category: '',
    purchase_price: '',
    sale_price: '',
    vat_rate: 18,
    stock: 0,
    is_favorite: false
  });

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      const response = await axios.get(`${API}/products`);
      setProducts(response.data);
    } catch (error) {
      toast.error('Ürünler yüklenemedi');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      if (editingProduct) {
        await axios.put(`${API}/products/${editingProduct.id}`, formData);
        toast.success('Ürün güncellendi');
      } else {
        await axios.post(`${API}/products`, formData);
        toast.success('Ürün eklendi');
      }
      
      setShowModal(false);
      resetForm();
      loadProducts();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'İşlem başarısız');
    }
  };

  const handleEdit = (product) => {
    setEditingProduct(product);
    setFormData({
      barcode: product.barcode,
      name: product.name,
      category: product.category,
      purchase_price: product.purchase_price,
      sale_price: product.sale_price,
      vat_rate: product.vat_rate,
      stock: product.stock,
      is_favorite: product.is_favorite
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Bu ürünü silmek istediğinize emin misiniz?')) return;
    
    try {
      await axios.delete(`${API}/products/${id}`);
      toast.success('Ürün silindi');
      loadProducts();
    } catch (error) {
      toast.error('Ürün silinemedi');
    }
  };

  const resetForm = () => {
    setFormData({
      barcode: '',
      name: '',
      category: '',
      purchase_price: '',
      sale_price: '',
      vat_rate: 18,
      stock: 0,
      is_favorite: false
    });
    setEditingProduct(null);
  };

  return (
    <Layout user={user} onLogout={onLogout}>
      <Toaster position="top-right" richColors />
      
      <div className="page-header">
        <h2>Ürün Yönetimi</h2>
        <button 
          className="btn btn-primary"
          onClick={() => {
            resetForm();
            setShowModal(true);
          }}
          data-testid="add-product-button"
        >
          <Plus size={20} />
          Yeni Ürün
        </button>
      </div>

      <div className="card">
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Barkod</th>
                <th>Ürün Adı</th>
                <th>Kategori</th>
                <th>Alış</th>
                <th>Satış (KDV Dahil)</th>
                <th>KDV %</th>
                <th>Stok</th>
                <th>Favori</th>
                <th>İşlemler</th>
              </tr>
            </thead>
            <tbody>
              {products.map((product) => (
                <tr key={product.id}>
                  <td><strong>{product.barcode}</strong></td>
                  <td>{product.name}</td>
                  <td>{product.category || '-'}</td>
                  <td>{product.purchase_price.toFixed(2)} ₺</td>
                  <td>{product.sale_price.toFixed(2)} ₺</td>
                  <td>%{product.vat_rate}</td>
                  <td>
                    <span className={product.stock < 10 ? 'badge badge-danger' : 'badge badge-success'}>
                      {product.stock}
                    </span>
                  </td>
                  <td>
                    {product.is_favorite && <Star size={16} fill="gold" color="gold" />}
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button className="btn btn-secondary btn-sm" onClick={() => handleEdit(product)}>
                        <Edit size={16} />
                      </button>
                      <button className="btn btn-danger btn-sm" onClick={() => handleDelete(product.id)}>
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editingProduct ? 'Ürün Düzenle' : 'Yeni Ürün Ekle'}</h3>
              <button onClick={() => setShowModal(false)}>×</button>
            </div>
            
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="input-group">
                  <label>Barkod *</label>
                  <input
                    type="text"
                    value={formData.barcode}
                    onChange={(e) => setFormData({...formData, barcode: e.target.value})}
                    required
                  />
                </div>

                <div className="input-group">
                  <label>Ürün Adı *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    required
                  />
                </div>

                <div className="input-group">
                  <label>Kategori</label>
                  <input
                    type="text"
                    value={formData.category}
                    onChange={(e) => setFormData({...formData, category: e.target.value})}
                  />
                </div>

                <div className="input-group">
                  <label>Alış Fiyatı *</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.purchase_price}
                    onChange={(e) => setFormData({...formData, purchase_price: e.target.value})}
                    required
                  />
                </div>

                <div className="input-group">
                  <label>Satış Fiyatı (KDV Dahil) *</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.sale_price}
                    onChange={(e) => setFormData({...formData, sale_price: e.target.value})}
                    required
                  />
                </div>

                <div className="input-group">
                  <label>KDV Oranı (%)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.vat_rate}
                    onChange={(e) => setFormData({...formData, vat_rate: e.target.value})}
                  />
                </div>

                <div className="input-group">
                  <label>Stok</label>
                  <input
                    type="number"
                    value={formData.stock}
                    onChange={(e) => setFormData({...formData, stock: parseInt(e.target.value) || 0})}
                  />
                </div>

                <div className="checkbox-group">
                  <label>
                    <input
                      type="checkbox"
                      checked={formData.is_favorite}
                      onChange={(e) => setFormData({...formData, is_favorite: e.target.checked})}
                    />
                    <Star size={16} />
                    <span>Favori Ürün (POS'ta hızlı erişim)</span>
                  </label>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                  İptal
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingProduct ? 'Güncelle' : 'Ekle'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style jsx>{`
        .page-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 2rem;
        }

        .page-header h2 {
          font-size: 1.875rem;
          font-weight: 700;
          color: var(--text-primary);
        }

        .checkbox-group {
          margin-top: 1rem;
        }

        .checkbox-group label {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          cursor: pointer;
        }

        .checkbox-group input[type="checkbox"] {
          width: auto;
        }
      `}</style>
    </Layout>
  );
}

export default ProductsPage;
