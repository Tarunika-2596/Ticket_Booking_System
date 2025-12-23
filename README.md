# Movie Ticket Booking System

A full-stack movie ticket booking system with strong backend logic, seat-level booking, and concurrency handling.

## Features

### Backend Features
- **JWT Authentication** for users and admins
- **Seat Locking Mechanism** with 5-minute expiry
- **Concurrency Handling** using MongoDB transactions
- **Atomic Seat Updates** to prevent double booking
- **Automatic Lock Expiry** cleanup
- **Production-grade Error Handling**

### Frontend Features
- **Real-time Seat Status** updates
- **Interactive Seat Selection** with visual feedback
- **Lock Timer** countdown during payment
- **Responsive Design** for mobile and desktop
- **Admin Dashboard** for theatre and movie management
- **User Dashboard** with booking history

## Technology Stack

- **Backend**: Node.js, Express.js, MongoDB, Mongoose
- **Frontend**: React, React Router, Axios
- **Authentication**: JWT (JSON Web Tokens)
- **Database**: MongoDB with transactions

## Setup Instructions

### Prerequisites
- Node.js (v14 or higher)
- MongoDB (local or cloud)
- npm or yarn

### Backend Setup

1. Navigate to backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Create `.env` file (already created) and update MongoDB URI if needed

4. Seed admin user:
```bash
node seed.js
```

5. Start backend server:
```bash
npm start
```

Backend will run on `http://localhost:5000`

### Frontend Setup

1. Navigate to frontend directory:
```bash
cd frontend/ticket_booking_frontend
```

2. Install dependencies:
```bash
npm install
```

3. Start frontend development server:
```bash
npm run dev
```

Frontend will run on `http://localhost:5173`

## Default Login Credentials

### Admin Login
- Email: `admin@cinema.com`
- Password: `admin123`

### User Registration
Users need to register through the registration form.

## API Endpoints

### Authentication
- `POST /api/admin/login` - Admin login
- `POST /api/user/register` - User registration
- `POST /api/user/login` - User login

### Admin Routes (Protected)
- `POST /api/admin/theatres` - Create theatre
- `POST /api/admin/movies` - Create movie
- `GET /api/admin/theatres` - Get admin's theatres

### User Routes (Protected)
- `GET /api/movies` - Get all movies
- `GET /api/movies/:movieId/seats` - Get seats for a movie
- `POST /api/seats/lock` - Lock selected seats
- `POST /api/bookings/confirm` - Confirm booking
- `GET /api/bookings` - Get user's bookings

## Key Backend Logic

### Seat Locking Flow
1. User selects seats and clicks "Proceed to Payment"
2. Backend atomically checks and locks seats using MongoDB transactions
3. Seats are locked for 5 minutes with expiry timestamp
4. User completes payment within time limit
5. On success: seats marked as booked, booking record created
6. On failure/timeout: seats automatically released

### Concurrency Handling
- MongoDB transactions ensure atomic operations
- Optimistic locking prevents race conditions
- Real-time seat status updates
- Automatic cleanup of expired locks

### Security Features
- JWT token authentication
- Protected routes for admin and user
- Input validation and sanitization
- Error handling without exposing sensitive data

## Database Models

### Admin
- adminId, email, password

### User
- userId, name, email, password

### Theatre
- theatreId, theatreName, adminId

### Movie
- movieId, movieName, theatreId, price, totalSeats

### Seat
- seatId, movieId, seatNumber, status, lockedBy, lockExpiryTime

### Booking
- bookingId, userId, movieId, seatNumbers, totalAmount, bookingStatus, createdAt

## Production Considerations

1. **Environment Variables**: Update JWT secret and MongoDB URI
2. **HTTPS**: Enable SSL/TLS in production
3. **Rate Limiting**: Add API rate limiting
4. **Logging**: Implement proper logging system
5. **Monitoring**: Add health checks and monitoring
6. **Backup**: Regular database backups
7. **Scaling**: Consider Redis for session management

## Testing the System

1. **Admin Flow**:
   - Login as admin
   - Create theatre
   - Add movies with seat configuration

2. **User Flow**:
   - Register new user
   - Browse available movies
   - Select seats and test locking mechanism
   - Complete booking process

3. **Concurrency Testing**:
   - Open multiple browser tabs
   - Try booking same seats simultaneously
   - Verify only one booking succeeds

## Troubleshooting

### Common Issues
1. **MongoDB Connection**: Ensure MongoDB is running
2. **Port Conflicts**: Check if ports 5000/5173 are available
3. **CORS Issues**: Backend CORS is configured for localhost
4. **Token Expiry**: Tokens don't expire by default (add expiry in production)

### Development Tips
- Use MongoDB Compass to view database
- Check browser console for frontend errors
- Monitor backend logs for API issues
- Test with multiple users for concurrency

This system is designed to be **viva-ready** with clear separation of concerns, proper error handling, and industry-standard practices.