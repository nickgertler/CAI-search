import React from 'react';
import '../styles/FilterPanel.css';
import { getTranslation } from '../translations';

function FilterPanel({ filters, filterOptions, onFilterChange, language = 'en' }) {
  const handleChange = (field, value) => {
    onFilterChange({ [field]: value });
  };

  return (
    <div className="filter-panel">
      <h3>{getTranslation('filters', language)}</h3>

      <div className="filter-group">
        <label htmlFor="year-filter">{getTranslation('year', language)}</label>
        <select
          id="year-filter"
          value={filters.year}
          onChange={(e) => handleChange('year', e.target.value)}
          className="filter-select"
        >
          <option value="">{getTranslation('allYears', language)}</option>
          {filterOptions.years && filterOptions.years.map((year) => (
            <option key={year} value={year}>
              {year}
            </option>
          ))}
        </select>
      </div>

      <div className="filter-group">
        <label htmlFor="start-date">{getTranslation('startDate', language)}</label>
        <input
          id="start-date"
          type="date"
          value={filters.startDate}
          onChange={(e) => handleChange('startDate', e.target.value)}
          className="filter-input"
        />
      </div>

      <div className="filter-group">
        <label htmlFor="end-date">{getTranslation('endDate', language)}</label>
        <input
          id="end-date"
          type="date"
          value={filters.endDate}
          onChange={(e) => handleChange('endDate', e.target.value)}
          className="filter-input"
        />
      </div>

      <button
        className="clear-filters"
        onClick={() => onFilterChange({ year: '', startDate: '', endDate: '' })}
      >
        {getTranslation('clearFilters', language)}
      </button>
    </div>
  );
}

export default FilterPanel;
