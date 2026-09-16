import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import api from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function Register() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    role: 'attendee'
  });

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const update = (field, value) => {
    setForm((current) => ({
      ...current,
      [field]: value
    }));
  };

  const submit = async (event) => {
    event.preventDefault();

    setError('');

    if (!form.name.trim()) {
      setError('Full name is required');
      return;
    }

    if (!form.email.trim()) {
      setError('Email is required');
      return;
    }

    if (form.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);

    try {
      const response = await api.post('/auth/register', {
        name: form.name.trim(),
        email: form.email.trim().toLowerCase(),
        password: form.password,
        role: form.role
      });

      login(response.data);

      if (response.data.user?.role === 'admin') {
        navigate('/admin', { replace: true });
      } else if (response.data.user?.role === 'organizer') {
        navigate('/organizer', { replace: true });
      } else {
        navigate('/dashboard', { replace: true });
      }
    } catch (err) {
      console.error('Registration error:', err);

      setError(
        err.response?.data?.message ||
        'Registration failed. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container py-16 max-w-3xl">
      <div className="card p-7">

        {/* Header */}
        <div>
          <span className="badge">
            EventHub
          </span>

          <h1 className="text-3xl font-black mt-3">
            Create your account
          </h1>

          <p className="text-gray-500 mt-2">
            Join EventHub to discover events,
            organize experiences, or manage the
            platform.
          </p>
        </div>

        {/* Registration Form */}
        <form
          onSubmit={submit}
          className="mt-7"
        >

          {/* Full Name */}
          <label className="text-sm font-bold block">
            Full name
          </label>

          <input
            className="field mt-1"
            type="text"
            placeholder="Full name"
            value={form.name}
            onChange={(event) =>
              update('name', event.target.value)
            }
            required
          />

          {/* Email */}
          <label className="text-sm font-bold block mt-4">
            Email
          </label>

          <input
            className="field mt-1"
            type="email"
            placeholder="Email address"
            value={form.email}
            onChange={(event) =>
              update('email', event.target.value)
            }
            required
          />

          {/* Password */}
          <label className="text-sm font-bold block mt-4">
            Password
          </label>

          <input
            className="field mt-1"
            type="password"
            placeholder="Minimum 6 characters"
            value={form.password}
            onChange={(event) =>
              update('password', event.target.value)
            }
            minLength={6}
            required
          />

          {/* Account Type */}
          <label className="text-sm font-bold block mt-4">
            Account type
          </label>

          <select
            className="field mt-1"
            value={form.role}
            onChange={(event) =>
              update('role', event.target.value)
            }
          >
            <option value="attendee">
              I want to attend events
            </option>

            <option value="organizer">
              I want to organize events
            </option>

            <option value="admin">
              I am an administrator
            </option>
          </select>

          {/* Error */}
          {error && (
            <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3">
              <p className="text-red-600 text-sm font-medium">
                {error}
              </p>
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            className="btn btn-primary mt-5 w-full"
            disabled={loading}
          >
            {loading
              ? 'Creating account...'
              : 'Create account'}
          </button>
        </form>

        {/* Sign In */}
        <div className="text-center mt-5">
          <span className="text-gray-500">
            Already registered?
          </span>{' '}

          <Link
            className="text-brand font-bold"
            to="/login"
          >
            Sign in
          </Link>
        </div>

        {/* Admin Login */}
        <div className="text-center mt-3">
          <Link
            className="text-sm text-brand font-bold"
            to="/admin/login"
          >
            Administrator login
          </Link>
        </div>

      </div>
    </div>
  );
}