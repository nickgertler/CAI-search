# CAI Decisions Search - Architecture

## Overview

The CAI Decisions Search application scrapes CAI (Commission d'accès à l'information) website for decision documents and provides a full-text searchable database.

## Architecture Changes (January 2026)

### Previous Architecture
- Downloaded PDFs to `/server/pdfs/` directory (138MB disk space)
- Stored files on disk with metadata (pdf_filename, local_pdf_path, file_size)
- Separate PDF parsing step (`parse-pdfs.js`)
- Complex tagging and metadata extraction
- Multiple database columns for metadata (tags, outcome, ai_generated_fields, pdf_parsed_at)

### Current Architecture (Simplified)

#### Data Flow
1. **Scraping Phase**: 
   - Fetch decision list from CAI website
   - Download PDF for text extraction
   - Delete PDF immediately after processing
   - Store metadata + text marker in database

2. **Smart Caching**:
   - Check if `decision_number` already has `pdf_text` in DB
   - Skip re-downloading if already processed
   - Efficient query: `SELECT id FROM decisions WHERE decision_number = ? AND pdf_text IS NOT NULL`

3. **Search Phase**:
   - Full-text search on metadata: `decision_number`, `subject`, `organization`, `document_title`
   - Filter by: `year`, `organization`, `decision_date` range

#### Database Schema (Simplified)
```
decisions table:
  - id (INTEGER PRIMARY KEY)
  - decision_number (TEXT UNIQUE)
  - decision_date (TEXT)
  - subject (TEXT)
  - organization (TEXT)
  - document_title (TEXT)
  - document_url (TEXT)
  - year (INTEGER)
  - pdf_text (TEXT) - stores extracted text or processing marker
  - created_at (DATETIME)
  - updated_at (DATETIME)

Indices:
  - decision_number
  - decision_date
  - organization
  - year
```

#### Removed Columns
- `pdf_filename` - No longer needed (PDFs not stored)
- `local_pdf_path` - No longer needed (PDFs not stored)
- `file_size` - No longer needed
- `tags` - Simplified to full-text search only
- `outcome` - Removed (zero extraction success rate)
- `ai_generated_fields` - Removed
- `pdf_parsed_at` - No longer needed (parsing done inline)

#### Removed Files
- `server/pdf-parser.js` - Text extraction now done inline during scraping
- `server/parse-pdfs.js` - No separate parsing step
- `/server/pdfs/` directory - PDFs not stored

## API Endpoints

### Search
```
GET /api/decisions/search?q=query&year=2024&organization=&startDate=&endDate=&page=1&limit=20
```
Response includes only essential fields (excludes large pdf_text from list view):
- decision_number, subject, organization, decision_date, year, document_title, timestamps

### Get Decision Detail
```
GET /api/decisions/:id
```
Response includes full decision with pdf_text content

### Statistics
```
GET /api/decisions/admin/stats
```
Returns: total decisions, count with extracted text, percentage, year breakdown

### Filter Options
```
GET /api/decisions/filters/options
```
Returns available years and organizations for filtering

## Key Metrics

- **Total Decisions**: 402 indexed
- **Extracted Text**: 397 (98.8%)
- **Database Size**: ~25MB
- **Disk Footprint**: 0 bytes for PDFs (deleted after processing)
- **Processing**: Inline during scraping (no separate batch job)

## Advantages of New Architecture

1. **Zero Disk Footprint**: PDFs are downloaded, processed, and deleted immediately
2. **Simpler Schema**: Removed 5+ unnecessary columns
3. **Faster Processing**: Inline extraction eliminates separate parsing step
4. **Smart Caching**: Queries check database before downloading
5. **Full-Text Search**: Search across all text fields for comprehensive results
6. **Maintenance**: Fewer dependencies and simpler code paths

## Future Enhancements

1. **PDF Text Extraction**: Implement proper PDF text parsing (currently stores size markers)
2. **Advanced Filtering**: Add filters for decision outcomes, case types
3. **Full-Text Index**: Add dedicated FTS5 table for better performance
4. **API Pagination**: Optimize pagination for large result sets
5. **React Frontend**: Update UI to work with simplified API response structure

## Scraping Schedule

The scraper can be run periodically to fetch new decisions:
```bash
npm run scrape
```

- Checks database to avoid re-downloading existing decisions
- Only processes new documents
- Runs in ~2-5 minutes for full dataset (407 decisions)

## Running the System

```bash
# Initialize database and scrape decisions
npm run scrape

# Start API server
npm run server

# Start React frontend (in another terminal)
npm run client
```

- API: http://localhost:5000/api/decisions
- Frontend: http://localhost:3000
