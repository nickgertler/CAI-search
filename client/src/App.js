import React, { useState, useEffect, useCallback } from 'react';
import './App.css';
import SearchBar from './components/SearchBar';
import FilterPanel from './components/FilterPanel';
import DecisionsList from './components/DecisionsList';
import Statistics from './components/Statistics';
import LanguagePicker from './components/LanguagePicker';
import { getTranslation } from './translations';

function App() {
  const [language, setLanguage] = useState(() => {
    return localStorage.getItem('language') || 'en';
  });
  const [decisions, setDecisions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    query: '',
    year: '',
    startDate: '',
    endDate: '',
    page: 1
  });
  const [pagination, setPagination] = useState({
    total: 0,
    pages: 0,
    page: 1
  });
  const [filterOptions, setFilterOptions] = useState({
    years: [],
    organizations: []
  });

  const ITEMS_PER_PAGE = 20;

  // Fetch decisions when filters change
  const fetchDecisions = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.query) params.append('q', filters.query);
      if (filters.year) params.append('year', filters.year);
      if (filters.organization) params.append('organization', filters.organization);
      if (filters.page) params.append('page', filters.page);
      params.append('limit', ITEMS_PER_PAGE);

      const response = await fetch(`/api/decisions/search?${params}`);
      const data = await response.json();
      setDecisions(data.decisions || []);
      setPagination({
        total: data.total || 0,
        pages: data.pages || 0,
        page: data.page || 1
      });
    } catch (error) {
      console.error('Error fetching decisions:', error);
      setDecisions([]);
      setPagination({
        total: 0,
        pages: 0,
        page: 1
      });
    } finally {
      setLoading(false);
    }
  }, [filters, ITEMS_PER_PAGE]);

  // Fetch filter options on mount
  useEffect(() => {
    fetchFilterOptions();
  }, []);

  // Fetch decisions when filters change
  useEffect(() => {
    fetchDecisions();
  }, [fetchDecisions]);

  const fetchFilterOptions = async () => {
    try {
      const response = await fetch('/api/decisions/filters/options');
      const data = await response.json();
      setFilterOptions(data);
    } catch (error) {
      console.error('Error fetching filter options:', error);
    }
  };

  const handleSearch = (query) => {
    setFilters({ ...filters, query, page: 1 });
  };

  const handleFilterChange = (newFilters) => {
    setFilters({ ...filters, ...newFilters, page: 1 });
  };

  const handlePageChange = (newPage) => {
    setFilters({ ...filters, page: newPage });
  };

  const handleDownload = (decision) => {
    if (decision.document_url) {
      window.open(`https://www.cai.gouv.qc.ca${decision.document_url}`, '_blank');
    }
  };

  const handleLanguageChange = (newLanguage) => {
    setLanguage(newLanguage);
    localStorage.setItem('language', newLanguage);
  };

  return (
    <div className="App">
      <header className="app-header">
        <div className="header-top">
          <div className="header-title">
            <h1>{getTranslation('appTitle', language)}</h1>
            <p className="subtitle">
              {getTranslation('appSubtitle', language)}
            </p>
          </div>
          <LanguagePicker language={language} onLanguageChange={handleLanguageChange} />
        </div>
      </header>

      <Statistics language={language} />

      <main className="app-container">
        <div className="search-section">
          <SearchBar onSearch={handleSearch} language={language} />
        </div>

        <div className="content-wrapper">
          <aside className="sidebar">
            <FilterPanel
              filters={filters}
              filterOptions={filterOptions}
              onFilterChange={handleFilterChange}
              language={language}
            />
          </aside>

          <section className="main-content">
            {loading ? (
              <div className="loading">{getTranslation('loading', language)}</div>
            ) : decisions.length === 0 ? (
              <div className="no-results">
                <p>{getTranslation('noResults', language)}</p>
              </div>
            ) : (
              <>
                <div className="results-header">
                  <p>{getTranslation('found', language)} {pagination.total} {pagination.total === 1 ? getTranslation('decision', language) : getTranslation('decisions', language)}</p>
                </div>
                <DecisionsList
                  decisions={decisions}
                  onDownload={handleDownload}
                  language={language}
                />
                {pagination.pages > 1 && (
                  <div className="pagination">
                    <button
                      onClick={() => handlePageChange(pagination.page - 1)}
                      disabled={pagination.page === 1}
                    >
                      {getTranslation('previous', language)}
                    </button>
                    <span>
                      {getTranslation('page', language)} {pagination.page} {getTranslation('of', language)} {pagination.pages}
                    </span>
                    <button
                      onClick={() => handlePageChange(pagination.page + 1)}
                      disabled={pagination.page === pagination.pages}
                    >
                      {getTranslation('next', language)}
                    </button>
                  </div>
                )}
              </>
            )}
          </section>
        </div>
      </main>

      <footer className="app-footer">
        <div className="footer-content">
          <div className="footer-disclaimer">
            <p>
              <strong>Disclaimer:</strong> {getTranslation('disclaimer', language)}
            </p>
          </div>
          <div className="footer-credit">
            <p>
              {getTranslation('builtBy', language)} <a href="https://nickgertler.ca" target="_blank" rel="noopener noreferrer">Nick Gertler</a>
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
