import React, { useState } from 'react';
import '../styles/SearchBar.css';
import { getTranslation } from '../translations';

function SearchBar({ onSearch, language = 'en' }) {
  const [query, setQuery] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    onSearch(query);
  };

  return (
    <form className="search-bar" onSubmit={handleSubmit}>
      <input
        type="text"
        placeholder={getTranslation('searchPlaceholder', language)}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="search-input"
      />
      <button type="submit" className="search-button">
        {language === 'en' ? 'Search' : 'Rechercher'}
      </button>
    </form>
  );
}

export default SearchBar;
