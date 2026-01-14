const cheerio = require('cheerio');
const axios = require('axios');
const db = require('./db/connection');
const initDatabase = require('./db/migrate');
const fs = require('fs');
const path = require('path');
const { PDFParse } = require('pdf-parse');


// Temp PDF storage directory (for processing only)
const PDF_TEMP_DIR = path.join(__dirname, '../.temp-pdfs');

// Ensure temp PDF directory exists
if (!fs.existsSync(PDF_TEMP_DIR)) {
  fs.mkdirSync(PDF_TEMP_DIR, { recursive: true });
}

// URLs to scrape
const SCRAPE_URLS = [
  'https://www.cai.gouv.qc.ca/commission-acces-information/acces-information-de-la-commission/decisions-de-commission-section-surveillance',
  'https://www.cai.gouv.qc.ca/commission-acces-information/acces-information-de-la-commission/decisions-documents-transmis-cadre-demande-acces-information'
];

// Fetch HTML from the target URLs
const fetchSourceHtml = async () => {
  let combinedHtml = '';
  
  for (const url of SCRAPE_URLS) {
    try {
      console.log(`Fetching: ${url}`);
      const response = await axios.get(url, {
        timeout: 15000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });
      combinedHtml += response.data;
      console.log(`Successfully fetched: ${url}`);
    } catch (error) {
      console.error(`Failed to fetch ${url}:`, error.message);
    }
  }
  
  return combinedHtml;
};

// Download, extract text, and delete PDF file
const downloadAndExtractPdf = async (url, filename, decisionNumber) => {
  try {
    if (!url) return null;
    
    // Convert relative URLs to absolute URLs
    const fullUrl = url.startsWith('http') ? url : `https://www.cai.gouv.qc.ca${url}`;
    
    // Sanitize filename
    const safeFilename = filename.replace(/[^a-zA-Z0-9_-]/g, '_') + '.pdf';
    const filePath = path.join(PDF_TEMP_DIR, safeFilename);
    
    // Check if already processed (text in DB)
    return new Promise((resolve) => {
      db.get('SELECT id FROM decisions WHERE decision_number = ? AND pdf_text IS NOT NULL', [decisionNumber], async (err, row) => {
        if (row) {
          console.log(`  ✓ Already processed: ${safeFilename}`);
          resolve(null);
          return;
        }

        try {
          console.log(`  ⬇ Downloading: ${filename}`);
          const response = await axios.get(fullUrl, {
            responseType: 'arraybuffer',
            timeout: 10000,
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
          });
          
          fs.writeFileSync(filePath, response.data);
          console.log(`  ✓ Downloaded, extracting text...`);
          
          // Extract text from PDF using pdf-parse
          let pdfText = '';
          try {
            const parser = new PDFParse({ url: 'file://' + filePath });
            const result = await parser.getText();
            pdfText = (result.text || '').trim();
            
            if (pdfText.length === 0) {
              console.warn(`  ⚠ No text extracted (may be scanned image PDF)`);
            } else {
              console.log(`  ✓ Extracted ${pdfText.length} chars`);
            }
          } catch (parseError) {
            console.warn(`  ⚠ PDF text extraction failed: ${parseError.message}`);
            pdfText = ''; // Store empty string if parsing fails
          }
          
          // Delete temp PDF file
          fs.unlinkSync(filePath);
          
          resolve(pdfText || '');
        } catch (error) {
          console.error(`  ✗ Failed to process ${filename}:`, error.message);
          // Clean up temp file if exists
          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
          }
          resolve(null);
        }
      });
    });
  } catch (error) {
    console.error(`  ✗ Failed to download ${filename}:`, error.message);
    return null;
  }
};

const extractDecisions = (sourceHtml) => {
  const $ = cheerio.load(sourceHtml);
  const decisions = [];

  // Find all accordion items containing tables
  $('div.modules-accordion_list-item').each((_, element) => {
    const $elem = $(element);
    
    // Get the year from the button text
    const yearText = $elem.find('.list-title__text').text().trim();
    const year = parseInt(yearText);

    // Find all table rows in this accordion item
    const $table = $elem.find('table');
    $table.find('tbody tr').each((rowIndex, row) => {
      if (rowIndex === 0) return; // Skip header row
      
      const $cells = $(row).find('td');
      if ($cells.length < 4) return;

      const decisionNumber = $cells.eq(0).text().trim();
      const subject = $cells.eq(1).text().trim();
      const decisionDate = $cells.eq(2).text().trim();
      const documentLink = $cells.eq(3).find('a');
      
      if (!decisionNumber) return;

      // Extract from document title link
      const documentTitle = documentLink.text().trim();
      const documentUrl = documentLink.attr('href');
      
      // Parse PDF filename from the title (format: "NUMBER : Décision ...")
      const pdfMatch = documentTitle.match(/^([^\s]+)\s*:/);
      const pdf_filename = pdfMatch ? pdfMatch[1] : '';

      // Try to extract organization from subject or document title
      let organization = '';
      const orgMatch = subject.match(/à l'endroit (?:de |du |d')?(.+?)(?:\.|$)/);
      if (orgMatch) {
        organization = orgMatch[1].trim();
        // Clean up brackets and special characters
        organization = organization.replace(/\s*\[…\]\s*/g, '').trim();
      }

      decisions.push({
        decision_number: decisionNumber,
        decision_date: decisionDate,
        subject: subject.substring(0, 500), // Limit subject length
        organization: organization.substring(0, 300),
        document_title: documentTitle.substring(0, 500),
        document_url: documentUrl,
        pdf_filename: pdf_filename,
        year: year
      });
    });
  });

  return decisions;
};

const insertDecisions = (decisions) => {
  return new Promise(async (resolve, reject) => {
    let added = 0;
    let skipped = 0;

    const stmt = db.prepare(`
      INSERT OR REPLACE INTO decisions 
      (decision_number, decision_date, subject, organization, document_title, 
       document_url, pdf_text, year, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `);

    db.serialize(async () => {
      db.run('BEGIN TRANSACTION');

      for (const decision of decisions) {
        // Download and extract PDF text
        let pdfText = null;
        if (decision.document_url) {
          pdfText = await downloadAndExtractPdf(decision.document_url, decision.pdf_filename, decision.decision_number);
        }

        await new Promise((resolveInsert, rejectInsert) => {
          stmt.run(
            [
              decision.decision_number,
              decision.decision_date,
              decision.subject,
              decision.organization,
              decision.document_title,
              decision.document_url,
              pdfText,
              decision.year
            ],
            function(err) {
              if (err) {
                console.error('Error inserting decision:', err, decision);
                skipped++;
              } else {
                if (this.changes > 0) {
                  added++;
                }
              }
              resolveInsert();
            }
          );
        });
      }

      stmt.finalize(() => {
        db.run('COMMIT', () => {
          // Record scraping history
          db.run(
            'INSERT INTO scraping_history (records_added, status) VALUES (?, ?)',
            [added, 'success'],
            (err) => {
              if (err) reject(err);
              else {
                console.log(`\nScraping completed:`);
                console.log(`  Added/Updated: ${added}`);
                console.log(`  Skipped: ${skipped}`);
                console.log(`✅ All PDFs extracted and stored in database (PDFs deleted)`);
                resolve({ added, skipped });
              }
            }
          );
        });
      });
    });
  });
};

const scrapeDecisions = async () => {
  try {
    // Initialize database
    await initDatabase();
    
    console.log('Starting to scrape CAI decisions...');
    
    // Fetch HTML from target URLs
    const sourceHtml = await fetchSourceHtml();
    
    if (!sourceHtml) {
      console.error('Failed to fetch HTML from any URL');
      process.exit(1);
    }
    
    const decisions = extractDecisions(sourceHtml);
    console.log(`Extracted ${decisions.length} decisions from CAI website`);
    
    if (decisions.length === 0) {
      console.log('No decisions found. Check the HTML structure or URLs.');
      process.exit(0);
    }

    await insertDecisions(decisions);
    console.log('Scraping completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('Scraping failed:', error);
    process.exit(1);
  }
};

if (require.main === module) {
  scrapeDecisions();
}

module.exports = { extractDecisions, insertDecisions };
