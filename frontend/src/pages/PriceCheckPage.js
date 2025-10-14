import { useState, useRef } from 'react';
import Layout from '@/components/Layout';
import axios from 'axios';
import { Barcode, Camera, Package } from 'lucide-react';
import { toast, Toaster } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

function PriceCheckPage({ user, onLogout }) {
  const [barcode, setBarcode] = useState('');
  const [product, setProduct] = useState(null);
  const [cameraActive, setCameraActive] = useState(false);
  const barcodeInputRef = useRef(null);
  const videoRef = useRef(null);

  const handleBarcodeSubmit = async (e) => {
    e.preventDefault();
    if (!barcode.trim()) return;

    try {
      const response = await axios.get(`${API}/products/barcode/${barcode}`);
      setProduct(response.data);
      setBarcode('');
      toast.success('Ürün bulundu');
      
      // Auto focus back to input
      setTimeout(() => {
        if (barcodeInputRef.current) {
          barcodeInputRef.current.focus();
        }
      }, 100);
    } catch (error) {
      toast.error('Ürün bulunamadı');
      setProduct(null);
      setBarcode('');
    }
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setCameraActive(true);
      }
    } catch (error) {
      toast.error('Kamera erişimi başarısız');
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
      setCameraActive(false);
    }
  };

  return (
    <Layout user={user} onLogout={onLogout}>
      <Toaster position="top-right" richColors />
      
      <div className="page-header">
        <h2>Ürün Fiyat Görüntüleme</h2>
      </div>

      <div className="price-check-container">
        <div className="card">
          <h3><Barcode size={20} /> Barkod Okuma</h3>
          
          <form onSubmit={handleBarcodeSubmit} style={{ marginBottom: '1rem' }}>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <input
                ref={barcodeInputRef}
                type="text"
                value={barcode}
                onChange={(e) => setBarcode(e.target.value)}
                placeholder="Barkod okutun veya yazın..."
                style={{ flex: 1, padding: '1rem', fontSize: '1.25rem', border: '2px solid var(--border)', borderRadius: '8px' }}
                autoFocus
              />
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => {
                  if (cameraActive) {
                    stopCamera();
                  } else {
                    startCamera();
                  }
                }}
              >
                <Camera size={24} />
              </button>
            </div>
          </form>

          {cameraActive && (
            <div className="camera-preview">
              <video ref={videoRef} autoPlay playsInline style={{ width: '100%', borderRadius: '8px' }} />
              <button className="btn btn-danger btn-sm" onClick={stopCamera} style={{ marginTop: '1rem' }}>
                Kamerayı Kapat
              </button>
            </div>
          )}
        </div>

        {product && (
          <div className="product-display">
            <div className="product-icon">
              <Package size={80} />
            </div>
            
            <div className="product-info">
              <h2 className="product-name">{product.name}</h2>
              <div className="product-barcode">Barkod: {product.barcode}</div>
              <div className="product-category">{product.category || 'Kategori Yok'}</div>
            </div>

            <div className="price-display">
              <div className="price-label">Satış Fiyatı (KDV Dahil)</div>
              <div className="price-value">{product.sale_price.toFixed(2)} ₺</div>
            </div>

            <div className="product-details">
              <div className="detail-item">
                <span className="detail-label">Stok:</span>
                <span className={`detail-value ${product.stock < 10 ? 'low-stock' : ''}`}>
                  {product.stock} adet
                </span>
              </div>
              <div className="detail-item">
                <span className="detail-label">KDV Oranı:</span>
                <span className="detail-value">%{product.vat_rate}</span>
              </div>
            </div>
          </div>
        )}

        {!product && !cameraActive && (
          <div className="empty-state">
            <Package size={100} color="var(--text-secondary)" />
            <p>Ürün bilgisi görüntülemek için barkod okutun</p>
          </div>
        )}
      </div>

      <style jsx>{`
        .page-header { margin-bottom: 2rem; }
        .page-header h2 { font-size: 1.875rem; font-weight: 700; color: var(--text-primary); }
        .card h3 { display: flex; align-items: center; gap: 0.5rem; font-size: 1.25rem; font-weight: 600; margin-bottom: 1.5rem; }
        .price-check-container { max-width: 800px; margin: 0 auto; }
        
        .product-display {
          background: var(--bg-secondary);
          border-radius: 16px;
          padding: 3rem;
          text-align: center;
          border: 2px solid var(--border);
          margin-top: 2rem;
        }
        
        .product-icon {
          color: var(--primary);
          margin-bottom: 2rem;
        }
        
        .product-name {
          font-size: 2.5rem;
          font-weight: 700;
          color: var(--text-primary);
          margin-bottom: 1rem;
        }
        
        .product-barcode {
          font-size: 1.125rem;
          color: var(--text-secondary);
          margin-bottom: 0.5rem;
        }
        
        .product-category {
          display: inline-block;
          padding: 0.5rem 1rem;
          background: var(--bg-tertiary);
          border-radius: 20px;
          color: var(--text-secondary);
          margin-bottom: 2rem;
        }
        
        .price-display {
          background: var(--primary);
          color: white;
          padding: 2rem;
          border-radius: 12px;
          margin: 2rem 0;
        }
        
        .price-label {
          font-size: 1rem;
          opacity: 0.9;
          margin-bottom: 0.5rem;
        }
        
        .price-value {
          font-size: 3.5rem;
          font-weight: 700;
        }
        
        .product-details {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 1.5rem;
          margin-top: 2rem;
        }
        
        .detail-item {
          background: var(--bg-tertiary);
          padding: 1.5rem;
          border-radius: 8px;
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }
        
        .detail-label {
          font-size: 0.875rem;
          color: var(--text-secondary);
        }
        
        .detail-value {
          font-size: 1.5rem;
          font-weight: 700;
          color: var(--text-primary);
        }
        
        .detail-value.low-stock {
          color: #ef4444;
        }
        
        .empty-state {
          text-align: center;
          padding: 5rem 2rem;
          color: var(--text-secondary);
        }
        
        .empty-state p {
          font-size: 1.125rem;
          margin-top: 1rem;
        }

        @media (max-width: 768px) {
          .product-name { font-size: 1.875rem; }
          .price-value { font-size: 2.5rem; }
          .product-details { grid-template-columns: 1fr; }
        }
      `}</style>
    </Layout>
  );
}

export default PriceCheckPage;
