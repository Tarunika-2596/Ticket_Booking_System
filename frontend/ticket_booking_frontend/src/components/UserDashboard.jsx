import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';

const UserDashboard = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [movies, setMovies] = useState([]);
  const [bookings, setBookings] = useState([]);
  
  // Determine active tab from URL
  const getActiveTab = () => {
    if (location.pathname.includes('/movies')) return 'movies';
    if (location.pathname.includes('/bookings')) return 'bookings';
    return 'dashboard';
  };
  
  const [activeTab, setActiveTab] = useState(getActiveTab());

  const getAuthHeaders = () => ({
    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
  });

  useEffect(() => {
    fetchMovies();
    fetchBookings();
    setActiveTab(getActiveTab());
  }, [location.pathname]);

  const fetchMovies = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/movies', getAuthHeaders());
      setMovies(response.data);
    } catch (error) {
      console.error('Error fetching movies:', error);
    }
  };

  const fetchBookings = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/bookings', getAuthHeaders());
      setBookings(response.data);
    } catch (error) {
      console.error('Error fetching bookings:', error);
    }
  };

  const cancelBooking = async (bookingId) => {
    if (window.confirm('Are you sure you want to cancel this booking? This action cannot be undone.')) {
      try {
        await axios.delete(`http://localhost:5000/api/bookings/${bookingId}`, getAuthHeaders());
        alert('Booking cancelled successfully!');
        fetchBookings(); // Refresh bookings list
      } catch (error) {
        alert(error.response?.data?.error || 'Failed to cancel booking');
        console.error('Error cancelling booking:', error);
      }
    }
  };

  return (
    <div className="user-dashboard">
      <div className="tabs">
        <button 
          className={activeTab === 'dashboard' ? 'active' : ''}
          onClick={() => {
            setActiveTab('dashboard');
            navigate('/user/dashboard');
          }}
        >
          Dashboard
        </button>
        <button 
          className={activeTab === 'movies' ? 'active' : ''}
          onClick={() => {
            setActiveTab('movies');
            navigate('/user/movies');
          }}
        >
          Movies
        </button>
        <button 
          className={activeTab === 'bookings' ? 'active' : ''}
          onClick={() => {
            setActiveTab('bookings');
            navigate('/user/bookings');
          }}
        >
          My Bookings
        </button>
      </div>

      {(activeTab === 'dashboard') && (
        <div className="user-overview">
          <h2>Welcome to Cinema Booking</h2>
          <div className="stats">
            <div className="stat-card">
              <h4>Available Movies</h4>
              <p>{movies.length}</p>
            </div>
            <div className="stat-card">
              <h4>My Bookings</h4>
              <p>{bookings.length}</p>
            </div>
          </div>
        </div>
      )}

      {(activeTab === 'movies') && (
        <div className="movies-grid">
          <h2>Available Movies</h2>
          {movies.map(movie => (
            <div key={movie._id} className="movie-card">
              <h3>{movie.movieName}</h3>
              <p>Theatre: {movie.theatreId.theatreName}</p>
              <p>Price: ₹{movie.price}</p>
              <p>Total Seats: {movie.totalSeats}</p>
              <Link to={`/movie/${movie._id}/seats`} className="book-btn">
                Book Tickets
              </Link>
            </div>
          ))}
        </div>
      )}

      {(activeTab === 'bookings') && (
        <div className="bookings-list">
          <h2>My Bookings</h2>
          {bookings.map(booking => (
            <div key={booking._id} className="booking-card">
              <h3>{booking.movieId.movieName}</h3>
              <p>Seats: {booking.seatNumbers.join(', ')}</p>
              <p>Total Amount: ₹{booking.totalAmount}</p>
              <p>Status: <span style={{color: 'red', fontWeight: 'bold'}}>{booking.bookingStatus}</span></p>
              <p>Booked on: {new Date(booking.createdAt).toLocaleDateString()}</p>
              {booking.bookingStatus !== 'cancelled' && (
                <button 
                  onClick={() => cancelBooking(booking._id)}
                  className="cancel-btn"
                >
                  Cancel Booking
                </button>
              )}
            </div>
          ))}
         
        </div>
      )}
    </div>
  );
};

export default UserDashboard;