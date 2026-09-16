import { useState } from 'react';
import {
  Link,
  useNavigate
} from 'react-router-dom';

import api from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function OrganizerLogin() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    email: '',
    password: ''
  });

  const [error, setError] = useState('');

  const submit = async (event) => {
    event.preventDefault();
    setError('');

    try {
      const { data } = await api.post(
        '/auth/organizer-login',
        form
      );

      login(data);

      navigate('/organizer', {
        replace: true
      });
    } catch (err) {
      setError(
        err.response?.data?.message ||
        'Organizer login failed'
      );
    }
  };

  return (
    <div className="container py-16 max-w-md">
      <div className="card p-7">
        <span className="badge">
          Organizer portal
        </span>

        <h1 className="text-3xl font-black mt-3">
          Organizer login
        </h1>

        <p className="text-gray-500 mt-2">
          Manage events, tickets, attendance and revenue.
        </p>

        <form
          onSubmit={submit}
          className="mt-6 space-y-4"
        >
          <input
            className="field"
            type="email"
            placeholder="Email"
            value={form.email}
            onChange={(event) =>
              setForm({
                ...form,
                email: event.target.value
              })
            }
            required
          />

          <input
            className="field"
            type="password"
            placeholder="Password"
            value={form.password}
            onChange={(event) =>
              setForm({
                ...form,
                password: event.target.value
              })
            }
            required
          />

          {error && (
            <p className="text-red-600 text-sm">
              {error}
            </p>
          )}

          <button
            type="submit"
            className="btn btn-primary w-full"
          >
            Sign in as organizer
          </button>
        </form>

        <p className="text-sm text-gray-500 mt-5">
          Need an organizer account?{' '}
          <Link
            className="text-brand font-bold"
            to="/register"
          >
            Register
          </Link>
        </p>

        <Link
          className="text-brand font-bold text-sm mt-3 inline-block"
          to="/admin/login"
        >
          Admin login →
        </Link>
      </div>
    </div>
  );
}