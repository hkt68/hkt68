import { useState, useEffect } from 'react';
import axios from 'axios';

const Categories = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: ''
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/categories');
      setCategories(response.data);
    } catch (err) {
      setError('Kategoriler yüklenirken hata oluştu');
      console.error('Categories error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    try {
      setSubmitting(true);
      
      if (editingCategory) {
        await axios.put(`/categories/${editingCategory.id}`, formData);
      } else {
        await axios.post('/categories', formData);
      }
      
      await fetchCategories();
      resetForm();
    } catch (err) {
      setError(editingCategory ? 'Kategori güncellenirken hata oluştu' : 'Kategori eklenirken hata oluştu');
      console.error('Category submit error:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (category) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      description: category.description || ''
    });
    setShowForm(true);
  };

  const handleDelete = async (categoryId) => {
    if (!window.confirm('Bu kategoriyi silmek istediğinizden emin misiniz?')) return;

    try {
      await axios.delete(`/categories/${categoryId}`);
      await fetchCategories();
    } catch (err) {
      if (err.response?.status === 400) {
        setError('Bu kategori ürünlere bağlı olduğu için silinemez');
      } else {
        setError('Kategori silinirken hata oluştu');
      }
      console.error('Delete category error:', err);
    }
  };

  const resetForm = () => {
    setFormData({ name: '', description: '' });
    setEditingCategory(null);
    setShowForm(false);
    setError(null);
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
          <span className="mr-3">🏷️</span>
          Kategoriler
        </h2>
        <button 
          onClick={() => setShowForm(true)}
          className="btn btn-primary"
          data-testid="add-category-btn"
        >
          <span>➕</span>
          Yeni Kategori
        </button>
      </div>

      {error && (
        <div className="alert alert-error">
          {error}
          <button onClick={() => setError(null)} className="ml-4 text-xl">×</button>
        </div>
      )}

      {/* Category Form Modal */}
      {showForm && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && resetForm()}>
          <div className="modal-content p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold">
                {editingCategory ? 'Kategori Düzenle' : 'Yeni Kategori Ekle'}
              </h3>
              <button 
                onClick={resetForm}
                className="text-gray-400 hover:text-gray-600 text-2xl"
              >
                ×
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="form-group">
                <label className="form-label">Kategori Adı *</label>
                <input
                  type="text"
                  className="form-input"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Örn: Elektronik, Giyim, Ev Eşyası"
                  required
                  data-testid="category-name-input"
                />
              </div>
              
              <div className="form-group">
                <label className="form-label">Açıklama</label>
                <textarea
                  className="form-input"
                  rows="3"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Kategori hakkında kısa açıklama..."
                  data-testid="category-description-input"
                />
              </div>
              
              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  className="btn btn-primary flex-1"
                  disabled={submitting || !formData.name.trim()}
                  data-testid="save-category-btn"
                >
                  {submitting ? (
                    <><div className="spinner"></div> Kaydediliyor...</>
                  ) : (
                    <><span>💾</span> {editingCategory ? 'Güncelle' : 'Kaydet'}</>
                  )}
                </button>
                <button
                  type="button"
                  onClick={resetForm}
                  className="btn btn-secondary"
                  data-testid="cancel-category-btn"
                >
                  İptal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Categories Table */}
      <div className="table-container" data-testid="categories-table">
        <div className="table-header p-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Kategori Listesi ({categories.length})</h3>
            <button 
              onClick={fetchCategories}
              className="btn btn-secondary btn-sm"
              data-testid="refresh-categories-btn"
            >
              🔄 Yenile
            </button>
          </div>
        </div>
        
        {categories.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="table-header">
                <tr>
                  <th className="text-left p-4">Kategori Adı</th>
                  <th className="text-left p-4">Açıklama</th>
                  <th className="text-left p-4">Oluşturulma</th>
                  <th className="text-center p-4">İşlemler</th>
                </tr>
              </thead>
              <tbody>
                {categories.map((category) => (
                  <tr key={category.id} className="table-row">
                    <td className="p-4">
                      <div className="font-semibold text-gray-800">{category.name}</div>
                    </td>
                    <td className="p-4">
                      <div className="text-gray-600">
                        {category.description || '-'}
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="text-sm text-gray-500">
                        {new Date(category.created_at).toLocaleDateString('tr-TR', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        })}
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => handleEdit(category)}
                          className="btn btn-warning btn-sm"
                          data-testid={`edit-category-${category.id}`}
                        >
                          <span>✏️</span>
                          Düzenle
                        </button>
                        <button
                          onClick={() => handleDelete(category.id)}
                          className="btn btn-danger btn-sm"
                          data-testid={`delete-category-${category.id}`}
                        >
                          <span>🗑️</span>
                          Sil
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-8 text-center text-gray-500">
            <div className="text-6xl mb-4">🏷️</div>
            <div className="text-xl mb-2">Henüz kategori eklenmemiş</div>
            <div className="mb-4">Kategoriler ürünlerinizi organize etmenize yardımcı olur.</div>
            <button 
              onClick={() => setShowForm(true)}
              className="btn btn-primary"
            >
              İlk Kategoriyi Ekle
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Categories;