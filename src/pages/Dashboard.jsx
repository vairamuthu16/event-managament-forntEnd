import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

import api from '../services/api';
import { useAuth } from '../context/AuthContext';

import { money } from '../utils/format';

import Stat from '../components/Stat';
import RequireLogin from '../components/RequireLogin';

export default function Dashboard() {
  const { user } = useAuth();

  const [regs, setRegs] = useState([]);
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    if (user) {
      api
        .get('/tickets/mine')
        .then((response) => setRegs(response.data));

      api
        .get('/users/me')
        .then((response) => setProfile(response.data));
    }
  }, [user]);

  if (!user) {
    return <RequireLogin />;
  }

  const active = regs.filter(
    (registration) =>
      registration.status === 'active'
  );

  const paid = regs.filter(
    (registration) =>
      registration.paymentStatus === 'paid'
  );

  const submitFeedback = async (registration) => {
    const rating = Number(
      prompt('Rating 1-5')
    );

    if (!rating) {
      return;
    }

    const comment =
      prompt('Optional feedback') || '';

    try {
      const { data } = await api.patch(
        `/tickets/${registration._id}/feedback`,
        {
          rating,
          comment
        }
      );

      setRegs((current) =>
        current.map((item) =>
          item._id === registration._id
            ? data
            : item
        )
      );
    } catch (error) {
      alert(
        error.response?.data?.message ||
        'Could not save feedback'
      );
    }
  };

  const cancelTicket = async (registration) => {
    try {
      await api.patch(
        `/tickets/${registration._id}/cancel`
      );

      setRegs((current) =>
        current.map((item) =>
          item._id === registration._id
            ? {
                ...item,
                status: 'cancelled'
              }
            : item
        )
      );
    } catch (error) {
      alert(
        error.response?.data?.message ||
        'Could not cancel ticket'
      );
    }
  };

  const upcomingTickets = active
    .filter(
      (registration) =>
        registration.event &&
        new Date(registration.event.date) >=
          new Date()
    )
    .reduce(
      (total, registration) =>
        total + registration.quantity,
      0
    );

  const ticketsPurchased = paid.reduce(
    (total, registration) =>
      total + registration.quantity,
    0
  );

  const totalSpent = paid.reduce(
    (total, registration) =>
      total + registration.amount,
    0
  );

  return (
    <div className="container py-10">
      <div className="flex flex-col md:flex-row justify-between gap-4">
        <div>
          <span className="badge">
            Attendee portal
          </span>

          <h1 className="text-3xl font-black mt-2">
            My dashboard
          </h1>

          <p className="text-gray-500">
            Welcome back,{' '}
            {profile?.name || user.name}.
          </p>
        </div>

        <Link
          className="btn btn-primary"
          to="/events"
        >
          Discover events
        </Link>
      </div>

      <div className="grid md:grid-cols-4 gap-4 mt-7">
        <Stat
          title="Upcoming tickets"
          value={upcomingTickets}
        />

        <Stat
          title="Tickets purchased"
          value={ticketsPurchased}
        />

        <Stat
          title="Total spent"
          value={money(totalSpent)}
        />

        <Stat
          title="Registrations"
          value={regs.length}
        />
      </div>

      <div className="card p-5 mt-7">
        <h2 className="font-black text-xl">
          Profile & settings
        </h2>

        <p className="text-gray-500 mt-1">
          {user.email} · {user.role}
        </p>

        <Link
          className="text-brand font-bold inline-block mt-3"
          to="/profile"
        >
          Manage profile →
        </Link>
      </div>

      <h2 className="font-black text-2xl mt-10">
        Purchased tickets
      </h2>

      <div className="mt-4 space-y-3">
        {regs.length === 0 ? (
          <div className="card p-8 text-center text-gray-500">
            No registrations yet.{' '}
            <Link
              className="text-brand font-bold"
              to="/events"
            >
              Find an event
            </Link>
            .
          </div>
        ) : (
          regs.map((registration) => (
            <div
              className="card p-5 flex flex-col md:flex-row justify-between gap-4"
              key={registration._id}
            >
              <div>
                <span className="badge">
                  {registration.status}
                </span>

                <h3 className="font-bold text-lg mt-2">
                  {registration.event?.title ||
                    'Event'}
                </h3>

                <p className="text-gray-500">
                  {registration.quantity} ticket(s)
                  {' · '}
                  {money(registration.amount)}
                  {' · '}
                  {registration.paymentStatus}
                </p>

                <p className="text-sm text-gray-400">
                  {registration.event &&
                    new Date(
                      registration.event.date
                    ).toLocaleString()}
                </p>

                {registration.attended && (
                  <p className="text-sm text-green-600 font-bold mt-2">
                    Attendance recorded
                  </p>
                )}

                {registration.feedback?.rating && (
                  <p className="text-sm text-yellow-700 mt-2">
                    Your rating:{' '}
                    {registration.feedback.rating}/5
                  </p>
                )}
              </div>

              <div className="flex gap-2 h-fit">
                {registration.status === 'active' && (
                  <button
                    type="button"
                    className="btn btn-danger"
                    onClick={() =>
                      cancelTicket(registration)
                    }
                  >
                    Cancel
                  </button>
                )}

                {registration.paymentStatus ===
                  'paid' &&
                  new Date(
                    registration.event?.date || 0
                  ) < new Date() && (
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={() =>
                        submitFeedback(registration)
                      }
                    >
                      {registration.feedback?.rating
                        ? 'Update feedback'
                        : 'Rate event'}
                    </button>
                  )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}