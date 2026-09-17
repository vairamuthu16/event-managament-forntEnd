import {
  useEffect,
  useState
} from 'react';

import { Link } from 'react-router-dom';

import api from '../services/api';

import {
  useAuth
} from '../context/AuthContext';

import {
  useNotification
} from '../context/NotificationContext';

import {
  money
} from '../utils/format';

import Stat from '../components/Stat';
import RequireLogin from '../components/RequireLogin';

export default function Dashboard() {
  const { user } =
    useAuth();

  const { notify } =
    useNotification();

  const [registrations, setRegistrations] =
    useState([]);

  const [profile, setProfile] =
    useState(null);

  const [transferId, setTransferId] =
    useState('');

  const [recipientEmail, setRecipientEmail] =
    useState('');

  const [transferLoading, setTransferLoading] =
    useState(false);

  useEffect(() => {
    if (!user) return;

    const load =
      async () => {
        try {
          const [
            registrationsResponse,
            profileResponse
          ] = await Promise.all([
            api.get(
              '/tickets/mine'
            ),
            api.get(
              '/users/me'
            )
          ]);

          setRegistrations(
            registrationsResponse.data
          );

          setProfile(
            profileResponse.data
          );
        } catch (error) {
          notify(
            error.response?.data
              ?.message ||
              'Failed to load dashboard.',
            'error'
          );
        }
      };

    load();
  }, [user]);

  if (!user) {
    return (
      <RequireLogin />
    );
  }

  const active =
    registrations.filter(
      (registration) =>
        registration.status ===
        'active'
    );

  const paid =
    registrations.filter(
      (registration) =>
        registration.paymentStatus ===
        'paid'
    );

  const upcomingTickets =
    active
      .filter(
        (registration) =>
          registration.event &&
          new Date(
            registration.event.date
          ) >= new Date()
      )
      .reduce(
        (total, registration) =>
          total +
          Number(
            registration.quantity ||
              0
          ),
        0
      );

  const ticketsPurchased =
    paid.reduce(
      (total, registration) =>
        total +
        Number(
          registration.quantity ||
            0
        ),
      0
    );

  const totalSpent =
    paid.reduce(
      (total, registration) =>
        total +
        Number(
          registration.amount ||
            0
        ),
      0
    );

  const submitFeedback =
    async (
      registration
    ) => {
      const ratingInput =
        window.prompt(
          'Rating 1-5'
        );

      const rating =
        Number(
          ratingInput
        );

      if (
        !Number.isFinite(
          rating
        ) ||
        rating < 1 ||
        rating > 5
      ) {
        notify(
          'Please enter a rating from 1 to 5.',
          'warning'
        );

        return;
      }

      const comment =
        window.prompt(
          'Optional feedback'
        ) || '';

      try {
        const {
          data
        } = await api.patch(
          `/tickets/${registration._id}/feedback`,
          {
            rating,
            comment
          }
        );

        setRegistrations(
          (current) =>
            current.map(
              (item) =>
                item._id ===
                registration._id
                  ? data
                  : item
            )
        );

        notify(
          'Your feedback was saved.',
          'success'
        );
      } catch (error) {
        notify(
          error.response?.data
            ?.message ||
            'Could not save feedback.',
          'error'
        );
      }
    };

  const cancelTicket =
    async (
      registration
    ) => {
      try {
        const {
          data
        } = await api.patch(
          `/tickets/${registration._id}/cancel`
        );

        setRegistrations(
          (current) =>
            current.map(
              (item) =>
                item._id ===
                registration._id
                  ? data
                  : item
            )
        );

        notify(
          'Ticket cancelled successfully.',
          'success'
        );
      } catch (error) {
        notify(
          error.response?.data
            ?.message ||
            'Could not cancel ticket.',
          'error'
        );
      }
    };

  const transferTicket =
    async () => {
      if (!transferId) {
        notify(
          'Select a ticket to transfer.',
          'warning'
        );

        return;
      }

      if (
        !recipientEmail.trim()
      ) {
        notify(
          'Enter the recipient email.',
          'warning'
        );

        return;
      }

      try {
        setTransferLoading(
          true
        );

        const {
          data
        } = await api.patch(
          `/tickets/${transferId}/transfer`,
          {
            recipientEmail:
              recipientEmail
                .trim()
                .toLowerCase()
          }
        );

        setRegistrations(
          (current) =>
            current.map(
              (item) =>
                item._id ===
                transferId
                  ? data
                  : item
            )
        );

        setTransferId('');
        setRecipientEmail('');

        notify(
          'Ticket transferred successfully.',
          'success'
        );
      } catch (error) {
        notify(
          error.response?.data
            ?.message ||
            'Could not transfer ticket.',
          'error'
        );
      } finally {
        setTransferLoading(
          false
        );
      }
    };

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
            {profile?.name ||
              user.name}
            .
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
          value={
            upcomingTickets
          }
        />

        <Stat
          title="Tickets purchased"
          value={
            ticketsPurchased
          }
        />

        <Stat
          title="Total spent"
          value={money(totalSpent)}
        />

        <Stat
          title="Registrations"
          value={
            registrations.length
          }
        />
      </div>

      <div className="card p-5 mt-7">
        <h2 className="font-black text-xl">
          Profile & settings
        </h2>

        <p className="text-gray-500 mt-1">
          {user.email} ·{' '}
          {user.role}
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
        {!registrations.length ? (
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
          registrations.map(
            (registration) => (
              <div
                className="card p-5"
                key={
                  registration._id
                }
              >
                <div className="flex flex-col md:flex-row justify-between gap-4">
                  <div>
                    <span className="badge">
                      {
                        registration.status
                      }
                    </span>

                    <h3 className="font-bold text-lg mt-2">
                      {registration
                        .event
                        ?.title ||
                        'Event'}
                    </h3>

                    <p className="text-gray-500">
                      {
                        registration.quantity
                      }{' '}
                      ticket(s) ·{' '}
                      {money(
                        registration.amount
                      )}{' '}
                      ·{' '}
                      {
                        registration.paymentStatus
                      }
                    </p>

                    <p className="text-sm text-gray-400">
                      {registration
                        .event &&
                        new Date(
                          registration
                            .event
                            .date
                        ).toLocaleString()}
                    </p>

                    {registration.attended && (
                      <p className="text-sm text-green-600 font-bold mt-2">
                        Attendance recorded
                      </p>
                    )}

                    {registration
                      .feedback
                      ?.rating && (
                      <p className="text-sm text-yellow-700 mt-2">
                        Your rating:{' '}
                        {
                          registration
                            .feedback
                            .rating
                        }
                        /5
                      </p>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-2 h-fit">
                    {registration.status ===
                      'active' && (
                      <button
                        type="button"
                        className="btn btn-danger"
                        onClick={() =>
                          cancelTicket(
                            registration
                          )
                        }
                      >
                        Cancel
                      </button>
                    )}

                    {registration.paymentStatus ===
                      'paid' &&
                      registration.status ===
                        'active' &&
                      new Date(
                        registration
                          .event
                          ?.date || 0
                      ) < new Date() && (
                        <button
                          type="button"
                          className="btn btn-secondary"
                          onClick={() =>
                            submitFeedback(
                              registration
                            )
                          }
                        >
                          {registration
                            .feedback
                            ?.rating
                            ? 'Update feedback'
                            : 'Rate event'}
                        </button>
                      )}

                    {registration.paymentStatus ===
                      'paid' &&
                      registration.status ===
                        'active' && (
                        <button
                          type="button"
                          className="btn btn-secondary"
                          onClick={() =>
                            setTransferId(
                              registration._id
                            )
                          }
                        >
                          Transfer
                        </button>
                      )}
                  </div>
                </div>

                {transferId ===
                  registration._id && (
                  <div className="mt-5 border-t pt-5">
                    <h4 className="font-bold">
                      Transfer ticket
                    </h4>

                    <p className="text-sm text-gray-500 mt-1">
                      Enter the email address
                      of another registered
                      EventHub user.
                    </p>

                    <div className="flex flex-col sm:flex-row gap-3 mt-3">
                      <input
                        className="field flex-1"
                        type="email"
                        placeholder="Recipient email"
                        value={
                          recipientEmail
                        }
                        onChange={(
                          event
                        ) =>
                          setRecipientEmail(
                            event
                              .target
                              .value
                          )
                        }
                      />

                      <button
                        type="button"
                        className="btn btn-primary"
                        disabled={
                          transferLoading
                        }
                        onClick={
                          transferTicket
                        }
                      >
                        {transferLoading
                          ? 'Transferring...'
                          : 'Confirm transfer'}
                      </button>

                      <button
                        type="button"
                        className="btn btn-secondary"
                        onClick={() => {
                          setTransferId(
                            ''
                          );
                          setRecipientEmail(
                            ''
                          );
                        }}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )
          )
        )}
      </div>
    </div>
  );
}