import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import { Container } from 'react-bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';
import Login from './components/Login';
import EmployeeList from './components/EmployeeList';
import EmployeeForm from './components/EmployeeForm';
import LeaveManagement from './components/LeaveManagement';
import Navbar from './components/Navbar';

const App = () => {
  const [token, setToken] = useState(localStorage.getItem('token'));

  const handleLogin = (token) => {
    localStorage.setItem('token', token);
    setToken(token);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setToken(null);
  };

  return (
    <Router>
      {token && <Navbar onLogout={handleLogout} />}
      <Container className="mt-4">
        <Routes>
          <Route
            path="/"
            element={token ? <Navigate to="/employees" /> : <Login setToken={handleLogin} />}
          />
          <Route
            path="/employees"
            element={token ? <EmployeeList token={token} /> : <Navigate to="/" />}
          />
          <Route
            path="/employees/add"
            element={token ? <EmployeeForm token={token} /> : <Navigate to="/" />}
          />
          <Route
            path="/employees/edit/:id"
            element={token ? <EmployeeForm token={token} /> : <Navigate to="/" />}
          />
          <Route
            path="/leave-management"
            element={token ? <LeaveManagement token={token} /> : <Navigate to="/" />}
          />
        </Routes>
      </Container>
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
      />
    </Router>
  );
};

export default App;