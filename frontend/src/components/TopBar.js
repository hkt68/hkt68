import { useState, useEffect } from 'react';
import { Clock, TrendingUp } from 'lucide-react';

function TopBar() {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [rates, setRates] = useState({ usd: 0, eur: 0, gbp: 0 });

  useEffect(() => {
    // Update time every second
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    // Fetch exchange rates
    fetchRates();
    const rateTimer = setInterval(fetchRates, 300000); // Update every 5 minutes

    return () => {
      clearInterval(timer);
      clearInterval(rateTimer);
    };
  }, []);

  const fetchRates = async () => {
    try {
      // Using a free API for exchange rates (TL base)
      const response = await fetch('https://api.exchangerate-api.com/v4/latest/TRY');
      const data = await response.json();
      
      if (data && data.rates) {
        setRates({
          usd: (1 / data.rates.USD).toFixed(2),
          eur: (1 / data.rates.EUR).toFixed(2),
          gbp: (1 / data.rates.GBP).toFixed(2)
        });
      }
    } catch (error) {
      console.error('Exchange rates fetch error:', error);
      // Fallback values
      setRates({ usd: 34.50, eur: 37.20, gbp: 43.80 });
    }
  };

  const formatDateTime = () => {
    return currentTime.toLocaleString('tr-TR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  return (
    <div className="top-bar">
      <div className="top-bar-item">
        <Clock size={16} />
        <span>{formatDateTime()}</span>
      </div>

      <div className="top-bar-divider" />

      <div className="top-bar-item">
        <TrendingUp size={16} />
        <span className="rate-label">Döviz:</span>
        <span className="rate-value">USD: {rates.usd} ₺</span>
        <span className="rate-value">EUR: {rates.eur} ₺</span>
        <span className="rate-value">GBP: {rates.gbp} ₺</span>
      </div>

      <style jsx>{`
        .top-bar {
          background: var(--bg-secondary);
          border-bottom: 1px solid var(--border);
          padding: 0.5rem 1.5rem;
          display: flex;
          align-items: center;
          gap: 1rem;
          font-size: 0.875rem;
          color: var(--text-secondary);
        }

        .top-bar-item {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .top-bar-divider {
          width: 1px;
          height: 20px;
          background: var(--border);
        }

        .rate-label {
          font-weight: 600;
          margin-left: 0.5rem;
        }

        .rate-value {
          padding: 0.25rem 0.5rem;
          background: var(--bg-tertiary);
          border-radius: 4px;
          font-weight: 500;
          color: var(--text-primary);
        }

        @media (max-width: 768px) {
          .top-bar {
            flex-direction: column;
            align-items: flex-start;
            gap: 0.5rem;
            padding: 0.75rem 1rem;
          }

          .top-bar-divider {
            display: none;
          }
        }
      `}</style>
    </div>
  );
}

export default TopBar;
