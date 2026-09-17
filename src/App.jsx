import { BrowserRouter } from 'react-router-dom';

import {
  AuthProvider
} from './context/AuthContext';

import {
  NotificationProvider
} from './context/NotificationContext';

import Layout from './components/Layout';

export default function App() {
  return (
    <BrowserRouter>
      <NotificationProvider>
        <AuthProvider>
          <Layout />
        </AuthProvider>
      </NotificationProvider>
    </BrowserRouter>
  );
}