const db = require('./connection');

const initDatabase = () => {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      // Create decisions table
      db.run(`
        CREATE TABLE IF NOT EXISTS decisions (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          decision_number TEXT UNIQUE NOT NULL,
          decision_date TEXT NOT NULL,
          subject TEXT NOT NULL,
          organization TEXT,
          document_title TEXT NOT NULL,
          document_url TEXT,
          decision_url TEXT,
          year INTEGER NOT NULL,
          pdf_text TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `, (err) => {
        if (err) reject(err);
      });

      // Create full-text search index table
      db.run(`
        CREATE TABLE IF NOT EXISTS decision_search (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          decision_id INTEGER NOT NULL UNIQUE,
          search_text TEXT,
          FOREIGN KEY (decision_id) REFERENCES decisions(id) ON DELETE CASCADE
        )
      `, (err) => {
        if (err) reject(err);
      });

      // Create index for search
      db.run(`
        CREATE INDEX IF NOT EXISTS idx_decision_number 
        ON decisions(decision_number)
      `, (err) => {
        if (err) reject(err);
      });

      db.run(`
        CREATE INDEX IF NOT EXISTS idx_decision_date 
        ON decisions(decision_date)
      `, (err) => {
        if (err) reject(err);
      });

      db.run(`
        CREATE INDEX IF NOT EXISTS idx_organization 
        ON decisions(organization)
      `, (err) => {
        if (err) reject(err);
      });

      db.run(`
        CREATE INDEX IF NOT EXISTS idx_year 
        ON decisions(year)
      `, (err) => {
        if (err) reject(err);
      });

      // Create scraping history table
      db.run(`
        CREATE TABLE IF NOT EXISTS scraping_history (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          scraped_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          records_added INTEGER DEFAULT 0,
          records_updated INTEGER DEFAULT 0,
          status TEXT DEFAULT 'success'
        )
      `, (err) => {
        if (err) reject(err);
        else {
          console.log('Database initialized successfully');
          resolve();
        }
      });
    });
  });
};

if (require.main === module) {
  initDatabase()
    .then(() => {
      console.log('Migration completed');
      process.exit(0);
    })
    .catch((err) => {
      console.error('Migration failed:', err);
      process.exit(1);
    });
}

module.exports = initDatabase;
