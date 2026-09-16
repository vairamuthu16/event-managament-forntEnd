import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import api from '../services/api';
import { useAuth } from '../context/AuthContext';

import AuthBox from '../components/AuthBox';

function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    email: '',
    password: ''
  });

  const [error, setError] = useState('');

  const go = async (event) => {
    event.preventDefault();

    try {
      const data = (
        await api.post(
          '/auth/login',
          form
        )
      ).data;

      login(data);

      navigate(
        data.user.role === 'admin'
          ? '/admin'
          : data.user.role === 'organizer'
            ? '/organizer'
            : '/dashboard'
      );
    } catch (error) {
      setError(
        error.response?.data?.message ||
        'Login failed'
      );
    }
  };

  return (
    <AuthBox
      title="Welcome back"
      submit={go}
      fields={form}
      set={setForm}
      err={error}
      button="Sign in"
      adminLink
    />
  );
}

export default Login;