const API_KEY = '542c471c';
const BASE_URL = 'https://www.omdbapi.com/';

const searchInput = document.getElementById('searchInput');
const searchBtn = document.getElementById('searchBtn');
const resultsGrid = document.getElementById('resultsGrid');
const favCountSpan = document.getElementById('favCount');
const modal = document.getElementById('movieModal');
const modalBody = document.getElementById('modalBody');
const closeModal = document.querySelector('.close-modal');

let currentMovies = [];
let favorites = [];

function loadFavorites() {
  const stored = localStorage.getItem('movieFavorites');
  if(stored) {
    favorites = JSON.parse(stored);
  } else {
    favorites = [];
  }
  updateFavBadge();
}

function saveFavorites() {
  localStorage.setItem('movieFavorites', JSON.stringify(favorites));
  updateFavBadge();
}

function updateFavBadge() {
  favCountSpan.textContent = favorites.length;
}

function toggleFavorite(imdbID, buttonElement) {
  if(favorites.includes(imdbID)) {
    favorites = favorites.filter(id => id !== imdbID);
    if(buttonElement) buttonElement.classList.remove('active');
  } else {
    favorites.push(imdbID);
    if(buttonElement) buttonElement.classList.add('active');
  }
  saveFavorites();
  if(currentMovies.length) {
    displayMovies(currentMovies);
  }
}

function displayMovies(movies) {
  currentMovies = movies;
  if(!movies || movies.length === 0) {
    resultsGrid.innerHTML = '<div class="loader">No movies found. Try another title.</div>';
    return;
  }

  resultsGrid.innerHTML = movies.map(movie => {
  const isFav = favorites.includes(movie.imdbID);
  const posterUrl = (movie.Poster && movie.Poster !== 'N/A') ? movie.Poster : 'https://placehold.co/300x450?text=No+Poster';
  return `
    <div class="movie-card" data-id="${movie.imdbID}">
      <img src="${posterUrl}" alt="${movie.Title}">
      <h3>${movie.Title} (${movie.Year})</h3>
      <button class="fav-btn ${isFav ? 'active' : ''}" data-id="${movie.imdbID}">${isFav ? '❤️' : '🤍'}</button>
    </div>
  `;
}).join('');

  document.querySelectorAll('.movie-card').forEach(card => {
    const movieId = card.dataset.id;
    card.addEventListener('click', (e) => {
      if(e.target.classList.contains('fav-btn')) return;
      showMovieDetails(movieId);
    });
  });

  document.querySelectorAll('.fav-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const movieId = btn.dataset.id;
      toggleFavorite(movieId, btn);
    });
  });
}

async function searchMovies(query) {
  if(!query.trim()) {
    resultsGrid.innerHTML = '<div class="loader">🔍 Type a movie name above.</div>';
    return;
  }

  resultsGrid.innerHTML = '<div class="loader">🎬 Searching movies...</div>';
  
  try {
    const response = await fetch(`${BASE_URL}?apikey=${API_KEY}&s=${encodeURIComponent(query)}`);
    const data = await response.json();
    
    if(data.Response === 'False') {
      throw new Error(data.Error || 'No results');
    }
    
    displayMovies(data.Search);
  } catch(error) {
    console.error(error);
    resultsGrid.innerHTML = `<div class="loader">❌ ${error.message}. Please try again.</div>`;
  }
}

async function showMovieDetails(imdbID) {
  modalBody.innerHTML = '<div class="loader">Loading details...</div>';
  modal.style.display = 'block';
  
  try {
    const response = await fetch(`${BASE_URL}?apikey=${API_KEY}&i=${imdbID}&plot=full`);
    const movie = await response.json();
    
    if(movie.Response === 'False') throw new Error('Could not load details');

    const posterUrl = (movie.Poster && movie.Poster !== 'N/A') ? movie.Poster : 'https://placehold.co/300x450?text=No+Poster';

    const isFav = favorites.includes(movie.imdbID);
    modalBody.innerHTML = `
      <div style="display: flex; flex-direction: column; gap: 0.8rem;">
        <h2>${movie.Title} (${movie.Year})</h2>
        <img src="${posterUrl}" alt="${movie.Title}" style="max-width: 200px; border-radius: 12px;">
        <p><strong>⭐ IMDb Rating:</strong> ${movie.imdbRating} / 10</p>
        <p><strong>🎭 Genre:</strong> ${movie.Genre}</p>
        <p><strong>📅 Released:</strong> ${movie.Released}</p>
        <p><strong>🎬 Director:</strong> ${movie.Director}</p>
        <p><strong>📝 Plot:</strong> ${movie.Plot}</p>
        <p><strong>👥 Cast:</strong> ${movie.Actors}</p>
        <button id="modalFavBtn" class="fav-btn ${isFav ? 'active' : ''}" data-id="${movie.imdbID}">${isFav ? '❤️ Remove from favorites' : '🤍 Add to favorites'}</button>
      </div>
    `;
    
    const modalFavBtn = document.getElementById('modalFavBtn');
    if(modalFavBtn) {
      modalFavBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleFavorite(movie.imdbID, modalFavBtn);
        const isNowFav = favorites.includes(movie.imdbID);
        modalFavBtn.innerHTML = isNowFav ? '❤️ Remove from favorites' : '🤍 Add to favorites';
        modalFavBtn.classList.toggle('active', isNowFav);
        if(currentMovies.length) displayMovies(currentMovies);
      });
    }
  } catch(err) {
    modalBody.innerHTML = `<div class="loader">⚠️ ${err.message}</div>`;
  }
}

closeModal.onclick = () => {
  modal.style.display = 'none';
};
window.onclick = (event) => {
  if(event.target === modal) {
    modal.style.display = 'none';
  }
};

searchBtn.addEventListener('click', () => searchMovies(searchInput.value));
searchInput.addEventListener('keypress', (e) => {
  if(e.key === 'Enter') searchMovies(searchInput.value);
});

loadFavorites();
searchMovies('titanic');