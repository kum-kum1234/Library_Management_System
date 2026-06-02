import React, { useState } from 'react';

import {
  Link,
  useNavigate
} from 'react-router-dom';

import {
  FiUser,
  FiMail,
  FiLock,
  FiPhone,
  FiBookOpen,
  FiBell,
  FiEye,
  FiEyeOff
} from 'react-icons/fi';

import api from '../services/api';

import './RegisterPage.css';

export default function RegisterPage() {

  const navigate = useNavigate();

  const [showPassword, setShowPassword] =
    useState(false);

  const [showConfirmPassword,
    setShowConfirmPassword] =
    useState(false);

  const [form, setForm] = useState({

    fullName: '',
    email: '',
    username: '',
    phone: '',
    password: '',
    confirmPassword: '',
    role: 'student',
    department: ''

  });

  const handleSubmit = async (e) => {

    e.preventDefault();

    if (
      form.password !==
      form.confirmPassword
    ) {

      alert('Passwords do not match');
      return;
    }

    try {

      await api.post(

  '/register',

  {

    username: form.username,

    password: form.password,

    role: form.role

  }

);

      alert('Registration successful');

      navigate('/login');
    }
    catch (err) {

      console.error(err);

      alert('Registration failed');
    }
  };

  return (

    <div className="register-container">

      {/* LEFT SECTION */}

      <div className="register-left">

        <div className="overlay">

          <div className="brand">

            <h1>LibraryMS</h1>

            <p>
              Knowledge is Power
            </p>

          </div>

          <div className="left-content">

            <h2>
              Join Our Library
            </h2>

            <p>
              Create your account to access
              thousands of books, manage
              your loans, and explore
              knowledge anytime, anywhere.
            </p>

            <div className="feature-box">

              <div className="feature-item">

                <FiBookOpen
                  className="feature-icon"
                />

                <h4>
                  Access Thousands of Books
                </h4>

              </div>

              <div className="feature-item">

                <FiUser
                  className="feature-icon"
                />

                <h4>
                  Manage Your Loans Easily
                </h4>

              </div>

              <div className="feature-item">

                <FiBell
                  className="feature-icon"
                />

                <h4>
                  Get Timely Notifications
                </h4>

              </div>

            </div>

          </div>

        </div>

      </div>

      {/* RIGHT SECTION */}

      <div className="register-right">

        <form
          className="register-form"
          onSubmit={handleSubmit}
        >

          <div className="form-header">

            <div className="icon-circle">

              <FiUser />

            </div>

            <h1>
              Create an Account
            </h1>

            <p>
              Fill the details below
              to register
            </p>

          </div>

          <div className="form-grid">

            {/* FULL NAME */}

            <div className="input-group">

              <label>
                Full Name
              </label>

              <div className="input-wrapper">

                <FiUser
                  className="input-icon"
                />

                <input
                  type="text"
                  placeholder="Enter full name"
                  value={form.fullName}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      fullName: e.target.value
                    })
                  }
                />

              </div>

            </div>

            {/* EMAIL */}

            <div className="input-group">

              <label>
                Email
              </label>

              <div className="input-wrapper">

                <FiMail
                  className="input-icon"
                />

                <input
                  type="email"
                  placeholder="Enter email"
                  value={form.email}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      email: e.target.value
                    })
                  }
                />

              </div>

            </div>

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
                  placeholder="Choose username"
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

            {/* PHONE */}

            <div className="input-group">

              <label>
                Phone Number
              </label>

              <div className="input-wrapper">

                <FiPhone
                  className="input-icon"
                />

                <input
                  type="text"
                  placeholder="Enter phone"
                  value={form.phone}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      phone: e.target.value
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
                  placeholder="Create password"
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

            {/* CONFIRM PASSWORD */}

            <div className="input-group">

              <label>
                Confirm Password
              </label>

              <div className="input-wrapper">

                <FiLock
                  className="input-icon"
                />

                <input
                  type={
                    showConfirmPassword
                      ? 'text'
                      : 'password'
                  }
                  placeholder="Confirm password"
                  value={form.confirmPassword}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      confirmPassword:
                        e.target.value
                    })
                  }
                />

                <span
                  className="eye-icon"
                  onClick={() =>
                    setShowConfirmPassword(
                      !showConfirmPassword
                    )
                  }
                >

                  {
                    showConfirmPassword
                      ? <FiEyeOff />
                      : <FiEye />
                  }

                </span>

              </div>

            </div>

            {/* ROLE */}

            <div className="input-group">

              <label>
                Role
              </label>

              <div className="input-wrapper">

                <select
                  value={form.role}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      role: e.target.value
                    })
                  }
                >

                  <option value="student">
                    Student
                  </option>

                  <option value="admin">
                    Admin
                  </option>

                </select>

              </div>

            </div>

            {/* DEPARTMENT */}

            <div className="input-group">

              <label>
                Department / Class
              </label>

              <div className="input-wrapper">

                <input
                  type="text"
                  placeholder="Enter department"
                  value={form.department}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      department:
                        e.target.value
                    })
                  }
                />

              </div>

            </div>

          </div>

          {/* TERMS */}

          <div className="terms">

            <input type="checkbox" />

            <p>
              I agree to the Terms &
              Conditions
            </p>

          </div>

          {/* BUTTON */}

          <button
            type="submit"
            className="register-btn"
          >
            Register
          </button>

          {/* LOGIN */}

          <div className="login-link">

            Already have an account?

            <Link to="/login">
              Login
            </Link>

          </div>

        </form>

      </div>

    </div>
  );
}