const express = require('express');
const router = express.Router();
const db = require('../db/connection');

// Search decisions (full-text search)
router.get('/search', (req, res) => {
  const { q, year, organization, startDate, endDate, page = 1, limit = 20 } = req.query;
  const offset = (parseInt(page) - 1) * parseInt(limit);

  // Select columns, exclude pdf_text for list responses (to keep response size small)
  // Include document_url so frontend can enable download button
  const selectCols = 'id, decision_number, subject, organization, decision_date, year, document_title, document_url, decision_url, created_at, updated_at';
  let query = `SELECT ${selectCols} FROM decisions WHERE 1=1`;
  const params = [];

  if (q) {
    // Search in metadata and PDF text
    query += ` AND (decision_number LIKE ? OR subject LIKE ? OR 
              organization LIKE ? OR document_title LIKE ? OR pdf_text LIKE ?)`;
    const searchTerm = `%${q}%`;
    params.push(searchTerm, searchTerm, searchTerm, searchTerm, searchTerm);
  }

  if (year) {
    query += ' AND year = ?';
    params.push(parseInt(year));
  }

  if (organization) {
    query += ' AND organization LIKE ?';
    params.push(`%${organization}%`);
  }

  if (startDate) {
    query += ' AND decision_date >= ?';
    params.push(startDate);
  }

  if (endDate) {
    query += ' AND decision_date <= ?';
    params.push(endDate);
  }

  // Get total count
  db.get(`SELECT COUNT(*) as count FROM (${query})`, params, (err, countResult) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    // Get paginated results
    query += ' ORDER BY decision_date DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), offset);

    db.all(query, params, (err, rows) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }

      res.json({
        decisions: rows,
        total: countResult.count,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(countResult.count / parseInt(limit))
      });
    });
  });
});

// Get decision by ID (with full PDF text)
router.get('/:id', (req, res) => {
  const { id } = req.params;

  db.get('SELECT * FROM decisions WHERE id = ?', [id], (err, row) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (!row) {
      return res.status(404).json({ error: 'Decision not found' });
    }

    res.json(row);
  });
});

// Get filter options (years, organizations)
router.get('/filters/options', (req, res) => {
  Promise.all([
    new Promise((resolve, reject) => {
      db.all(
        'SELECT DISTINCT year FROM decisions ORDER BY year DESC',
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows.map(r => r.year));
        }
      );
    }),
    new Promise((resolve, reject) => {
      db.all(
        `SELECT DISTINCT organization FROM decisions 
         WHERE organization IS NOT NULL AND organization != ''
         ORDER BY organization LIMIT 100`,
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows.map(r => r.organization));
        }
      );
    })
  ])
    .then(([years, organizations]) => {
      res.json({ years, organizations });
    })
    .catch(err => {
      res.status(500).json({ error: err.message });
    });
});

// Get statistics
router.get('/admin/stats', (req, res) => {
  Promise.all([
    new Promise((resolve, reject) => {
      db.get('SELECT COUNT(*) as total FROM decisions', (err, row) => {
        if (err) reject(err);
        else resolve(row.total);
      });
    }),
    new Promise((resolve, reject) => {
      db.get('SELECT COUNT(*) as withText FROM decisions WHERE pdf_text IS NOT NULL AND pdf_text != ""', (err, row) => {
        if (err) reject(err);
        else resolve(row.withText);
      });
    }),
    new Promise((resolve, reject) => {
      db.all('SELECT year, COUNT(*) as count FROM decisions GROUP BY year ORDER BY year DESC', (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    })
  ])
    .then(([total, withText, yearBreakdown]) => {
      res.json({
        total,
        withExtractedText: withText,
        extractionPercentage: total > 0 ? ((withText / total) * 100).toFixed(1) : 0,
        yearBreakdown
      });
    })
    .catch(err => {
      res.status(500).json({ error: err.message });
    });
});

module.exports = router;

