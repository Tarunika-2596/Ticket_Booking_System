import { useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';

const AdminLogin = ({ setUser, setIsAdmin }) => {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post('http://localhost:5000/api/admin/login', formData);
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.admin));
      localStorage.setItem('isAdmin', 'true');
      setUser(response.data.admin);
      setIsAdmin(true);
    } catch (error) {
      setError(error.response?.data?.error || 'Login failed');
    }
  };

  return (
    <div className="auth-container">
      <form onSubmit={handleSubmit} className="auth-form">
        <h2>Admin Login</h2>
        {error && <div className="error">{error}</div>}
        <input
          type="email"
          placeholder="Email"
          value={formData.email}
          onChange={(e) => setFormData({...formData, email: e.target.value})}
          required
        />
        <input
          type="password"
          placeholder="Password"
          value={formData.password}
          onChange={(e) => setFormData({...formData, password: e.target.value})}
          required
        />
        <button type="submit">Login as Admin</button>
        <p>
          Don't have an admin account? <Link to="/admin-register">Sign Up</Link>
        </p>
        <p>
          <Link to="/login">User Login</Link>
        </p>
      </form>
    </div>
  );
};

export default AdminLogin;