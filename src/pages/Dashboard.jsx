import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  CalendarDays,
  Clock3,
  MapPin,
  Ticket,
  WalletCards,
  XCircle,
  Star,
  RefreshCw
} from 'lucide-react';

import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import RequireLogin from '../components/RequireLogin';
import { money } from '../utils/format';

function formatDate(value) {
  if (!value) return 'Date unavailable';

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return 'Date unavailable';
  }

  return date.toLocaleDateString('en-IN', {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
}

function formatTime(value) {
  if (!value) return '';

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return '';
  }

  return date.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit'
  });
}

function isUpcoming(registration) {
  const event = registration?.event;

  if (!event?.date) return false;

  const eventDate = new Date(event.date);

  if (Number.isNaN(eventDate.getTime())) {
    return false;
  }

  /*
    If the event has a separate time string, combine it with the date.

    Example:
    event.date = 2027-01-20
    event.time = 09:00

    Otherwise the event.date itself is used.
  */
  if (event.time) {
    const timeMatch = String(event.time).match(
      /^(\d{1,2}):(\d{2})(?:\s*(AM|PM))?$/i
    );

    if (timeMatch) {
      let hours = Number(timeMatch[1]);
      const minutes = Number(timeMatch[2]);
      const meridiem = timeMatch[3]?.toUpperCase();

      if (meridiem === 'PM' && hours < 12) {
        hours += 12;
      }

      if (meridiem === 'AM' && hours === 12) {
        hours = 0;
      }

      eventDate.setHours(hours, minutes, 0, 0);
    }
  }

  return eventDate.getTime() >= Date.now();
}

function isPaid(registration) {
  return registration?.paymentStatus === 'paid';
}

function isActive(registration) {
  return registration?.status === 'active';
}

function RegistrationCard({
  registration,
  onCancel,
  cancellingId,
  onFeedback
}) {
  const event = registration?.event;

  if (!event) return null;

  const cancelling = cancellingId === registration._id;

  return (
    <article className="card overflow-hidden w-full">
      {/* Event image */}
      {event.image ? (
        <img
          src={event.image}
          alt={event.title || 'Event'}
          className="w-full h-52 object-cover"
        />
      ) : (
        <div className="w-full h-52 bg-brand/10 flex items-center justify-center">
          <Ticket size={48} className="text-brand" />
        </div>
      )}

      <div className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <span className="badge">
              {event.category || 'Event'}
            </span>

            <h3 className="text-2xl font-black mt-3">
              {event.title || 'Untitled event'}
            </h3>
          </div>

          <div className="text-right shrink-0">
            <p className="text-sm text-gray-500">
              Quantity
            </p>

            <p className="text-2xl font-black">
              {registration.quantity || 1}
            </p>
          </div>
        </div>

        {/* Event information */}
        <div className="grid sm:grid-cols-2 gap-3 mt-5">
          <div className="bg-gray-50 rounded-xl p-4">
            <div className="flex items-center gap-2 text-gray-500 text-sm">
              <CalendarDays size={17} />
              <span>Date</span>
            </div>

            <p className="font-bold mt-1">
              {formatDate(event.date)}
            </p>
          </div>

          <div className="bg-gray-50 rounded-xl p-4">
            <div className="flex items-center gap-2 text-gray-500 text-sm">
              <Clock3 size={17} />
              <span>Time</span>
            </div>

            <p className="font-bold mt-1">
              {event.time || formatTime(event.date) || 'Time not specified'}
            </p>
          </div>

          <div className="bg-gray-50 rounded-xl p-4 sm:col-span-2">
            <div className="flex items-center gap-2 text-gray-500 text-sm">
              <MapPin size={17} />
              <span>Location</span>
            </div>

            <p className="font-bold mt-1">
              {event.location || 'Location not specified'}
            </p>
          </div>
        </div>

        {/* Payment */}
        <div className="border-t mt-5 pt-5 flex items-center justify-between gap-4">
          <div>
            <p className="text-sm text-gray-500">
              Amount paid
            </p>

            <p className="text-2xl font-black">
              {money(Number(registration.amount || 0))}
            </p>
          </div>

          <span className="px-4 py-2 rounded-full bg-green-100 text-green-700 font-bold text-sm">
            Paid
          </span>
        </div>

        {/* Actions */}
        <div className="flex flex-wrap gap-3 mt-5">
          <Link
            to={`/events/${event._id}`}
            className="btn btn-secondary"
          >
            View event
          </Link>

          <button
            type="button"
            className="btn bg-red-50 text-red-600 hover:bg-red-100"
            onClick={() => onCancel(registration)}
            disabled={cancelling}
          >
            <XCircle size={17} />

            {cancelling
              ? 'Cancelling...'
              : 'Cancel registration'}
          </button>

          {new Date(event.date).getTime() <= Date.now() &&
            registration.feedback?.rating == null && (
              <button
                type="button"
                className="btn bg-yellow-50 text-yellow-700 hover:bg-yellow-100"
                onClick={() => onFeedback(registration)}
              >
                <Star size={17} />
                Feedback
              </button>
            )}
        </div>
      </div>
    </article>
  );
}

export default function Dashboard() {
  const { user } = useAuth();

  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [cancellingId, setCancellingId] = useState('');
  const [feedbackRegistration, setFeedbackRegistration] = useState(null);
  const [feedbackRating, setFeedbackRating] = useState(5);
  const [feedbackComment, setFeedbackComment] = useState('');
  const [feedbackLoading, setFeedbackLoading] = useState(false);

  const loadRegistrations = useCallback(async () => {
    if (!user) {
      setRegistrations([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await api.get('/tickets/mine');

      const data = Array.isArray(response.data)
        ? response.data
        : [];

      setRegistrations(data);
    } catch (err) {
      console.error('Dashboard registrations error:', err);

      setError(
        err.response?.data?.message ||
        'Unable to load your registrations. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadRegistrations();
  }, [loadRegistrations]);

  const paidRegistrations = useMemo(() => {
    return registrations.filter(isPaid);
  }, [registrations]);

  const upcomingRegistrations = useMemo(() => {
    return paidRegistrations
      .filter(isActive)
      .filter(isUpcoming)
      .sort((a, b) => {
        const dateA = new Date(a.event?.date || 0).getTime();
        const dateB = new Date(b.event?.date || 0).getTime();

        return dateA - dateB;
      });
  }, [paidRegistrations]);

  const registrationHistory = useMemo(() => {
    return registrations
      .filter((registration) => {
        if (!registration.event) return false;

        const upcoming = isUpcoming(registration);

        return !upcoming ||
          registration.status === 'cancelled';
      })
      .sort((a, b) => {
        const dateA = new Date(a.createdAt || 0).getTime();
        const dateB = new Date(b.createdAt || 0).getTime();

        return dateB - dateA;
      });
  }, [registrations]);

  const totalTickets = useMemo(() => {
    return paidRegistrations.reduce(
      (sum, registration) =>
        sum + Number(registration.quantity || 0),
      0
    );
  }, [paidRegistrations]);

  const totalSpent = useMemo(() => {
    return paidRegistrations
      .filter((registration) => registration.status !== 'cancelled')
      .reduce(
        (sum, registration) =>
          sum + Number(registration.amount || 0),
        0
      );
  }, [paidRegistrations]);

  const cancelRegistration = async (registration) => {
    const eventTitle =
      registration.event?.title || 'this event';

    const confirmed = window.confirm(
      `Cancel your registration for "${eventTitle}"?`
    );

    if (!confirmed) {
      return;
    }

    setCancellingId(registration._id);
    setError('');
    setSuccess('');

    try {
      await api.patch(
        `/tickets/${registration._id}/cancel`
      );

      /*
        Remove the cancelled registration from the
        upcoming-event grid immediately.
      */
      setRegistrations((current) =>
        current.map((item) =>
          item._id === registration._id
            ? {
                ...item,
                status: 'cancelled'
              }
            : item
        )
      );

      setSuccess(
        'Registration cancelled successfully.'
      );
    } catch (err) {
      console.error('Cancel registration error:', err);

      setError(
        err.response?.data?.message ||
        'Unable to cancel this registration.'
      );
    } finally {
      setCancellingId('');
    }
  };

  const openFeedback = (registration) => {
    setFeedbackRegistration(registration);
    setFeedbackRating(
      registration.feedback?.rating || 5
    );
    setFeedbackComment(
      registration.feedback?.comment || ''
    );
    setError('');
    setSuccess('');
  };

  const submitFeedback = async (event) => {
    event.preventDefault();

    if (!feedbackRegistration) return;

    const rating = Number(feedbackRating);

    if (
      !Number.isFinite(rating) ||
      rating < 1 ||
      rating > 5
    ) {
      setError('Please select a rating between 1 and 5.');
      return;
    }

    setFeedbackLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await api.patch(
        `/tickets/${feedbackRegistration._id}/feedback`,
        {
          rating,
          comment: feedbackComment.trim()
        }
      );

      setRegistrations((current) =>
        current.map((item) =>
          item._id === feedbackRegistration._id
            ? response.data
            : item
        )
      );

      setFeedbackRegistration(null);
      setFeedbackComment('');
      setFeedbackRating(5);

      setSuccess(
        'Thank you! Your feedback was submitted successfully.'
      );
    } catch (err) {
      console.error('Feedback error:', err);

      setError(
        err.response?.data?.message ||
        'Unable to submit feedback.'
      );
    } finally {
      setFeedbackLoading(false);
    }
  };

  if (!user) {
    return <RequireLogin />;
  }

  if (loading) {
    return (
      <div className="container py-20">
        <div className="text-center">
          <div className="animate-spin w-10 h-10 border-4 border-brand/20 border-t-brand rounded-full mx-auto" />

          <p className="text-gray-500 mt-4">
            Loading your registrations...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-10">

      {/* =====================================================
          HEADER
      ===================================================== */}
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-5">
        <div>
          <span className="badge">
            Attendee dashboard
          </span>

          <h1 className="text-4xl font-black mt-3">
            Welcome, {user.name || 'Attendee'}
          </h1>

          <p className="text-gray-500 mt-2">
            Manage your paid event registrations and upcoming tickets.
          </p>
        </div>

        <button
          type="button"
          className="btn btn-secondary"
          onClick={loadRegistrations}
        >
          <RefreshCw size={17} />
          Refresh
        </button>
      </div>

      {/* =====================================================
          ERROR
      ===================================================== */}
      {error && (
        <div className="mt-6 rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-red-700">
          <p className="font-bold">
            Something went wrong
          </p>

          <p className="text-sm mt-1">
            {error}
          </p>
        </div>
      )}

      {/* =====================================================
          SUCCESS
      ===================================================== */}
      {success && (
        <div className="mt-6 rounded-xl border border-green-200 bg-green-50 px-5 py-4 text-green-700">
          <p className="font-bold">
            Success
          </p>

          <p className="text-sm mt-1">
            {success}
          </p>
        </div>
      )}

      {/* =====================================================
          STATS
      ===================================================== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mt-8">

        <div className="card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500">
                Upcoming events
              </p>

              <p className="text-3xl font-black mt-2">
                {upcomingRegistrations.length}
              </p>
            </div>

            <CalendarDays
              size={32}
              className="text-brand"
            />
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500">
                Paid tickets
              </p>

              <p className="text-3xl font-black mt-2">
                {totalTickets}
              </p>
            </div>

            <Ticket
              size={32}
              className="text-brand"
            />
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500">
                Total spent
              </p>

              <p className="text-3xl font-black mt-2">
                {money(totalSpent)}
              </p>
            </div>

            <WalletCards
              size={32}
              className="text-brand"
            />
          </div>
        </div>

      </div>

      {/* =====================================================
          UPCOMING EVENTS
      ===================================================== */}
      <section className="mt-12">

        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
          <div>
            <h2 className="text-3xl font-black">
              Upcoming events
            </h2>

            <p className="text-gray-500 mt-1">
              Your successful paid registrations.
            </p>
          </div>

          <Link
            to="/events"
            className="text-brand font-bold"
          >
            Find more events →
          </Link>
        </div>

        {upcomingRegistrations.length > 0 ? (
          /*
            IMPORTANT:
            The grid uses the complete available width.
            One registration = one full-width card on small screens
            and one grid item on larger screens.
          */
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 mt-6 items-start">
            {upcomingRegistrations.map((registration) => (
              <RegistrationCard
                key={registration._id}
                registration={registration}
                onCancel={cancelRegistration}
                cancellingId={cancellingId}
                onFeedback={openFeedback}
              />
            ))}
          </div>
        ) : (
          <div className="card mt-6 p-10 text-center">
            <div className="w-16 h-16 rounded-2xl bg-brand/10 flex items-center justify-center mx-auto">
              <Ticket
                size={30}
                className="text-brand"
              />
            </div>

            <h3 className="text-2xl font-black mt-5">
              No upcoming tickets
            </h3>

            <p className="text-gray-500 mt-2 max-w-md mx-auto">
              Your successfully paid registrations for future
              events will appear here automatically.
            </p>

            <Link
              to="/events"
              className="btn btn-primary mt-6 inline-flex"
            >
              Browse events
            </Link>
          </div>
        )}
      </section>

      {/* =====================================================
          REGISTRATION HISTORY
      ===================================================== */}
      <section className="mt-12">

        <h2 className="text-3xl font-black">
          Registration history
        </h2>

        <p className="text-gray-500 mt-1">
          Previous and cancelled registrations.
        </p>

        {registrationHistory.length === 0 ? (
          <div className="card mt-6 p-8 text-center text-gray-500">
            No registration history yet.
          </div>
        ) : (
          <div className="card mt-6 overflow-hidden">

            {/* Desktop table */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full">

                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="text-left px-6 py-4 font-bold">
                      Event
                    </th>

                    <th className="text-left px-6 py-4 font-bold">
                      Date
                    </th>

                    <th className="text-left px-6 py-4 font-bold">
                      Quantity
                    </th>

                    <th className="text-left px-6 py-4 font-bold">
                      Amount
                    </th>

                    <th className="text-left px-6 py-4 font-bold">
                      Payment
                    </th>

                    <th className="text-left px-6 py-4 font-bold">
                      Status
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {registrationHistory.map((registration) => {
                    const cancelled =
                      registration.status === 'cancelled';

                    return (
                      <tr
                        key={registration._id}
                        className="border-b last:border-b-0"
                      >
                        <td className="px-6 py-5">
                          <p className="font-bold">
                            {registration.event?.title ||
                              'Event unavailable'}
                          </p>

                          <p className="text-sm text-gray-500 mt-1">
                            {registration.event?.category ||
                              'Event'}
                          </p>
                        </td>

                        <td className="px-6 py-5">
                          {formatDate(
                            registration.event?.date
                          )}
                        </td>

                        <td className="px-6 py-5 font-bold">
                          {registration.quantity || 1}
                        </td>

                        <td className="px-6 py-5 font-bold">
                          {money(
                            Number(
                              registration.amount || 0
                            )
                          )}
                        </td>

                        <td className="px-6 py-5">
                          <span
                            className={
                              registration.paymentStatus ===
                              'paid'
                                ? 'px-3 py-1 rounded-full bg-green-100 text-green-700 text-sm font-bold'
                                : 'px-3 py-1 rounded-full bg-red-50 text-red-600 text-sm font-bold'
                            }
                          >
                            {registration.paymentStatus ||
                              'unknown'}
                          </span>
                        </td>

                        <td className="px-6 py-5">
                          <span
                            className={
                              cancelled
                                ? 'px-3 py-1 rounded-full bg-red-50 text-red-600 text-sm font-bold'
                                : 'px-3 py-1 rounded-full bg-gray-100 text-gray-700 text-sm font-bold'
                            }
                          >
                            {registration.status ||
                              'unknown'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>

              </table>
            </div>

            {/* Mobile history cards */}
            <div className="lg:hidden divide-y">
              {registrationHistory.map((registration) => {
                const cancelled =
                  registration.status === 'cancelled';

                return (
                  <div
                    key={registration._id}
                    className="p-5"
                  >
                    <div className="flex justify-between gap-4">
                      <div>
                        <h3 className="font-bold text-lg">
                          {registration.event?.title ||
                            'Event unavailable'}
                        </h3>

                        <p className="text-sm text-gray-500 mt-1">
                          {formatDate(
                            registration.event?.date
                          )}
                        </p>
                      </div>

                      <span
                        className={
                          cancelled
                            ? 'h-fit px-3 py-1 rounded-full bg-red-50 text-red-600 text-xs font-bold'
                            : 'h-fit px-3 py-1 rounded-full bg-gray-100 text-gray-700 text-xs font-bold'
                        }
                      >
                        {registration.status}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-3 mt-4">
                      <div className="bg-gray-50 rounded-lg p-3">
                        <p className="text-xs text-gray-500">
                          Quantity
                        </p>

                        <p className="font-bold mt-1">
                          {registration.quantity || 1}
                        </p>
                      </div>

                      <div className="bg-gray-50 rounded-lg p-3">
                        <p className="text-xs text-gray-500">
                          Amount
                        </p>

                        <p className="font-bold mt-1">
                          {money(
                            Number(
                              registration.amount || 0
                            )
                          )}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

          </div>
        )}
      </section>

      {/* =====================================================
          FEEDBACK MODAL
      ===================================================== */}
      {feedbackRegistration && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">

          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">

            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-2xl font-black">
                  Event feedback
                </h2>

                <p className="text-gray-500 mt-1">
                  {feedbackRegistration.event?.title}
                </p>
              </div>

              <button
                type="button"
                className="text-gray-500 hover:text-gray-900"
                onClick={() =>
                  setFeedbackRegistration(null)
                }
              >
                ✕
              </button>
            </div>

            <form
              onSubmit={submitFeedback}
              className="mt-6"
            >
              <label className="block font-bold">
                Rating
              </label>

              <select
                className="field mt-2"
                value={feedbackRating}
                onChange={(event) =>
                  setFeedbackRating(
                    Number(event.target.value)
                  )
                }
              >
                <option value={5}>5 — Excellent</option>
                <option value={4}>4 — Very good</option>
                <option value={3}>3 — Good</option>
                <option value={2}>2 — Needs improvement</option>
                <option value={1}>1 — Poor</option>
              </select>

              <label className="block font-bold mt-5">
                Comment
              </label>

              <textarea
                className="field mt-2 min-h-32"
                placeholder="Tell us about your experience..."
                value={feedbackComment}
                onChange={(event) =>
                  setFeedbackComment(event.target.value)
                }
              />

              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  className="btn btn-secondary flex-1"
                  onClick={() =>
                    setFeedbackRegistration(null)
                  }
                  disabled={feedbackLoading}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="btn btn-primary flex-1"
                  disabled={feedbackLoading}
                >
                  {feedbackLoading
                    ? 'Submitting...'
                    : 'Submit feedback'}
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

    </div>
  );
}