import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';

const AdminDashboard = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [theatres, setTheatres] = useState([]);
  const [movies, setMovies] = useState([]);
  
  // Determine active tab from URL
  const getActiveTab = () => {
    if (location.pathname.includes('/theatres')) return 'theatres';
    if (location.pathname.includes('/movies')) return 'movies';
    if (location.pathname.includes('/bookings')) return 'bookings';
    return 'dashboard';
  };
  
  const [activeTab, setActiveTab] = useState(getActiveTab());
  const [showTheatreForm, setShowTheatreForm] = useState(false);
  const [showMovieForm, setShowMovieForm] = useState(false);
  const [editingTheatre, setEditingTheatre] = useState(null);
  const [editingMovie, setEditingMovie] = useState(null);
  const [selectedMovie, setSelectedMovie] = useState(null);
  const [selectedMovieId, setSelectedMovieId] = useState('');
  const [movieSeats, setMovieSeats] = useState([]);
  const [movieBookings, setMovieBookings] = useState([]);
  const [selectedSeats, setSelectedSeats] = useState([]);
  
  const [theatreData, setTheatreData] = useState({ theatreName: '' });
  const [movieData, setMovieData] = useState({
    movieName: '',
    theatreId: '',
    price: '',
    totalSeats: ''
  });

  const getAuthHeaders = () => ({
    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
  });

  useEffect(() => {
    fetchTheatres();
    fetchMovies();
    setActiveTab(getActiveTab());
  }, [location.pathname]);

  const fetchTheatres = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/admin/theatres', getAuthHeaders());
      setTheatres(response.data);
    } catch (error) {
      console.error('Error fetching theatres:', error);
    }
  };

  const fetchMovies = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/admin/movies', getAuthHeaders());
      console.log('Fetched movies:', response.data);
      setMovies(response.data);
    } catch (error) {
      console.error('Error fetching movies:', error.response?.data || error.message);
    }
  };

  const fetchMovieSeats = async (movieId) => {
    try {
      const response = await axios.get(`http://localhost:5000/api/admin/movies/${movieId}/seats`, getAuthHeaders());
      console.log('Fetched movie seats data:', response.data);
      setMovieSeats(response.data.seats);
      setMovieBookings(response.data.bookings);
      setSelectedMovie(response.data.movie);
    } catch (error) {
      console.error('Error fetching movie seats:', error.response?.data || error.message);
    }
  };

  const handleCreateTheatre = async (e) => {
    e.preventDefault();
    try {
      await axios.post('http://localhost:5000/api/admin/theatres', theatreData, getAuthHeaders());
      setTheatreData({ theatreName: '' });
      setShowTheatreForm(false);
      fetchTheatres();
    } catch (error) {
      console.error('Error creating theatre:', error);
    }
  };

  const handleUpdateTheatre = async (e) => {
    e.preventDefault();
    try {
      await axios.put(`http://localhost:5000/api/admin/theatres/${editingTheatre._id}`, theatreData, getAuthHeaders());
      setTheatreData({ theatreName: '' });
      setEditingTheatre(null);
      fetchTheatres();
    } catch (error) {
      console.error('Error updating theatre:', error);
    }
  };

  const handleDeleteTheatre = async (theatreId) => {
    if (window.confirm('Are you sure? This will permanently delete the theatre and ALL movies, seats, and bookings associated with it. This action cannot be undone.')) {
      try {
        console.log('Attempting to delete theatre:', theatreId);
        const response = await axios.delete(`http://localhost:5000/api/admin/theatres/${theatreId}`, getAuthHeaders());
        console.log('Delete response:', response.data);
        alert(response.data.message);
        fetchTheatres();
        fetchMovies();
      } catch (error) {
        console.error('Delete theatre error:', error);
        console.error('Error response:', error.response?.data);
        console.error('Error status:', error.response?.status);
        alert(error.response?.data?.error || 'Failed to delete theatre. Check console for details.');
      }
    }
  };

  const handleCreateMovie = async (e) => {
    e.preventDefault();
    try {
      await axios.post('http://localhost:5000/api/admin/movies', movieData, getAuthHeaders());
      setMovieData({ movieName: '', theatreId: '', price: '', totalSeats: '' });
      setShowMovieForm(false);
      fetchMovies();
    } catch (error) {
      console.error('Error creating movie:', error);
    }
  };

  const handleUpdateMovie = async (e) => {
    e.preventDefault();
    try {
      await axios.put(`http://localhost:5000/api/admin/movies/${editingMovie._id}`, movieData, getAuthHeaders());
      setMovieData({ movieName: '', theatreId: '', price: '', totalSeats: '' });
      setEditingMovie(null);
      fetchMovies();
    } catch (error) {
      console.error('Error updating movie:', error);
    }
  };

  const handleDeleteMovie = async (movieId) => {
    if (window.confirm('Are you sure? This will delete all bookings for this movie.')) {
      try {
        await axios.delete(`http://localhost:5000/api/admin/movies/${movieId}`, getAuthHeaders());
        fetchMovies();
      } catch (error) {
        console.error('Error deleting movie:', error);
      }
    }
  };

  const handleSeatClick = (seatNumber) => {
    const seat = movieSeats.find(s => s.seatNumber === seatNumber);
    if (seat.status !== 'available') return;

    setSelectedSeats(prev => 
      prev.includes(seatNumber) 
        ? prev.filter(s => s !== seatNumber)
        : [...prev, seatNumber]
    );
  };

  const handleReserveSeats = async () => {
    if (selectedSeats.length === 0) return;
    
    try {
      await axios.post('http://localhost:5000/api/admin/reserve-seats', {
        movieId: selectedMovie._id,
        seatNumbers: selectedSeats
      }, getAuthHeaders());
      
      setSelectedSeats([]);
      fetchMovieSeats(selectedMovie._id);
      alert('Seats reserved successfully!');
    } catch (error) {
      alert(error.response?.data?.error || 'Failed to reserve seats');
    }
  };

  const getSeatClass = (seat) => {
    if (seat.status === 'booked') return 'seat booked';
    if (seat.status === 'locked') return 'seat locked';
    if (selectedSeats.includes(seat.seatNumber)) return 'seat selected';
    return 'seat available';
  };

  const startEditTheatre = (theatre) => {
    setEditingTheatre(theatre);
    setTheatreData({ theatreName: theatre.theatreName });
  };

  const startEditMovie = (movie) => {
    setEditingMovie(movie);
    setMovieData({
      movieName: movie.movieName,
      theatreId: movie.theatreId._id,
      price: movie.price,
      totalSeats: movie.totalSeats
    });
  };

  const user = JSON.parse(localStorage.getItem('user'));

  return (
    <div className="admin-dashboard">
      <div className="admin-header">
        <h2>Admin Dashboard</h2>
        <div className="admin-info">
          <p><strong>Admin ID:</strong> {user?.adminId}</p>
          <p><strong>Name:</strong> {user?.name}</p>
        </div>
      </div>
      
      <div className="tabs">
        <button 
          className={activeTab === 'dashboard' ? 'active' : ''}
          onClick={() => {
            setActiveTab('dashboard');
            navigate('/admin/dashboard');
          }}
        >
          Dashboard
        </button>
        <button 
          className={activeTab === 'theatres' ? 'active' : ''}
          onClick={() => {
            setActiveTab('theatres');
            navigate('/admin/theatres');
          }}
        >
          Theatres
        </button>
        <button 
          className={activeTab === 'movies' ? 'active' : ''}
          onClick={() => {
            setActiveTab('movies');
            navigate('/admin/movies');
          }}
        >
          Movies
        </button>
        <button 
          className={activeTab === 'bookings' ? 'active' : ''}
          onClick={() => {
            setActiveTab('bookings');
            navigate('/admin/bookings');
          }}
        >
          Seat Management
        </button>
      </div>

      {(activeTab === 'dashboard') && (
        <div className="dashboard-overview">
          <h3>Admin Overview</h3>
          <div className="stats">
            <div className="stat-card">
              <h4>Total Theatres</h4>
              <p>{theatres.length}</p>
            </div>
            <div className="stat-card">
              <h4>Total Movies</h4>
              <p>{movies.length}</p>
            </div>
          </div>
        </div>
      )}

      {(activeTab === 'theatres') && (
        <div>
          <div className="admin-actions">
            <button onClick={() => setShowTheatreForm(!showTheatreForm)}>
              Add Theatre
            </button>
          </div>

          {(showTheatreForm || editingTheatre) && (
            <form onSubmit={editingTheatre ? handleUpdateTheatre : handleCreateTheatre} className="admin-form">
              <h3>{editingTheatre ? 'Edit Theatre' : 'Create Theatre'}</h3>
              <input
                type="text"
                placeholder="Theatre Name"
                value={theatreData.theatreName}
                onChange={(e) => setTheatreData({...theatreData, theatreName: e.target.value})}
                required
              />
              <div>
                <button type="submit">{editingTheatre ? 'Update' : 'Create'} Theatre</button>
                <button type="button" onClick={() => {
                  setEditingTheatre(null);
                  setShowTheatreForm(false);
                  setTheatreData({ theatreName: '' });
                }}>Cancel</button>
              </div>
            </form>
          )}

          <div className="theatres-list">
            <h3>Your Theatres</h3>
            {theatres.map(theatre => (
              <div key={theatre._id} className="theatre-card">
                <h4>{theatre.theatreName}</h4>
                <div className="card-actions">
                  <button onClick={() => startEditTheatre(theatre)}>Edit</button>
                  <button onClick={() => handleDeleteTheatre(theatre._id)} className="delete-btn">Delete</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {(activeTab === 'movies') && (
        <div>
          <div className="admin-actions">
            <button onClick={() => setShowMovieForm(!showMovieForm)}>
              Add Movie
            </button>
            <button onClick={fetchMovies}>
              Refresh Movies
            </button>
          </div>

          {(showMovieForm || editingMovie) && (
            <form onSubmit={editingMovie ? handleUpdateMovie : handleCreateMovie} className="admin-form">
              <h3>{editingMovie ? 'Edit Movie' : 'Create Movie'}</h3>
              <input
                type="text"
                placeholder="Movie Name"
                value={movieData.movieName}
                onChange={(e) => setMovieData({...movieData, movieName: e.target.value})}
                required
              />
              <select
                value={movieData.theatreId}
                onChange={(e) => setMovieData({...movieData, theatreId: e.target.value})}
                required
              >
                <option value="">Select Theatre</option>
                {theatres.map(theatre => (
                  <option key={theatre._id} value={theatre._id}>
                    {theatre.theatreName}
                  </option>
                ))}
              </select>
              <input
                type="number"
                placeholder="Price"
                value={movieData.price}
                onChange={(e) => setMovieData({...movieData, price: e.target.value})}
                required
              />
              <input
                type="number"
                placeholder="Total Seats"
                value={movieData.totalSeats}
                onChange={(e) => setMovieData({...movieData, totalSeats: e.target.value})}
                required
                min="1"
                max="1000"
              />
              <div>
                <button type="submit">{editingMovie ? 'Update' : 'Create'} Movie</button>
                <button type="button" onClick={() => {
                  setEditingMovie(null);
                  setShowMovieForm(false);
                  setMovieData({ movieName: '', theatreId: '', price: '', totalSeats: '' });
                }}>Cancel</button>
              </div>
            </form>
          )}

          <div className="movies-list">
            <h3>Your Movies ({movies.length})</h3>
            {movies.length === 0 ? (
              <p>No movies added yet. Create a theatre first, then add movies.</p>
            ) : (
              <div className="movies-grid">
                {movies.map(movie => (
                  <div key={movie._id} className="movie-card">
                    <h4>{movie.movieName}</h4>
                    <p>Theatre: {movie.theatreId?.theatreName || 'Unknown Theatre'}</p>
                    <p>Price: ₹{movie.price}</p>
                    <p>Total Seats: {movie.totalSeats}</p>
                    <div className="card-actions">
                      <button onClick={() => startEditMovie(movie)}>Edit</button>
                      <button onClick={() => handleDeleteMovie(movie._id)} className="delete-btn">Delete</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {(activeTab === 'bookings') && (
        <div>
          <div className="seat-management">
            <div className="admin-actions">
              <h3>Select Movie to Manage Seats</h3>
              <button onClick={fetchMovies}>Refresh Movies</button>
            </div>
            {movies.length === 0 ? (
              <p>No movies available. Please add movies first.</p>
            ) : (
              <select 
                value={selectedMovieId}
                onChange={(e) => {
                  setSelectedMovieId(e.target.value);
                  if (e.target.value) {
                    fetchMovieSeats(e.target.value);
                  } else {
                    setSelectedMovie(null);
                    setMovieSeats([]);
                    setMovieBookings([]);
                    setSelectedSeats([]);
                  }
                }}
              >
                <option value="">Select Movie</option>
                {movies.map(movie => (
                  <option key={movie._id} value={movie._id}>
                    {movie.movieName} - {movie.theatreId?.theatreName || 'Unknown Theatre'}
                  </option>
                ))}
              </select>
            )}

            {selectedMovie && (
              <div className="movie-seats-admin">
                <h4>{selectedMovie.movieName}</h4>
                <p>Price: ₹{selectedMovie.price}</p>
                
                <div className="screen">SCREEN</div>
                
                <div className="seats-grid">
                  {movieSeats.map(seat => (
                    <button
                      key={seat._id}
                      className={getSeatClass(seat)}
                      onClick={() => handleSeatClick(seat.seatNumber)}
                      disabled={seat.status !== 'available'}
                    >
                      {seat.seatNumber}
                    </button>
                  ))}
                </div>

                <div className="legend">
                  <div><span className="seat available"></span> Available</div>
                  <div><span className="seat selected"></span> Selected</div>
                  <div><span className="seat locked"></span> Locked</div>
                  <div><span className="seat booked"></span> Booked</div>
                </div>

                {selectedSeats.length > 0 && (
                  <div className="admin-reserve">
                    <p>Selected Seats: {selectedSeats.join(', ')}</p>
                    <button onClick={handleReserveSeats} className="reserve-btn">
                      Reserve Selected Seats
                    </button>
                  </div>
                )}

                <div className="bookings-info">
                  <h4>Current Bookings ({movieBookings.length})</h4>
                  {movieBookings.length === 0 ? (
                    <p>No bookings for this movie yet.</p>
                  ) : (
                    movieBookings.map(booking => (
                      <div key={booking._id} className="booking-info">
                        <p><strong>User:</strong> {booking.userId?.name || 'Unknown'} ({booking.userId?.email || 'Unknown'})</p>
                        <p><strong>Seats:</strong> {booking.seatNumbers.join(', ')}</p>
                        <p><strong>Amount:</strong> ₹{booking.totalAmount}</p>
                        <p><strong>Status:</strong> {booking.bookingStatus}</p>
                        <p><strong>Date:</strong> {new Date(booking.createdAt).toLocaleDateString()}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;