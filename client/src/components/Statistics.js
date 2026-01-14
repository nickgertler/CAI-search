import React, { useState, useEffect } from 'react';
import '../styles/Statistics.css';
import { getTranslation } from '../translations';

function Statistics({ language = 'en' }) {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    fetchStatistics();
  }, []);

  const fetchStatistics = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/decisions/stats/summary');
      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error('Error fetching statistics:', error);
    }
  };

  if (!stats) return null;

  return (
    <div className="statistics">
      <div className="stat-item">
        <span className="stat-label">{getTranslation('totalDecisions', language)}</span>
        <span className="stat-value">{stats.total?.toLocaleString()}</span>
      </div>
      <div className="stat-item">
        <span className="stat-label">{language === 'en' ? 'Latest Decision' : 'Dernière décision'}</span>
        <span className="stat-value">{stats.latest}</span>
      </div>
      <div className="stat-item">
        <span className="stat-label">{language === 'en' ? 'Oldest Decision' : 'Décision la plus ancienne'}</span>
        <span className="stat-value">{stats.oldest}</span>
      </div>
    </div>
  );
}

export default Statistics;
