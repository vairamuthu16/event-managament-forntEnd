import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import api from '../services/api';
import RoleGuard from '../components/RoleGuard';


function AdminCreateAccountContent() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
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
    setSuccess('');

    if (form.password.length < 6) {
      setError(
        'Password must be at least 6 characters'
      );
      return;
    }

    if (
      form.password !==
      form.confirmPassword
    ) {
      setError(
        'Passwords do not match'
      );
      return;
    }

    setLoading(true);

    try {
      await api.post(
        '/admin/users',
        {
          name: form.name,
          email: form.email,
          password: form.password
        }
      );

      setSuccess(
        'Admin account created successfully.'
      );

      setForm({
        name: '',
        email: '',
        password: '',
        confirmPassword: ''
      });

    } catch (error) {
      setError(
        error.response?.data?.message ||
        'Failed to create admin account'
      );
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="container py-10 max-w-2xl">

      <div className="flex items-center justify-between gap-4">

        <div>
          <span className="badge">
            Administration
          </span>

          <h1 className="text-3xl font-black mt-2">
            Create admin account
          </h1>

          <p className="text-gray-500 mt-2">
            Create another administrator account
            for the event management platform.
          </p>
        </div>

        <Link
          to="/admin"
          className="btn btn-secondary"
        >
          Back
        </Link>

      </div>


      <form
        onSubmit={submit}
        className="card p-6 mt-7"
      >

        <label className="text-sm font-bold block">
          Full name
        </label>

        <input
          className="field mt-1"
          value={form.name}
          onChange={(event) =>
            update(
              'name',
              event.target.value
            )
          }
          placeholder="Administrator name"
          required
        />


        <label className="text-sm font-bold block mt-4">
          Email
        </label>

        <input
          className="field mt-1"
          type="email"
          value={form.email}
          onChange={(event) =>
            update(
              'email',
              event.target.value
            )
          }
          placeholder="admin@example.com"
          required
        />


        <label className="text-sm font-bold block mt-4">
          Password
        </label>

        <input
          className="field mt-1"
          type="password"
          value={form.password}
          onChange={(event) =>
            update(
              'password',
              event.target.value
            )
          }
          placeholder="Minimum 6 characters"
          required
        />


        <label className="text-sm font-bold block mt-4">
          Confirm password
        </label>

        <input
          className="field mt-1"
          type="password"
          value={form.confirmPassword}
          onChange={(event) =>
            update(
              'confirmPassword',
              event.target.value
            )
          }
          placeholder="Repeat password"
          required
        />


        {error && (
          <p className="text-red-600 text-sm mt-4">
            {error}
          </p>
        )}


        {success && (
          <p className="text-green-600 text-sm mt-4">
            {success}
          </p>
        )}


        <button
          type="submit"
          className="btn btn-primary mt-5 w-full"
          disabled={loading}
        >
          {loading
            ? 'Creating account...'
            : 'Create admin account'}
        </button>

      </form>

    </div>
  );
}


export default function AdminCreateAccount() {
  return (
    <RoleGuard roles={['admin']}>
      <AdminCreateAccountContent />
    </RoleGuard>
  );
}