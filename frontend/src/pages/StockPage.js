import { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import axios from 'axios';
import { Package, TrendingUp, TrendingDown } from 'lucide-react';
import { toast, Toaster } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

function StockPage({ user, onLogout }) {
  const [products, setProducts] = useState([]);
  const [movements, setMovements] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [movementData, setMovementData] = useState({
    movement_type: 'in',
    quantity: '',
    note: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [productsRes, movementsRes] = await Promise.all([
        axios.get(`${API}/products`),
        axios.get(`${API}/stock/movements`)
      ]);
      setProducts(productsRes.data);
      setMovements(movementsRes.data);
    } catch (error) {
      toast.error('Veriler yüklenemedi');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      await axios.post(`${API}/stock/movement`, {
        product_id: selectedProduct.id,
        movement_type: movementData.movement_type,
        quantity: parseInt(movementData.quantity),
        note: movementData.note
      });
      
      toast.success('Stok güncellendi');
      setShowModal(false);
      setMovementData({ movement_type: 'in', quantity: '', note: '' });
      setSelectedProduct(null);
      loadData();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'İşlem başarısız');
    }
  };

  return (
    <Layout user={user} onLogout={onLogout}>
      <Toaster position="top-right" richColors />
      
      <div className="page-header">
        <h2>Stok Yönetimi</h2>
      </div>

      <div className="card">
        <h3>Ürün Stokları</h3>
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Ürün Adı</th>
                <th>Barkod</th>
                <th>Mevcut Stok</th>
                <th>İşlem</th>
              </tr>
            </thead>
            <tbody>
              {products.map((product) => (
                <tr key={product.id}>
                  <td><strong>{product.name}</strong></td>
                  <td>{product.barcode}</td>
                  <td>
                    <span className={product.stock < 10 ? 'badge badge-danger' : 'badge badge-success'}>
                      {product.stock}
                    </span>
                  </td>
                  <td>
                    <button 
                      className="btn btn-primary btn-sm"
                      onClick={() => {
                        setSelectedProduct(product);
                        setShowModal(true);
                      }}
                    >
                      <Package size={16} />
                      Stok İşlemi
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="card" style={{ marginTop: '2rem' }}>
        <h3>Stok Hareketleri</h3>
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Tarih</th>
                <th>Ürün</th>
                <th>İşlem</th>
                <th>Miktar</th>
                <th>Not</th>
                <th>Kullanıcı</th>
              </tr>
            </thead>
            <tbody>
              {movements.slice(0, 50).map((movement) => (
                <tr key={movement.id}>
                  <td>{new Date(movement.created_at).toLocaleString('tr-TR')}</td>
                  <td>{movement.product_name}</td>
                  <td>
                    {movement.movement_type === 'in' ? (
                      <span className="badge badge-success">
                        <TrendingUp size={14} /> Giriş
                      </span>
                    ) : (
                      <span className="badge badge-danger">
                        <TrendingDown size={14} /> Çıkış
                      </span>
                    )}
                  </td>
                  <td><strong>{movement.quantity}</strong></td>
                  <td>{movement.note || '-'}</td>
                  <td>{movement.user}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && selectedProduct && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Stok İşlemi: {selectedProduct.name}</h3>
              <button onClick={() => setShowModal(false)}>×</button>
            </div>
            
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <p>Mevcut Stok: <strong>{selectedProduct.stock}</strong></p>
                
                <div className="input-group">
                  <label>İşlem Tipi</label>
                  <select
                    value={movementData.movement_type}
                    onChange={(e) => setMovementData({...movementData, movement_type: e.target.value})}
                  >
                    <option value="in">Stok Girişi</option>
                    <option value="out">Stok Çıkışı</option>
                  </select>
                </div>

                <div className="input-group">
                  <label>Miktar *</label>
                  <input
                    type="number"
                    value={movementData.quantity}
                    onChange={(e) => setMovementData({...movementData, quantity: e.target.value})}
                    min="1"
                    required
                  />
                </div>

                <div className="input-group">
                  <label>Not</label>
                  <textarea
                    value={movementData.note}
                    onChange={(e) => setMovementData({...movementData, note: e.target.value})}
                    rows="3"
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                  İptal
                </button>
                <button type="submit" className="btn btn-primary">
                  Kaydet
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style jsx>{`
        .page-header {
          margin-bottom: 2rem;
        }

        .page-header h2 {
          font-size: 1.875rem;
          font-weight: 700;
          color: var(--text-primary);
        }

        .card h3 {
          font-size: 1.25rem;
          font-weight: 600;
          margin-bottom: 1rem;
          color: var(--text-primary);
        }
      `}</style>
    </Layout>
  );
}

export default StockPage;
