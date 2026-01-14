# CAI Decisions Search Platform

A modern web application for searching, filtering, and downloading Quebec Commission d'accès à l'information (CAI) decisions.

## Features

- **Full-Text Search**: Search decisions by decision number, organization, keywords, and subject matter
- **Advanced Filtering**: Filter by year, organization, and date range
- **Pagination**: Browse through results with easy pagination controls
- **PDF Downloads**: Direct access to download decision PDFs
- **Statistics Dashboard**: View total decisions and date range in the database
- **Responsive Design**: Works seamlessly on desktop and mobile devices
- **Periodic Scraping**: Automatically updates the database with new decisions

## Project Structure

```
CAI-search/
├── server/              # Node.js/Express backend
│   ├── db/             # Database setup and migrations
│   ├── routes/         # API routes
│   ├── index.js        # Express server
│   ├── scraper.js      # Web scraper for CAI decisions
│   ├── scheduler.js    # Scheduled scraping (daily)
│   └── ...
├── client/             # React frontend
│   ├── public/         # Static files
│   ├── src/
│   │   ├── components/ # React components
│   │   ├── styles/     # Component styles
│   │   ├── App.js      # Main app component
│   │   └── index.js    # React entry point
│   └── package.json
├── source.html         # Original CAI website HTML source
├── package.json        # Backend dependencies
└── README.md          # This file
```

## Installation

### Prerequisites

- Node.js (v14+)
- npm or yarn

### Setup

1. **Clone or navigate to the project directory**
   ```bash
   cd CAI-search
   ```

2. **Install backend dependencies**
   ```bash
   npm install
   ```

3. **Install frontend dependencies**
   ```bash
   cd client
   npm install
   cd ..
   ```

4. **Initialize the database**
   ```bash
   npm run db:migrate
   ```

5. **Scrape initial data**
   ```bash
   npm run scrape
   ```

## Running the Application

### Development Mode

Run both the backend server and React development server simultaneously:

```bash
npm run dev
```

This will start:
- Backend API on `http://localhost:5000`
- Frontend on `http://localhost:3000`

### Production Build

1. Build the React frontend:
   ```bash
   npm run build-client
   ```

2. Start the server (it will serve the built frontend):
   ```bash
   npm run server
   ```

## API Endpoints

### Search Decisions
```
GET /api/decisions/search?q=<query>&year=<year>&organization=<org>&page=<page>&limit=<limit>
```

Parameters:
- `q`: Search query (optional)
- `year`: Filter by year (optional)
- `organization`: Filter by organization (optional)
- `startDate`: Filter by start date (optional)
- `endDate`: Filter by end date (optional)
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 20)

### Get Decision by ID
```
GET /api/decisions/:id
```

### Get Filter Options
```
GET /api/decisions/filters/options
```

Returns available years and organizations for filtering.

### Get Statistics
```
GET /api/decisions/stats/summary
```

Returns total decisions and date range.

### Health Check
```
GET /api/health
```

## Scraping

### Manual Scraping
```bash
npm run scrape
```

This will parse the `source.html` file and insert decisions into the database.

### Scheduled Scraping
```bash
npm run scrape-schedule
```

This starts a scheduler that scrapes new decisions daily at 2:00 AM. You can modify the schedule in `server/scheduler.js`.

## Database Schema

### decisions table
- `id`: Primary key
- `decision_number`: Unique identifier (e.g., "1007497-S")
- `decision_date`: Date of decision
- `subject`: Summary of decision subject
- `organization`: Organization involved
- `document_title`: Full document title
- `document_url`: URL to PDF
- `pdf_filename`: PDF filename
- `file_size`: File size in KB
- `year`: Year of decision
- `created_at`: Timestamp
- `updated_at`: Timestamp

### decision_search table
Full-text search index for faster searching.

### scraping_history table
Tracks scraping operations and results.

## Technology Stack

### Backend
- **Express.js**: Web framework
- **SQLite3**: Database
- **Cheerio**: HTML parsing for scraping
- **Axios**: HTTP client
- **node-cron**: Task scheduling
- **CORS**: Cross-origin resource sharing

### Frontend
- **React 18**: UI framework
- **CSS3**: Styling with CSS Grid and Flexbox
- **Fetch API**: HTTP requests

## Features Details

### Search Functionality
- Full-text search across decision numbers, subjects, organizations, and document titles
- Case-insensitive matching
- Partial string matching (LIKE queries)

### Filtering
- Year-based filtering
- Organization filtering
- Date range filtering
- Combined filters

### Pagination
- Configurable items per page
- Previous/Next navigation
- Total count and page information

### Responsive Design
- Mobile-optimized layout
- Touch-friendly buttons
- Flexible grid layouts
- Proper viewport settings

## Future Enhancements

- [ ] User authentication and saved searches
- [ ] Advanced search syntax (AND, OR, NOT operators)
- [ ] Export results to CSV/Excel
- [ ] Batch download functionality
- [ ] Full-text search optimization with FTS5
- [ ] Caching layer for improved performance
- [ ] PDF text extraction and indexing
- [ ] Multi-language support
- [ ] API documentation with Swagger
- [ ] Unit and integration tests

## Configuration

Create a `.env` file in the root directory for configuration:

```
PORT=5000
NODE_ENV=development
DATABASE_PATH=./data/cai_decisions.db
```

## Troubleshooting

### Database Issues
If you encounter database errors, delete `data/cai_decisions.db` and run:
```bash
npm run db:migrate
npm run scrape
```

### Port Already in Use
If port 5000 is in use, you can set a different port:
```bash
PORT=3001 npm run server
```

### React Development Server Issues
If the frontend won't start, try:
```bash
cd client
rm -rf node_modules package-lock.json
npm install
npm start
```

## Contributing

Contributions are welcome! Please feel free to submit pull requests.

## License

MIT License - see LICENSE file for details

## Notes

- The scraper extracts data from the provided `source.html` file
- Decision PDFs are hosted on the CAI website and downloaded on-demand
- The database uses SQLite for simplicity and portability
- All searches are case-insensitive
- Dates are stored in YYYY-MM-DD format

## Support

For issues or questions, please open an issue on the repository or contact the maintainers.
