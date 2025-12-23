import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

const MovieSeats = () => {
  const { movieId } = useParams();
  const navigate = useNavigate();
  const [seats, setSeats] = useState([]);
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [movie, setMovie] = useState(null);
  const [isLocking, setIsLocking] = useState(false);
  const [lockTimer, setLockTimer] = useState(null);
  const [timeLeft, setTimeLeft] = useState(0);

  const getAuthHeaders = () => ({
    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
  });

  useEffect(() => {
    fetchSeats();
    fetchMovieDetails();
  }, [movieId]);

  useEffect(() => {
    if (timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else if (timeLeft === 0 && lockTimer) {
      // Lock expired, refresh seats
      fetchSeats();
      setLockTimer(null);
    }
  }, [timeLeft, lockTimer]);

  const fetchSeats = async () => {
    try {
      const response = await axios.get(`http://localhost:5000/api/movies/${movieId}/seats`, getAuthHeaders());
      setSeats(response.data);
    } catch (error) {
      console.error('Error fetching seats:', error);
    }
  };

  const fetchMovieDetails = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/movies', getAuthHeaders());
      const movieData = response.data.find(m => m._id === movieId);
      setMovie(movieData);
    } catch (error) {
      console.error('Error fetching movie details:', error);
    }
  };

  const handleSeatClick = (seatNumber) => {
    if (isLocking) return; // Prevent selection during lock process
    
    const seat = seats.find(s => s.seatNumber === seatNumber);
    if (seat.status !== 'available') return;

    setSelectedSeats(prev => 
      prev.includes(seatNumber) 
        ? prev.filter(s => s !== seatNumber)
        : [...prev, seatNumber]
    );
  };

  const lockSeats = async () => {
    if (selectedSeats.length === 0) return;
    
    setIsLocking(true);
    try {
      const response = await axios.post('http://localhost:5000/api/seats/lock', {
        movieId,
        seatNumbers: selectedSeats
      }, getAuthHeaders());

      // Start countdown timer
      const lockExpiry = new Date(response.data.lockExpiryTime);
      const now = new Date();
      const timeLeftSeconds = Math.floor((lockExpiry - now) / 1000);
      
      setTimeLeft(timeLeftSeconds);
      setLockTimer(true);
      
      // Refresh seats to show locked status
      fetchSeats();
    } catch (error) {
      alert(error.response?.data?.error || 'Failed to lock seats');
      fetchSeats(); // Refresh to get latest status
    }
    setIsLocking(false);
  };

  const confirmBooking = async (paymentSuccess = true) => {
    try {
      const response = await axios.post('http://localhost:5000/api/bookings/confirm', {
        movieId,
        seatNumbers: selectedSeats,
        paymentSuccesszz
      }, getAuthHeaders());

      if (paymentSuccess) {
        // Immediately update seat status to booked
        setSeats(prevSeats => 
          prevSeats.map(seat => 
            selectedSeats.includes(seat.seatNumber) 
              ? { ...seat, status: 'booked' }
              : seat
          )
        );
        
        // Reset booking state
        setSelectedSeats([]);
        setLockTimer(null);
        setTimeLeft(0);
        
        alert('Booking confirmed successfully!');
      } else {
        // Reset state for cancelled payment
        setSelectedSeats([]);
        setLockTimer(null);
        setTimeLeft(0);
        fetchSeats();
      }
    } catch (error) {
      alert(error.response?.data?.error || 'Booking failed');
      fetchSeats();
      setSelectedSeats([]);
      setLockTimer(null);
      setTimeLeft(0);
    }
  };

  const getSeatClass = (seat) => {
    if (seat.status === 'booked') return 'seat booked';
    if (seat.status === 'locked') return 'seat locked';
    if (selectedSeats.includes(seat.seatNumber)) return 'seat selected';
    return 'seat available';
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!movie) return <div>Loading...</div>;

  return (
    <div className="movie-seats">
      <h2>{movie.movieName}</h2>
      <p>Theatre: {movie.theatreId.theatreName}</p>
      <p>Price per seat: ₹{movie.price}</p>

      {lockTimer && (
        <div className="lock-timer">
          <p>Seats locked! Complete payment within: {formatTime(timeLeft)}</p>
        </div>
      )}

      <div className="screen">SCREEN</div>
      
      <div className="seats-grid">
        {seats.map(seat => (
          <button
            key={seat._id}
            className={getSeatClass(seat)}
            onClick={() => handleSeatClick(seat.seatNumber)}
            disabled={seat.status !== 'available' || isLocking}
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

      <div className="booking-summary">
        <p>Selected Seats: {selectedSeats.join(', ')}</p>
        <p>Total Amount: ₹{selectedSeats.length * movie.price}</p>
        
        {!lockTimer && selectedSeats.length > 0 && (
          <button onClick={lockSeats} disabled={isLocking} className="lock-btn">
            {isLocking ? 'Locking...' : 'Proceed to Payment'}
          </button>
        )}

        {lockTimer && (
          <div className="payment-buttons">
            <button onClick={() => confirmBooking(true)} className="confirm-btn">
              Confirm Payment
            </button>
            <button onClick={() => confirmBooking(false)} className="cancel-btn">
              Cancel Payment
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default MovieSeats;