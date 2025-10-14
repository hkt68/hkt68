import { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import axios from 'axios';
import { Plus, Edit, Trash2, Eye } from 'lucide-react';
import { toast, Toaster } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

function CustomersPage({ user, onLogout }) {
  const [customers, setCustomers] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showTransactionModal, setShowTransactionModal] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [formData, setFormData] = useState({ name: '', phone: '', email: '', address: '' });
  const [transactionData, setTransactionData] = useState({ transaction_type: 'debt', amount: '', description: '' });

  useEffect(() => {
    loadCustomers();
  }, []);

  const loadCustomers = async () => {
    try {
      const response = await axios.get(`${API}/customers`);
      setCustomers(response.data);
    } catch (error) {
      toast.error('Müşteriler yüklenemedi');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingCustomer) {
        await axios.put(`${API}/customers/${editingCustomer.id}`, formData);
        toast.success('Müşteri güncellendi');
      } else {
        await axios.post(`${API}/customers`, formData);
        toast.success('Müşteri eklendi');
      }
      setShowModal(false);
      setFormData({ name: '', phone: '', email: '', address: '' });
      setEditingCustomer(null);
      loadCustomers();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'İşlem başarısız');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Bu müşteriyi silmek istediğinize emin misiniz?')) return;
    try {
      await axios.delete(`${API}/customers/${id}`);
      toast.success('Müşteri silindi');
      loadCustomers();
    } catch (error) {
      toast.error('Müşteri silinemedi');
    }
  };

  const handleViewDetail = async (customer) => {
    setSelectedCustomer(customer);
    try {
      const response = await axios.get(`${API}/customers/${customer.id}/transactions`);
      setTransactions(response.data);
      setShowDetailModal(true);
    } catch (error) {
      toast.error('İşlem geçmişi yüklenemedi');
    }
  };

  const handleAddTransaction = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API}/customers/transaction`, {
        customer_id: selectedCustomer.id,
        transaction_type: transactionData.transaction_type,
        amount: parseFloat(transactionData.amount),
        description: transactionData.description
      });
      toast.success('İşlem eklendi');
      setShowTransactionModal(false);
      setTransactionData({ transaction_type: 'debt', amount: '', description: '' });
      loadCustomers();
      const response = await axios.get(`${API}/customers/${selectedCustomer.id}/transactions`);
      setTransactions(response.data);
      const updatedCustomer = await axios.get(`${API}/customers/${selectedCustomer.id}`);
      setSelectedCustomer(updatedCustomer.data);
    } catch (error) {
      toast.error(error.response?.data?.detail || 'İşlem başarısız');
    }
  };

  return (
    <Layout user={user} onLogout={onLogout}>
      <Toaster position="top-right" richColors />
      <div className="page-header">
        <h2>Cari Müşteri Yönetimi</h2>
        <button className="btn btn-primary" onClick={() => { setFormData({ name: '', phone: '', email: '', address: '' }); setEditingCustomer(null); setShowModal(true); }}>
          <Plus size={20} /> Yeni Müşteri
        </button>
      </div>
      <div className="card">
        <div className="table-container">
          <table>
            <thead>
              <tr><th>Müşteri Adı</th><th>Telefon</th><th>Email</th><th>Bakiye</th><th>İşlemler</th></tr>
            </thead>
            <tbody>
              {customers.map((customer) => (
                <tr key={customer.id}>
                  <td><strong>{customer.name}</strong></td>
                  <td>{customer.phone || '-'}</td>
                  <td>{customer.email || '-'}</td>
                  <td>
                    <span className={customer.balance > 0 ? 'badge badge-danger' : customer.balance < 0 ? 'badge badge-success' : 'badge'}>
                      {Math.abs(customer.balance).toFixed(2)} ₺ {customer.balance > 0 ? 'Borç' : customer.balance < 0 ? 'Alacak' : ''}
                    </span>
                  </td>
                  <td>
                    <button className="btn btn-primary btn-sm" onClick={() => handleViewDetail(customer)} style={{ marginRight: '0.5rem' }}><Eye size={16} /></button>
                    <button className="btn btn-secondary btn-sm" onClick={() => { setEditingCustomer(customer); setFormData(customer); setShowModal(true); }} style={{ marginRight: '0.5rem' }}><Edit size={16} /></button>
                    <button className="btn btn-danger btn-sm" onClick={() => handleDelete(customer.id)}><Trash2 size={16} /></button>
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
            <div className="modal-header"><h3>{editingCustomer ? 'Müşteri Düzenle' : 'Yeni Müşteri'}</h3><button onClick={() => setShowModal(false)}>×</button></div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="input-group"><label>Ad *</label><input type="text" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} required /></div>
                <div className="input-group"><label>Telefon</label><input type="tel" value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} /></div>
                <div className="input-group"><label>Email</label><input type="email" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} /></div>
                <div className="input-group"><label>Adres</label><textarea value={formData.address} onChange={(e) => setFormData({...formData, address: e.target.value})} rows="3" /></div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>İptal</button>
                <button type="submit" className="btn btn-primary">{editingCustomer ? 'Güncelle' : 'Ekle'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
      {showDetailModal && selectedCustomer && (
        <div className="modal-overlay" onClick={() => setShowDetailModal(false)}>
          <div className="modal" style={{ maxWidth: '900px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header"><h3>{selectedCustomer.name} - Detaylar</h3><button onClick={() => setShowDetailModal(false)}>×</button></div>
            <div className="modal-body">
              <div style={{ background: 'var(--bg-tertiary)', padding: '1rem', borderRadius: '8px', marginBottom: '1rem' }}>
                <p><strong>Telefon:</strong> {selectedCustomer.phone || '-'}</p>
                <p><strong>Email:</strong> {selectedCustomer.email || '-'}</p>
                <p><strong>Bakiye:</strong> <span style={{ fontWeight: 'bold', color: selectedCustomer.balance > 0 ? '#ef4444' : '#10b981' }}>{Math.abs(selectedCustomer.balance).toFixed(2)} ₺ {selectedCustomer.balance > 0 ? '(Borç)' : selectedCustomer.balance < 0 ? '(Alacak)' : ''}</span></p>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                <h4>İşlem Geçmişi</h4>
                <button className="btn btn-primary btn-sm" onClick={() => setShowTransactionModal(true)}><Plus size={16} /> Yeni İşlem</button>
              </div>
              <div className="table-container">
                <table>
                  <thead><tr><th>Tarih</th><th>Tip</th><th>Tutar</th><th>Açıklama</th></tr></thead>
                  <tbody>
                    {transactions.map((t) => (
                      <tr key={t.id}>
                        <td>{new Date(t.created_at).toLocaleString('tr-TR')}</td>
                        <td><span className={`badge ${t.transaction_type === 'debt' ? 'badge-warning' : t.transaction_type === 'payment' ? 'badge-success' : 'badge-primary'}`}>{t.transaction_type === 'debt' ? 'Borç' : t.transaction_type === 'payment' ? 'Tahsilat' : 'Satış'}</span></td>
                        <td><strong>{t.amount.toFixed(2)} ₺</strong></td>
                        <td>{t.description || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}
      {showTransactionModal && selectedCustomer && (
        <div className="modal-overlay" onClick={() => setShowTransactionModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header"><h3>Yeni İşlem - {selectedCustomer.name}</h3><button onClick={() => setShowTransactionModal(false)}>×</button></div>
            <form onSubmit={handleAddTransaction}>
              <div className="modal-body">
                <div className="input-group">
                  <label>İşlem Tipi</label>
                  <select value={transactionData.transaction_type} onChange={(e) => setTransactionData({...transactionData, transaction_type: e.target.value})}>
                    <option value="debt">Manuel Borç</option>
                    <option value="payment">Tahsilat</option>
                  </select>
                </div>
                <div className="input-group"><label>Tutar *</label><input type="number" step="0.01" value={transactionData.amount} onChange={(e) => setTransactionData({...transactionData, amount: e.target.value})} required /></div>
                <div className="input-group"><label>Açıklama</label><textarea value={transactionData.description} onChange={(e) => setTransactionData({...transactionData, description: e.target.value})} rows="3" /></div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowTransactionModal(false)}>İptal</button>
                <button type="submit" className="btn btn-primary">Kaydet</button>
              </div>
            </form>
          </div>
        </div>
      )}
      <style jsx>{`.page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; } .page-header h2 { font-size: 1.875rem; font-weight: 700; color: var(--text-primary); }`}</style>
    </Layout>
  );
}

export default CustomersPage;