import {
  Link,
  Route,
  Routes,
  Navigate
} from 'react-router-dom';

import Home from '../pages/Home';
import Events from '../pages/Events';
import EventDetails from '../pages/EventDetails';
import EventForm from '../pages/EventForm';

import Login from '../pages/Login';
import Register from '../pages/Register';
import Dashboard from '../pages/Dashboard';
import Profile from '../pages/Profile';

import Organizer from '../pages/Organizer';
import OrganizerLogin from '../pages/OrganizerLogin';
import OrganizerAnalytics from '../pages/OrganizerAnalytics';

import Admin from '../pages/Admin';
import AdminLogin from '../pages/AdminLogin';
import AdminCreateAccount from '../pages/AdminCreateAccount';

import RoleGuard from './RoleGuard';

import { useAuth } from '../context/AuthContext';


/* =========================================================
   NAVIGATION
========================================================= */

function Navigation() {
  const {
    user,
    logout
  } = useAuth();

  const dashboardPath =
    user?.role === 'admin'
      ? '/admin'
      : user?.role === 'organizer'
        ? '/organizer'
        : '/dashboard';

  return (
    <header className="border-b bg-white sticky top-0 z-40">

      <div className="container h-16 flex items-center justify-between">

        {/* =================================================
            LOGO
        ================================================= */}

        <Link
          to="/"
          className="font-black text-xl text-brand"
        >
          EventHub
        </Link>


        {/* =================================================
            MAIN NAVIGATION
        ================================================= */}

        <nav className="hidden md:flex items-center gap-6">

          <Link
            to="/"
            className="text-sm font-semibold hover:text-brand"
          >
            Home
          </Link>

          <Link
            to="/events"
            className="text-sm font-semibold hover:text-brand"
          >
            Events
          </Link>


          {/* ATTENDEE */}

          {user?.role === 'attendee' && (
            <Link
              to="/dashboard"
              className="text-sm font-semibold hover:text-brand"
            >
              Dashboard
            </Link>
          )}


          {/* ORGANIZER */}

          {user?.role === 'organizer' && (
            <>
              <Link
                to="/organizer"
                className="text-sm font-semibold hover:text-brand"
              >
                Organizer
              </Link>

              <Link
                to="/organizer/analytics"
                className="text-sm font-semibold hover:text-brand"
              >
                Analytics
              </Link>
            </>
          )}


          {/* ADMIN */}

          {user?.role === 'admin' && (
            <Link
              to="/admin"
              className="text-sm font-semibold hover:text-brand"
            >
              Admin
            </Link>
          )}

        </nav>


        {/* =================================================
            USER ACTIONS
        ================================================= */}

        <div className="flex items-center gap-3">

          {!user ? (
            <>
              <Link
                to="/login"
                className="text-sm font-semibold hover:text-brand"
              >
                Login
              </Link>

              <Link
                to="/register"
                className="btn btn-primary"
              >
                Register
              </Link>
            </>
          ) : (
            <>

              <Link
                to={dashboardPath}
                className="text-sm font-semibold hover:text-brand"
              >
                {user.name || 'Dashboard'}
              </Link>

              <button
                type="button"
                className="btn btn-secondary"
                onClick={logout}
              >
                Logout
              </button>

            </>
          )}

        </div>

      </div>

    </header>
  );
}


/* =========================================================
   PAGE LAYOUT
========================================================= */

function PageLayout({
  children
}) {
  return (
    <div className="min-h-screen bg-gray-50">

      <Navigation />

      <main>
        {children}
      </main>

    </div>
  );
}


/* =========================================================
   NOT FOUND
========================================================= */

function NotFound() {
  return (
    <div className="container py-20 text-center">

      <div className="card p-10 max-w-lg mx-auto">

        <h1 className="text-5xl font-black">
          404
        </h1>

        <h2 className="text-2xl font-bold mt-3">
          Page not found
        </h2>

        <p className="text-gray-500 mt-3">
          The page you are looking for does not exist.
        </p>

        <Link
          to="/"
          className="btn btn-primary mt-6 inline-flex"
        >
          Back to home
        </Link>

      </div>

    </div>
  );
}


/* =========================================================
   ROLE REDIRECT
========================================================= */

function DashboardRedirect() {
  const {
    user,
    authLoading
  } = useAuth();

  if (authLoading) {
    return (
      <div className="container py-20 text-center">

        <div className="animate-spin w-10 h-10 border-4 border-brand/20 border-t-brand rounded-full mx-auto" />

        <p className="text-gray-500 mt-4">
          Checking your session...
        </p>

      </div>
    );
  }

  if (!user) {
    return (
      <Navigate
        to="/login"
        replace
      />
    );
  }

  if (user.role === 'admin') {
    return (
      <Navigate
        to="/admin"
        replace
      />
    );
  }

  if (user.role === 'organizer') {
    return (
      <Navigate
        to="/organizer"
        replace
      />
    );
  }

  return (
    <Navigate
      to="/dashboard"
      replace
    />
  );
}


/* =========================================================
   ROUTES
========================================================= */

export default function Layout() {

  return (
    <PageLayout>

      <Routes>

        {/* =================================================
            PUBLIC ROUTES
        ================================================= */}

        <Route
          path="/"
          element={
            <Home />
          }
        />

        <Route
          path="/events"
          element={
            <Events />
          }
        />

        <Route
          path="/events/:id"
          element={
            <EventDetails />
          }
        />

        <Route
          path="/login"
          element={
            <Login />
          }
        />

        <Route
          path="/register"
          element={
            <Register />
          }
        />


        {/* =================================================
            ATTENDEE DASHBOARD

            Dashboard itself handles:
            - authentication
            - attendee role
            - loading
            - registrations
        ================================================= */}

        <Route
          path="/dashboard"
          element={
            <Dashboard />
          }
        />


        {/* =================================================
            PROFILE

            Profile remains protected by attendee/role
            logic inside the page if required.
        ================================================= */}

        <Route
          path="/profile"
          element={
            <Profile />
          }
        />


        {/* =================================================
            ORGANIZER LOGIN
        ================================================= */}

        <Route
          path="/organizer/login"
          element={
            <OrganizerLogin />
          }
        />


        {/* =================================================
            ORGANIZER DASHBOARD

            /organizer
        ================================================= */}

        <Route
          path="/organizer"
          element={
            <RoleGuard
              roles={['organizer']}
            >
              <Organizer />
            </RoleGuard>
          }
        />


        {/* =================================================
            ORGANIZER CREATE EVENT

            /organizer/event/new
        ================================================= */}

        <Route
          path="/organizer/event/new"
          element={
            <RoleGuard
              roles={['organizer']}
            >
              <EventForm />
            </RoleGuard>
          }
        />


        {/* =================================================
            ORGANIZER EDIT EVENT

            /organizer/event/:id/edit
        ================================================= */}

        <Route
          path="/organizer/event/:id/edit"
          element={
            <RoleGuard
              roles={['organizer']}
            >
              <EventForm />
            </RoleGuard>
          }
        />


        {/* =================================================
            ORGANIZER ANALYTICS

            /organizer/analytics
        ================================================= */}

        <Route
          path="/organizer/analytics"
          element={
            <RoleGuard
              roles={['organizer']}
            >
              <OrganizerAnalytics />
            </RoleGuard>
          }
        />


        {/* =================================================
            ADMIN LOGIN
        ================================================= */}

        <Route
          path="/admin/login"
          element={
            <AdminLogin />
          }
        />


        {/* =================================================
            ADMIN DASHBOARD

            /admin
        ================================================= */}

        <Route
          path="/admin"
          element={
            <RoleGuard
              roles={['admin']}
            >
              <Admin />
            </RoleGuard>
          }
        />


        {/* =================================================
            ADMIN CREATE ACCOUNT

            /admin/create-account
        ================================================= */}

        <Route
          path="/admin/create-account"
          element={
            <RoleGuard
              roles={['admin']}
            >
              <AdminCreateAccount />
            </RoleGuard>
          }
        />


        {/* =================================================
            OPTIONAL ROOT DASHBOARD REDIRECT
        ================================================= */}

        <Route
          path="/home-dashboard"
          element={
            <DashboardRedirect />
          }
        />


        {/* =================================================
            UNKNOWN ROUTES
        ================================================= */}

        <Route
          path="*"
          element={
            <NotFound />
          }
        />

      </Routes>

    </PageLayout>
  );
}