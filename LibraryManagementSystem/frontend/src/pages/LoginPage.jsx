import React, { useState } from 'react';

import {
  Link,
  useNavigate
} from 'react-router-dom';

import {
  FiUser,
  FiLock,
  FiEye,
  FiEyeOff,
  FiBookOpen,
  FiLogIn
} from 'react-icons/fi';

import api from '../services/api';

import './LoginPage.css';

export default function LoginPage() {

  const navigate = useNavigate();

  const [showPassword,
    setShowPassword] = useState(false);

  const [form, setForm] = useState({

    username: '',
    password: ''

  });

  const handleSubmit = async (e) => {

    e.preventDefault();

    try {

      const res = await api.post(
        '/login',
        form
      );
      
      console.log(res.data);

      localStorage.setItem(
        'library_token',
        res.data.token
      );

      localStorage.setItem(
        'library_user',
        JSON.stringify({
          username: res.data.username,
          role: res.data.role
        })
      );
      if (res.data.role === 'admin') {

  navigate('/');

}
else {

  navigate('/student/dashboard');
}
    } catch (err) {

      console.error("LOGIN ERROR:", err);
  
      if (err.response) {
  
          alert(
              err.response.data.message ||
              "Invalid username or password"
          );
  
      } else if (err.request) {
  
          alert("Backend server not responding");
  
      } else {
  
          alert("Unexpected error occurred");
      }
  }
  };

  return (

    <div className="login-container">

      <div className="login-overlay">

        <div className="login-card">

          {/* LOGO */}

          <div className="login-logo">

            <div className="logo-circle">

              <FiBookOpen />

            </div>

            <h1>
              LibraryMS
            </h1>

            <p>
              Smart Digital Library Portal
            </p>

          </div>

          {/* DIVIDER */}

          <div className="divider">

            <span>
              <FiBookOpen />
            </span>

          </div>

          {/* HEADER */}

          <div className="login-header">

            <h2>
              Welcome Back!
            </h2>

            <p>
              Login to continue your
              library journey
            </p>

          </div>

          {/* FORM */}

          <form
            onSubmit={handleSubmit}
            autoComplete="off"
          >
            {/* USERNAME */}

            <div className="input-group">

              <label>
                Username
              </label>

              <div className="input-wrapper">

                <FiUser
                  className="input-icon"
                />

<input
  type="text"
  name="fakeusername"

  autoComplete="new-password"

  placeholder="Enter your username"

  value={form.username}

  onChange={(e) =>
    setForm({
      ...form,
      username: e.target.value
    })
  }
/>

              </div>

            </div>

            {/* PASSWORD */}

            <div className="input-group">

              <label>
                Password
              </label>

              <div className="input-wrapper">

                <FiLock
                  className="input-icon"
                />

<input
  type={
    showPassword
      ? 'text'
      : 'password'
  }

  name="fakepassword"

  autoComplete="new-password"

  placeholder="Enter your password"

  value={form.password}

  onChange={(e) =>
    setForm({
      ...form,
      password: e.target.value
    })
  }
/>
                <span
                  className="eye-icon"
                  onClick={() =>
                    setShowPassword(
                      !showPassword
                    )
                  }
                >

                  {
                    showPassword
                      ? <FiEyeOff />
                      : <FiEye />
                  }

                </span>

              </div>

            </div>

            {/* OPTIONS */}

            <div className="login-options">

              <label className="remember-me">

                <input type="checkbox" />

                <span>
                  Remember Me
                </span>

              </label>

              <Link
                to="/forgot-password"
                className="forgot-link"
              >
                Forgot Password?
              </Link>

            </div>

            {/* BUTTON */}

            <button
              type="submit"
              className="login-btn"
            >

              Login

              <FiLogIn />

            </button>

          </form>

          {/* REGISTER */}

          <div className="register-link">

            Don’t have an account?

            <Link to="/register">

              Register

            </Link>

          </div>

        </div>

      </div>

    </div>
  );
}