import { useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';

const AdminRegister = ({ setUser, setIsAdmin }) => {
  const [formData, setFormData] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [adminId, setAdminId] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post('http://localhost:5000/api/admin/register', formData);
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.admin));
      localStorage.setItem('isAdmin', 'true');
      setUser(response.data.admin);
      setIsAdmin(true);
      setAdminId(response.data.admin.adminId);
    } catch (error) {
      setError(error.response?.data?.error || 'Registration failed');
    }
  };

  if (adminId) {
    return (
      <div className="auth-container">
        <div className="admin-success">
          <h2>Admin Registration Successful!</h2>
          <div className="admin-id-display">
            <p><strong>Your Admin ID:</strong></p>
            <div className="admin-id">{adminId}</div>
            <p className="admin-note">
              Please save this Admin ID. You'll need it to identify your account.
              You can now manage your theatres and movies.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-container">
      <form onSubmit={handleSubmit} className="auth-form">
        <h2>Admin Registration</h2>
        {error && <div className="error">{error}</div>}
        <input
          type="text"
          placeholder="Full Name"
          value={formData.name}
          onChange={(e) => setFormData({...formData, name: e.target.value})}
          required
        />
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
        <button type="submit">Register as Admin</button>
        <p>
          Already have an admin account? <Link to="/admin-login">Login</Link>
        </p>
      </form>
    </div>
  );
};

export default AdminRegister;