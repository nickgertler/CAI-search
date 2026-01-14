const db = require('./connection');

const initDatabase = () => {
  return new Promise((resolve, reject) => {
    // Step 1: Create decisions table
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
      if (err && !err.message.includes('already exists')) {
        console.error('Error creating decisions table:', err);
        return reject(err);
      }
      console.log('Decisions table ready');

      // Step 2: Check if decision_url column exists and add if not
      db.all(`PRAGMA table_info(decisions)`, (err, columns) => {
        if (err) {
          console.error('Error checking table schema:', err);
          return reject(err);
        }

        const hasDecisionUrl = columns && columns.some(col => col.name === 'decision_url');
        
        if (hasDecisionUrl) {
          console.log('decision_url column already exists');
          continueWithIndexes();
        } else {
          console.log('Adding decision_url column to existing database');
          db.run(`ALTER TABLE decisions ADD COLUMN decision_url TEXT`, (err) => {
            if (err) {
              console.error('Error adding decision_url column:', err);
              return reject(err);
            }
            console.log('Successfully added decision_url column');
            continueWithIndexes();
          });
        }
      });

      function continueWithIndexes() {
        // Step 3: Create full-text search index table
        db.run(`
          CREATE TABLE IF NOT EXISTS decision_search (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            decision_id INTEGER NOT NULL UNIQUE,
            search_text TEXT,
            FOREIGN KEY (decision_id) REFERENCES decisions(id) ON DELETE CASCADE
          )
        `, (err) => {
          if (err && !err.message.includes('already exists')) {
            console.error('Error creating search table:', err);
            return reject(err);
          }
          console.log('Search table ready');

          // Step 4: Create indexes
          db.run(`
            CREATE INDEX IF NOT EXISTS idx_decision_number 
            ON decisions(decision_number)
          `, (err) => {
            if (err) {
              console.error('Error creating decision_number index:', err);
              return reject(err);
            }

            db.run(`
              CREATE INDEX IF NOT EXISTS idx_decision_date 
              ON decisions(decision_date)
            `, (err) => {
              if (err) {
                console.error('Error creating decision_date index:', err);
                return reject(err);
              }

              db.run(`
                CREATE INDEX IF NOT EXISTS idx_organization 
                ON decisions(organization)
              `, (err) => {
                if (err) {
                  console.error('Error creating organization index:', err);
                  return reject(err);
                }

                db.run(`
                  CREATE INDEX IF NOT EXISTS idx_year 
                  ON decisions(year)
                `, (err) => {
                  if (err) {
                    console.error('Error creating year index:', err);
                    return reject(err);
                  }

                  // Step 5: Create scraping history table
                  db.run(`
                    CREATE TABLE IF NOT EXISTS scraping_history (
                      id INTEGER PRIMARY KEY AUTOINCREMENT,
                      scraped_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                      records_added INTEGER DEFAULT 0,
                      records_updated INTEGER DEFAULT 0,
                      status TEXT DEFAULT 'success'
                    )
                  `, (err) => {
                    if (err && !err.message.includes('already exists')) {
                      console.error('Error creating scraping_history table:', err);
                      return reject(err);
                    }
                    console.log('Database initialized successfully');
                    resolve();
                  });
                });
              });
            });
          });
        });
      }
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
