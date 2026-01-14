export const translations = {
  en: {
    // Header
    appTitle: 'CAI Decisions Search',
    appSubtitle: 'Quebec Commission d\'accès à l\'information (CAI) Decisions Database',
    
    // Search
    searchPlaceholder: 'Search decisions...',
    
    // Filters
    filters: 'Filters',
    year: 'Year',
    allYears: 'All Years',
    startDate: 'Start Date',
    endDate: 'End Date',
    clearFilters: 'Clear Filters',
    
    // Results
    found: 'Found',
    decision: 'decision',
    decisions: 'decisions',
    noResults: 'No decisions found. Try adjusting your search criteria.',
    loading: 'Loading decisions...',
    
    // Pagination
    previous: 'Previous',
    page: 'Page',
    of: 'of',
    next: 'Next',
    
    // Download
    downloadPdf: 'Download PDF',
    
    // Statistics
    statistics: 'Statistics',
    totalDecisions: 'Total Decisions',
    extractedText: 'Extracted Text',
    
    // Footer
    disclaimer: 'This website is for informational purposes only. It is not affiliated with, endorsed by, or officially connected to the Commission d\'accès à l\'information (CAI). The information provided here is compiled from publicly available sources and may not reflect all official CAI decisions.',
    builtBy: 'Built by',
  },
  fr: {
    // Header
    appTitle: 'Recherche de Décisions CAI',
    appSubtitle: 'Base de données des Décisions de la Commission d\'accès à l\'information (CAI) du Québec',
    
    // Search
    searchPlaceholder: 'Rechercher des décisions...',
    
    // Filters
    filters: 'Filtres',
    year: 'Année',
    allYears: 'Toutes les années',
    startDate: 'Date de début',
    endDate: 'Date de fin',
    clearFilters: 'Effacer les filtres',
    
    // Results
    found: 'Trouvé',
    decision: 'décision',
    decisions: 'décisions',
    noResults: 'Aucune décision trouvée. Essayez d\'ajuster vos critères de recherche.',
    loading: 'Chargement des décisions...',
    
    // Pagination
    previous: 'Précédent',
    page: 'Page',
    of: 'de',
    next: 'Suivant',
    
    // Download
    downloadPdf: 'Télécharger le PDF',
    
    // Statistics
    statistics: 'Statistiques',
    totalDecisions: 'Décisions totales',
    extractedText: 'Texte extrait',
    
    // Footer
    disclaimer: 'Ce site est fourni à titre informatif uniquement. Il n\'est pas affilié à, approuvé par ou officiellement connecté à la Commission d\'accès à l\'information (CAI). Les informations fournies ici sont compilées à partir de sources accessibles au public et peuvent ne pas refléter l\'ensemble des décisions officielles de la CAI.',
    builtBy: 'Créé par',
  }
};

export const getTranslation = (key, language = 'en') => {
  return translations[language]?.[key] || translations['en'][key] || key;
};
