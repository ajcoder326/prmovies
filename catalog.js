// PRMovies Catalog Module - SYNCHRONOUS VERSION for Rhino JS

var catalog = [
  {
    title: "Featured",
    filter: ""
  },
  {
    title: "Trending",
    filter: "/genre/top-rated"
  },
  {
    title: "Bollywood",
    filter: "/genre/bollywood"
  },
  {
    title: "Hollywood",
    filter: "/genre/hollywood"
  },
  {
    title: "South Special",
    filter: "/genre/south-special"
  },
  {
    title: "TV Shows",
    filter: "/genre/tv-shows"
  },
  {
    title: "Dual Audio",
    filter: "/genre/dual-audio"
  },
  {
    title: "Hindi Dubbed",
    filter: "/genre/hindi-dubbed"
  }
];

var genres = [
  {
    title: "Action",
    filter: "/genre/action"
  },
  {
    title: "Comedy",
    filter: "/genre/comedy"
  },
  {
    title: "Drama",
    filter: "/genre/drama"
  },
  {
    title: "Horror",
    filter: "/genre/horror"
  },
  {
    title: "Sci-Fi",
    filter: "/genre/science-fiction"
  },
  {
    title: "Thriller",
    filter: "/genre/thriller"
  },
  {
    title: "Romance",
    filter: "/genre/romance"
  },
  {
    title: "Crime",
    filter: "/genre/crime"
  },
  {
    title: "Adventure",
    filter: "/genre/adventure"
  },
  {
    title: "Animation",
    filter: "/genre/animation"
  },
  {
    title: "Fantasy",
    filter: "/genre/fantasy"
  },
  {
    title: "Mystery",
    filter: "/genre/mystery"
  }
];

var years = [
  { title: "2025", filter: "/release-year/2025" },
  { title: "2024", filter: "/release-year/2024" },
  { title: "2023", filter: "/release-year/2023" },
  { title: "2022", filter: "/release-year/2022" },
  { title: "2021", filter: "/release-year/2021" }
];

var countries = [
  { title: "USA", filter: "/country/usa" },
  { title: "UK", filter: "/country/uk" },
  { title: "India", filter: "/country/india" },
  { title: "China", filter: "/country/china" },
  { title: "France", filter: "/country/france" }
];

function getCatalog() {
  return catalog;
}

function getGenres() {
  return genres;
}

function getYears() {
  return years;
}

function getCountries() {
  return countries;
}
