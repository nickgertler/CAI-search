import React from 'react';
import '../styles/DecisionsList.css';
import { getTranslation } from '../translations';

function DecisionsList({ decisions, onDownload, language = 'en' }) {
  return (
    <div className="decisions-list">
      {decisions.map((decision) => (
        <div key={decision.id} className="decision-card">
          <div className="decision-header">
            <h3 className="decision-number">{decision.decision_number}</h3>
            <span className="decision-date">{decision.decision_date}</span>
          </div>

          <div className="decision-meta">
            {decision.organization && (
              <div className="meta-item">
                <strong>{language === 'en' ? 'Organization:' : 'Organisation:'}</strong>
                <span>{decision.organization}</span>
              </div>
            )}
            {decision.year && (
              <div className="meta-item">
                <strong>{getTranslation('year', language)}:</strong>
                <span>{decision.year}</span>
              </div>
            )}
          </div>

          <div className="decision-subject">
            <strong>{language === 'en' ? 'Subject:' : 'Sujet:'}</strong>
            <p>{decision.subject}</p>
          </div>

          {decision.file_size && (
            <div className="decision-details">
              <span className="file-size">{decision.file_size}</span>
            </div>
          )}

          <div className="decision-actions">
            <button
              className="download-button"
              onClick={() => onDownload(decision)}
              disabled={!decision.document_url}
            >
              {getTranslation('downloadPdf', language)}
            </button>
            {decision.document_title && (
              <span className="document-title">{decision.document_title}</span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

export default DecisionsList;
