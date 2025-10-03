import { useState } from 'react';
import axios from 'axios';

const Backup = () => {
  const [backupProcessing, setBackupProcessing] = useState(false);
  const [restoreProcessing, setRestoreProcessing] = useState(false);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [backupHistory, setBackupHistory] = useState([]);

  // Yedek oluşturma ve indirme
  const handleCreateBackup = async () => {
    try {
      setBackupProcessing(true);
      
      const response = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/api/backup/export`);
      
      // JSON dosyasını indir
      const dataStr = JSON.stringify(response.data, null, 2);
      const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
      
      const exportFileDefaultName = `elite-pos-backup-${new Date().toISOString().split('T')[0]}.json`;
      
      const linkElement = document.createElement('a');
      linkElement.setAttribute('href', dataUri);
      linkElement.setAttribute('download', exportFileDefaultName);
      linkElement.click();
      
      alert('✅ Yedek başarıyla oluşturuldu ve bilgisayarınıza indirildi!');
      
      // Yedek geçmişine ekle (localStorage'da tut)
      const backupInfo = {
        id: Date.now(),
        name: exportFileDefaultName,
        date: new Date().toISOString(),
        size: dataStr.length,
        collections: Object.keys(response.data.data || {}).length
      };
      
      const history = JSON.parse(localStorage.getItem('backupHistory') || '[]');
      history.unshift(backupInfo);
      localStorage.setItem('backupHistory', JSON.stringify(history.slice(0, 10))); // Son 10 yedek
      setBackupHistory(history.slice(0, 10));
      
    } catch (error) {
      console.error('Backup error:', error);
      alert('❌ Yedek oluşturulurken hata oluştu: ' + (error.response?.data?.detail || error.message));
    } finally {
      setBackupProcessing(false);
    }
  };

  // Dosya seçme
  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      if (file.type !== 'application/json' && !file.name.endsWith('.json')) {
        alert('❌ Lütfen sadece JSON dosyası seçin!');
        return;
      }
      setUploadedFile(file);
    }
  };

  // Yedek geri yükleme
  const handleRestoreBackup = async () => {
    if (!uploadedFile) {
      alert('❌ Lütfen önce bir yedek dosyası seçin!');
      return;
    }

    const confirmRestore = window.confirm(
      '⚠️ DİKKAT!\n\n' +
      'Bu işlem mevcut tüm verileri siler ve seçilen yedekten geri yükler.\n' +
      'Bu işlem GERİ ALINMAZ!\n\n' +
      'Devam etmek istediğinizden emin misiniz?'
    );

    if (!confirmRestore) return;

    try {
      setRestoreProcessing(true);

      // Dosyayı oku
      const fileContent = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target.result);
        reader.onerror = reject;
        reader.readAsText(uploadedFile);
      });

      // JSON parse et
      const backupData = JSON.parse(fileContent);

      // Yedek formatını kontrol et
      if (!backupData.data || typeof backupData.data !== 'object') {
        throw new Error('Geçersiz yedek dosyası formatı!');
      }

      // Backend'e gönder
      const response = await axios.post(`${process.env.REACT_APP_BACKEND_URL}/api/backup/import`, backupData);

      if (response.data.success) {
        alert(
          '✅ Yedek başarıyla geri yüklendi!\n\n' +
          'Geri yüklenen koleksiyonlar:\n' +
          Object.entries(response.data.imported_collections)
            .map(([name, count]) => `• ${name}: ${count} kayıt`)
            .join('\n') +
          '\n\nSayfa yenileniyor...'
        );
        
        // Sayfayı yenile
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      }

    } catch (error) {
      console.error('Restore error:', error);
      if (error instanceof SyntaxError) {
        alert('❌ Geçersiz JSON dosyası!');
      } else {
        alert('❌ Yedek geri yüklenirken hata oluştu: ' + (error.response?.data?.detail || error.message));
      }
    } finally {
      setRestoreProcessing(false);
    }
  };

  // Component yüklendiğinde yedek geçmişini al
  useState(() => {
    const history = JSON.parse(localStorage.getItem('backupHistory') || '[]');
    setBackupHistory(history);
  }, []);

  return (
    <div className="space-y-6 fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold text-gray-800 flex items-center">
          <span className="mr-3">💾</span>
          Yedekleme İşlemleri
        </h2>
        <button 
          onClick={() => window.history.back()}
          className="btn btn-secondary"
        >
          ← Geri Dön
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Yedek Oluşturma */}
        <div className="bg-white rounded-lg p-6 shadow-sm">
          <h3 className="text-xl font-semibold mb-4 flex items-center">
            <span className="mr-2">📥</span>
            Yedek Oluştur ve İndir
          </h3>
          
          <div className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-medium text-blue-800 mb-2">Yedek İçeriği:</h4>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• Tüm müşteri bilgileri</li>
                <li>• Ürün ve kategori verileri</li>
                <li>• Satış ve cari hesap kayıtları</li>
                <li>• Stok hareketleri</li>
                <li>• Ödeme geçmişi</li>
              </ul>
            </div>

            <button
              onClick={handleCreateBackup}
              disabled={backupProcessing}
              className="btn btn-success w-full"
            >
              {backupProcessing ? (
                <>
                  <div className="spinner"></div>
                  Yedek Hazırlanıyor...
                </>
              ) : (
                <>
                  <span>💾</span>
                  Yedek Oluştur ve İndir
                </>
              )}
            </button>
          </div>
        </div>

        {/* Yedek Geri Yükleme */}
        <div className="bg-white rounded-lg p-6 shadow-sm">
          <h3 className="text-xl font-semibold mb-4 flex items-center">
            <span className="mr-2">📤</span>
            Yedek Geri Yükle
          </h3>
          
          <div className="space-y-4">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <h4 className="font-medium text-red-800 mb-2">⚠️ Dikkat:</h4>
              <p className="text-sm text-red-700">
                Bu işlem mevcut tüm verileri siler ve seçilen yedekten geri yükler. 
                İşlem geri alınamaz!
              </p>
            </div>

            <div>
              <label className="form-label">Yedek Dosyası Seç (.json)</label>
              <input
                type="file"
                accept=".json,application/json"
                onChange={handleFileSelect}
                className="form-input"
              />
            </div>

            {uploadedFile && (
              <div className="bg-gray-50 border rounded-lg p-3">
                <div className="text-sm">
                  <strong>Seçilen Dosya:</strong> {uploadedFile.name}
                </div>
                <div className="text-xs text-gray-500">
                  Boyut: {(uploadedFile.size / 1024).toFixed(1)} KB
                </div>
              </div>
            )}

            <button
              onClick={handleRestoreBackup}
              disabled={restoreProcessing || !uploadedFile}
              className="btn btn-warning w-full"
            >
              {restoreProcessing ? (
                <>
                  <div className="spinner"></div>
                  Geri Yükleniyor...
                </>
              ) : (
                <>
                  <span>🔄</span>
                  Yedek Geri Yükle
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Yedek Geçmişi */}
      {backupHistory.length > 0 && (
        <div className="bg-white rounded-lg p-6 shadow-sm">
          <h3 className="text-xl font-semibold mb-4 flex items-center">
            <span className="mr-2">📋</span>
            Son Yedek İşlemleri
          </h3>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left p-3">Dosya Adı</th>
                  <th className="text-left p-3">Tarih</th>
                  <th className="text-left p-3">Boyut</th>
                  <th className="text-left p-3">Koleksiyon</th>
                </tr>
              </thead>
              <tbody>
                {backupHistory.map((backup) => (
                  <tr key={backup.id} className="border-t">
                    <td className="p-3 font-medium">{backup.name}</td>
                    <td className="p-3">{new Date(backup.date).toLocaleString('tr-TR')}</td>
                    <td className="p-3">{(backup.size / 1024).toFixed(1)} KB</td>
                    <td className="p-3">{backup.collections} adet</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Otomatik Yedekleme Önerileri */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-yellow-800 mb-3 flex items-center">
          <span className="mr-2">💡</span>
          Yedekleme Önerileri
        </h3>
        <ul className="text-sm text-yellow-700 space-y-2">
          <li>• <strong>Günlük:</strong> Her gün sonunda yedek alın</li>
          <li>• <strong>Haftalık:</strong> Detaylı sistem yedeği oluşturun</li>
          <li>• <strong>Güvenli Saklama:</strong> Yedekleri farklı konumlarda saklayın</li>
          <li>• <strong>Test:</strong> Yedeklerin geri yüklenebilirliğini düzenli test edin</li>
        </ul>
      </div>
    </div>
  );
};

export default Backup;