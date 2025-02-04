const config = require('../config/config');

async function searchTMDB(query) {
  const apiKey = config.TMDB_API_KEY;
  const url = `https://api.themoviedb.org/3/search/multi?api_key=${apiKey}&query=${encodeURIComponent(query)}&language=ko-KR`;
  const res = await fetch(url);
  const data = await res.json();
  return data.results || [];
}

async function fetchTMDBMovieDetails(id) {
  const apiKey = config.TMDB_API_KEY;
  const url = `https://api.themoviedb.org/3/movie/${id}?api_key=${apiKey}&language=ko-KR`;
  const res = await fetch(url);
  return await res.json();
}

async function fetchTMDBTVDetails(id) {
  const apiKey = config.TMDB_API_KEY;
  const url = `https://api.themoviedb.org/3/tv/${id}?api_key=${apiKey}&language=ko-KR`;
  const res = await fetch(url);
  return await res.json();
}

module.exports = {
  searchTMDB,
  fetchTMDBMovieDetails,
  fetchTMDBTVDetails
}; 