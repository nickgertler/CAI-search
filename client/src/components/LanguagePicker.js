import React from 'react';
import '../styles/LanguagePicker.css';

function LanguagePicker({ language, onLanguageChange }) {
  const otherLanguage = language === 'en' ? 'fr' : 'en';
  const buttonText = otherLanguage.toUpperCase();

  return (
    <div className="language-picker">
      <button
        className="lang-button"
        onClick={() => onLanguageChange(otherLanguage)}
      >
        {buttonText}
      </button>
    </div>
  );
}

export default LanguagePicker;
