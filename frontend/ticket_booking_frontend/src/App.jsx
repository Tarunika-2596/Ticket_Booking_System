import { BrowserRouter as Router, Routes, Route, Navigate, Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import Login from './components/Login';
import Register from './components/Register';
import AdminLogin from './components/AdminLogin';
import AdminRegister from './components/AdminRegister';
import AdminDashboard from './components/AdminDashboard';
import UserDashboard from './components/UserDashboard';
import MovieSeats from './components/MovieSeats';
import './App.css';

function App() {
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    const adminFlag = localStorage.getItem('isAdmin');
    
    if (token && userData) {
      setUser(JSON.parse(userData));
      setIsAdmin(adminFlag === 'true');
    }
  }, []);

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('isAdmin');
    setUser(null);
    setIsAdmin(false);
  };

  return (
    <Router>
      <div className="App">
        <nav className="navbar">
          <h1>TicketPro</h1>
          {!user && (
            <div>
              <Link to="/login">Login</Link> | 
              <Link to="/register">Register</Link> | 
              <Link to="/admin-login">Admin</Link>
              <Link to="/MovieSeats">User</Link>

            </div>
          )}
          {user && (
            <div>
              <span>Welcome, {user.name || user.email}</span>
              <button onClick={logout} className="logout-btn">Logout</button>
            </div>
          )}
        </nav>

        <Routes>
          {/* Auth Routes */}
          <Route path="/login" element={!user ? <Login setUser={setUser} setIsAdmin={setIsAdmin} /> : <Navigate to={isAdmin ? "/admin/dashboard" : "/user/dashboard"} />} />
          <Route path="/register" element={!user ? <Register setUser={setUser} setIsAdmin={setIsAdmin} /> : <Navigate to="/user/dashboard" />} />
          <Route path="/admin-login" element={!user ? <AdminLogin setUser={setUser} setIsAdmin={setIsAdmin} /> : <Navigate to="/admin/dashboard" />} />
          <Route path="/admin-register" element={!user ? <AdminRegister setUser={setUser} setIsAdmin={setIsAdmin} /> : <Navigate to="/admin/dashboard" />} />
          
          {/* Admin Routes */}
          <Route path="/admin/dashboard" element={user && isAdmin ? <AdminDashboard /> : <Navigate to="/admin-login" />} />
          <Route path="/admin/theatres" element={user && isAdmin ? <AdminDashboard /> : <Navigate to="/admin-login" />} />
          <Route path="/admin/movies" element={user && isAdmin ? <AdminDashboard /> : <Navigate to="/admin-login" />} />
          <Route path="/admin/bookings" element={user && isAdmin ? <AdminDashboard /> : <Navigate to="/admin-login" />} />
          
          {/* User Routes */}
          <Route path="/user/dashboard" element={user && !isAdmin ? <UserDashboard /> : <Navigate to="/login" />} />
          <Route path="/user/movies" element={user && !isAdmin ? <UserDashboard /> : <Navigate to="/login" />} />
          <Route path="/user/bookings" element={user && !isAdmin ? <UserDashboard /> : <Navigate to="/login" />} />
          <Route path="/movie/:movieId/seats" element={user && !isAdmin ? <MovieSeats /> : <Navigate to="/login" />} />
          
          {/* Default Routes */}
          <Route path="/admin" element={<Navigate to="/admin/dashboard" />} />
          <Route path="/dashboard" element={<Navigate to={user ? (isAdmin ? "/admin/dashboard" : "/user/dashboard") : "/login"} />} />
          <Route path="/" element={<Navigate to={user ? (isAdmin ? "/admin/dashboard" : "/user/dashboard") : "/login"} />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;