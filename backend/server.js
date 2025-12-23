const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/ticketbooking')
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err));

// Models
const adminSchema = new mongoose.Schema({
  adminId: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  name: { type: String, required: true }
});

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  name: { type: String, required: true }
});

const theatreSchema = new mongoose.Schema({
  theatreName: { type: String, required: true },
  adminId: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin', required: true }
});

const movieSchema = new mongoose.Schema({
  movieName: { type: String, required: true },
  theatreId: { type: mongoose.Schema.Types.ObjectId, ref: 'Theatre', required: true },
  price: { type: Number, required: true },
  totalSeats: { type: Number, required: true }
});

const seatSchema = new mongoose.Schema({
  movieId: { type: mongoose.Schema.Types.ObjectId, ref: 'Movie', required: true },
  seatNumber: { type: String, required: true },
  status: { type: String, enum: ['available', 'locked', 'booked'], default: 'available' },
  lockedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  lockExpiryTime: { type: Date, default: null }
});

const bookingSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  movieId: { type: mongoose.Schema.Types.ObjectId, ref: 'Movie', required: true },
  seatNumbers: [{ type: String, required: true }],
  totalAmount: { type: Number, required: true },
  bookingStatus: { type: String, enum: ['confirmed', 'cancelled'], default: 'confirmed' },
  createdAt: { type: Date, default: Date.now }
});

const Admin = mongoose.model('Admin', adminSchema);
const User = mongoose.model('User', userSchema);
const Theatre = mongoose.model('Theatre', theatreSchema);
const Movie = mongoose.model('Movie', movieSchema);
const Seat = mongoose.model('Seat', seatSchema);
const Booking = mongoose.model('Booking', bookingSchema);

// Auth Middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) return res.status(401).json({ error: 'Access token required' });
  
  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Invalid token' });
    req.user = user;
    next();
  });
};

const authenticateAdmin = (req, res, next) => {
  authenticateToken(req, res, () => {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }
    next();
  });
};

// Utility function to release expired locks
const releaseExpiredLocks = async () => {
  await Seat.updateMany(
    { status: 'locked', lockExpiryTime: { $lt: new Date() } },
    { $set: { status: 'available', lockedBy: null, lockExpiryTime: null } }
  );
};

// Generate unique admin ID
const generateAdminId = () => {
  return 'ADM' + Date.now().toString().slice(-8) + Math.random().toString(36).substr(2, 4).toUpperCase();
};

// Auth Routes
app.post('/api/admin/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    const adminId = generateAdminId();
    
    const admin = new Admin({ adminId, name, email, password: hashedPassword });
    await admin.save();
    
    const token = jwt.sign({ id: admin._id, role: 'admin', adminId: admin.adminId }, JWT_SECRET);
    res.status(201).json({ 
      token, 
      admin: { id: admin._id, adminId: admin.adminId, name: admin.name, email: admin.email } 
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.post('/api/admin/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const admin = await Admin.findOne({ email });
    
    if (!admin || !await bcrypt.compare(password, admin.password)) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    const token = jwt.sign({ id: admin._id, role: 'admin', adminId: admin.adminId }, JWT_SECRET);
    res.json({ 
      token, 
      admin: { id: admin._id, adminId: admin.adminId, name: admin.name, email: admin.email } 
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/user/register', async (req, res) => {
  try {
    const { email, password, name } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const user = new User({ email, password: hashedPassword, name });
    await user.save();
    
    const token = jwt.sign({ id: user._id, role: 'user' }, JWT_SECRET);
    res.status(201).json({ token, user: { id: user._id, email: user.email, name: user.name } });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.post('/api/user/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    
    if (!user || !await bcrypt.compare(password, user.password)) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    const token = jwt.sign({ id: user._id, role: 'user' }, JWT_SECRET);
    res.json({ token, user: { id: user._id, email: user.email, name: user.name } });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Admin Routes
app.post('/api/admin/theatres', authenticateAdmin, async (req, res) => {
  try {
    const { theatreName } = req.body;
    const theatre = new Theatre({ theatreName, adminId: req.user.id });
    await theatre.save();
    res.status(201).json(theatre);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.post('/api/admin/movies', authenticateAdmin, async (req, res) => {
  try {
    const { movieName, theatreId, price, totalSeats } = req.body;
    
    const movie = new Movie({ movieName, theatreId, price, totalSeats });
    await movie.save();
    
    // Create seats for the movie
    const seats = [];
    const rows = ['A', 'B', 'C', 'D', 'E'];
    let seatCount = 0;
    
    for (let row of rows) {
      for (let num = 1; num <= Math.ceil(totalSeats / rows.length); num++) {
        if (seatCount >= totalSeats) break;
        seats.push({
          movieId: movie._id,
          seatNumber: `${row}${num}`
        });
        seatCount++;
      }
      if (seatCount >= totalSeats) break;
    }
    
    await Seat.insertMany(seats);
    res.status(201).json(movie);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.get('/api/admin/theatres', authenticateAdmin, async (req, res) => {
  try {
    const theatres = await Theatre.find({ adminId: req.user.id });
    res.json(theatres);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/admin/theatres/:id', authenticateAdmin, async (req, res) => {
  try {
    const { theatreName } = req.body;
    const theatre = await Theatre.findOneAndUpdate(
      { _id: req.params.id, adminId: req.user.id },
      { theatreName },
      { new: true }
    );
    if (!theatre) return res.status(404).json({ error: 'Theatre not found' });
    res.json(theatre);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/admin/theatres/:id', authenticateAdmin, async (req, res) => {
  try {
    console.log('Deleting theatre:', req.params.id, 'for admin:', req.user.id);
    
    const theatre = await Theatre.findOne({ _id: req.params.id, adminId: req.user.id });
    if (!theatre) {
      console.log('Theatre not found or access denied');
      return res.status(404).json({ error: 'Theatre not found or access denied' });
    }
    
    console.log('Theatre found:', theatre.theatreName);
    
    // Find all movies in this theatre
    const movies = await Movie.find({ theatreId: req.params.id });
    console.log('Found movies:', movies.length);
    
    if (movies.length > 0) {
      const movieIds = movies.map(m => m._id);
      
      // Delete seats
      const seatsDeleted = await Seat.deleteMany({ movieId: { $in: movieIds } });
      console.log('Seats deleted:', seatsDeleted.deletedCount);
      
      // Delete bookings
      const bookingsDeleted = await Booking.deleteMany({ movieId: { $in: movieIds } });
      console.log('Bookings deleted:', bookingsDeleted.deletedCount);
      
      // Delete movies
      const moviesDeleted = await Movie.deleteMany({ theatreId: req.params.id });
      console.log('Movies deleted:', moviesDeleted.deletedCount);
    }
    
    // Delete theatre
    const theatreDeleted = await Theatre.findByIdAndDelete(req.params.id);
    console.log('Theatre deleted:', theatreDeleted ? 'Yes' : 'No');
    
    res.json({ message: 'Theatre deleted successfully' });
  } catch (error) {
    console.error('Delete theatre error:', error);
    res.status(500).json({ error: `Failed to delete theatre: ${error.message}` });
  }
});

app.get('/api/admin/movies', authenticateAdmin, async (req, res) => {
  try {
    const theatres = await Theatre.find({ adminId: req.user.id });
    const theatreIds = theatres.map(t => t._id);
    const movies = await Movie.find({ theatreId: { $in: theatreIds } }).populate('theatreId', 'theatreName');
    res.json(movies);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/admin/movies/:id', authenticateAdmin, async (req, res) => {
  try {
    const { movieName, price, totalSeats } = req.body;
    const movie = await Movie.findById(req.params.id).populate('theatreId');
    if (!movie || movie.theatreId.adminId.toString() !== req.user.id) {
      return res.status(404).json({ error: 'Movie not found' });
    }
    
    movie.movieName = movieName;
    movie.price = price;
    if (totalSeats !== movie.totalSeats) {
      await Seat.deleteMany({ movieId: req.params.id });
      const seats = [];
      const rows = ['A', 'B', 'C', 'D', 'E'];
      let seatCount = 0;
      for (let row of rows) {
        for (let num = 1; num <= Math.ceil(totalSeats / rows.length); num++) {
          if (seatCount >= totalSeats) break;
          seats.push({ movieId: req.params.id, seatNumber: `${row}${num}` });
          seatCount++;
        }
        if (seatCount >= totalSeats) break;
      }
      await Seat.insertMany(seats);
      movie.totalSeats = totalSeats;
    }
    await movie.save();
    res.json(movie);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/admin/movies/:id', authenticateAdmin, async (req, res) => {
  try {
    const movie = await Movie.findById(req.params.id).populate('theatreId');
    if (!movie || movie.theatreId.adminId.toString() !== req.user.id) {
      return res.status(404).json({ error: 'Movie not found' });
    }
    await Seat.deleteMany({ movieId: req.params.id });
    await Booking.deleteMany({ movieId: req.params.id });
    await Movie.findByIdAndDelete(req.params.id);
    res.json({ message: 'Movie deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/admin/movies/:movieId/seats', authenticateAdmin, async (req, res) => {
  try {
    const movie = await Movie.findById(req.params.movieId).populate('theatreId');
    if (!movie || movie.theatreId.adminId.toString() !== req.user.id) {
      return res.status(404).json({ error: 'Movie not found' });
    }
    await releaseExpiredLocks();
    const seats = await Seat.find({ movieId: req.params.movieId });
    const bookings = await Booking.find({ movieId: req.params.movieId }).populate('userId', 'name email');
    res.json({ seats, bookings, movie });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/admin/reserve-seats', authenticateAdmin, async (req, res) => {
  try {
    const { movieId, seatNumbers } = req.body;
    const movie = await Movie.findById(movieId).populate('theatreId');
    if (!movie || movie.theatreId.adminId.toString() !== req.user.id) {
      return res.status(404).json({ error: 'Movie not found or access denied' });
    }
    
    await releaseExpiredLocks();
    const result = await Seat.updateMany(
      { movieId, seatNumber: { $in: seatNumbers }, status: 'available' },
      { $set: { status: 'booked', lockedBy: null, lockExpiryTime: null } }
    );
    
    if (result.modifiedCount !== seatNumbers.length) {
      return res.status(400).json({ error: 'Some seats are not available' });
    }
    
    const booking = new Booking({
      userId: req.user.id,
      movieId,
      seatNumbers,
      totalAmount: movie.price * seatNumbers.length,
      bookingStatus: 'confirmed'
    });
    await booking.save();
    
    res.json({ message: 'Seats reserved successfully', booking });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/admin/profile', authenticateAdmin, async (req, res) => {
  try {
    const admin = await Admin.findById(req.user.id).select('-password');
    res.json(admin);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// User Routes
app.get('/api/movies', authenticateToken, async (req, res) => {
  try {
    const movies = await Movie.find().populate('theatreId', 'theatreName');
    res.json(movies);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/movies/:movieId/seats', authenticateToken, async (req, res) => {
  try {
    await releaseExpiredLocks();
    const seats = await Seat.find({ movieId: req.params.movieId });
    res.json(seats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Critical: Seat locking with concurrency handling
app.post('/api/seats/lock', authenticateToken, async (req, res) => {
  try {
    const { movieId, seatNumbers } = req.body;
    const lockDuration = 10 * 1000; // 10 seconds
    const lockExpiryTime = new Date(Date.now() + lockDuration);
    
    await releaseExpiredLocks();
    
    // Check if all seats are available
    const seats = await Seat.find({
      movieId,
      seatNumber: { $in: seatNumbers },
      status: 'available'
    });
    
    if (seats.length !== seatNumbers.length) {
      return res.status(400).json({ error: 'Some seats are not available' });
    }
    
    // Atomically lock all seats
    const result = await Seat.updateMany(
      {
        movieId,
        seatNumber: { $in: seatNumbers },
        status: 'available'
      },
      {
        $set: {
          status: 'locked',
          lockedBy: req.user.id,
          lockExpiryTime
        }
      }
    );
    
    if (result.modifiedCount !== seatNumbers.length) {
      return res.status(400).json({ error: 'Failed to lock seats - concurrency conflict' });
    }
    
    res.json({ message: 'Seats locked successfully', lockExpiryTime });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Booking confirmation
app.post('/api/bookings/confirm', authenticateToken, async (req, res) => {
  try {
    const { movieId, seatNumbers, paymentSuccess } = req.body;
    
    if (!paymentSuccess) {
      // Release locked seats
      await Seat.updateMany(
        {
          movieId,
          seatNumber: { $in: seatNumbers },
          lockedBy: req.user.id,
          status: 'locked'
        },
        {
          $set: {
            status: 'available',
            lockedBy: null,
            lockExpiryTime: null
          }
        }
      );
      
      return res.status(400).json({ error: 'Payment failed - seats released' });
    }
    
    // Confirm booking
    const seats = await Seat.find({
      movieId,
      seatNumber: { $in: seatNumbers },
      lockedBy: req.user.id,
      status: 'locked'
    });
    
    if (seats.length !== seatNumbers.length) {
      return res.status(400).json({ error: 'Seats no longer locked by you' });
    }
    
    // Mark seats as booked
    await Seat.updateMany(
      {
        movieId,
        seatNumber: { $in: seatNumbers },
        lockedBy: req.user.id,
        status: 'locked'
      },
      {
        $set: {
          status: 'booked',
          lockedBy: null,
          lockExpiryTime: null
        }
      }
    );
    
    // Create booking record
    const movie = await Movie.findById(movieId);
    const totalAmount = movie.price * seatNumbers.length;
    
    const booking = new Booking({
      userId: req.user.id,
      movieId,
      seatNumbers,
      totalAmount
    });
    
    await booking.save();
    
    res.json({ message: 'Booking confirmed', booking });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/bookings', authenticateToken, async (req, res) => {
  try {
    const bookings = await Booking.find({ userId: req.user.id })
      .populate('movieId', 'movieName price')
      .sort({ createdAt: -1 });
    res.json(bookings);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/bookings/:bookingId', authenticateToken, async (req, res) => {
  try {
    const booking = await Booking.findOne({ 
      _id: req.params.bookingId, 
      userId: req.user.id 
    });
    
    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }
    
    if (booking.bookingStatus === 'cancelled') {
      return res.status(400).json({ error: 'Booking already cancelled' });
    }
    
    // Release the seats back to available
    await Seat.updateMany(
      {
        movieId: booking.movieId,
        seatNumber: { $in: booking.seatNumbers },
        status: 'booked'
      },
      {
        $set: {
          status: 'available',
          lockedBy: null,
          lockExpiryTime: null
        }
      }
    );
    
    // Mark booking as cancelled
    booking.bookingStatus = 'cancelled';
    await booking.save();
    
    res.json({ message: 'Booking cancelled successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Test route to verify server is working
app.get('/api/test', (req, res) => {
  res.json({ message: 'Server is working', timestamp: new Date() });
});

// Cleanup expired locks every minute
setInterval(releaseExpiredLocks, 60000);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log('Available routes:');
  console.log('DELETE /api/admin/theatres/:id');
  console.log('GET /api/test');
});