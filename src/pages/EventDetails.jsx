import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  CalendarDays,
  Clock3,
  MapPin,
  Ticket,
  AlertCircle,
  CheckCircle2,
  Users
} from 'lucide-react';

import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { money } from '../utils/format';

function EventDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [event, setEvent] = useState(null);
  const [type, setType] = useState('');
  const [qty, setQty] = useState(1);

  const [attendee, setAttendee] = useState({
    name: '',
    email: '',
    phone: ''
  });

  const [loading, setLoading] = useState(true);
  const [checkoutLoading, setCheckoutLoading] = useState(false);

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    let mounted = true;

    const loadEvent = async () => {
      try {
        setLoading(true);
        setError('');

        const response = await api.get(`/events/${id}`);

        if (!mounted) return;

        const data = response.data;

        setEvent(data);

        const firstTicket = data.ticketTypes?.[0];

        setType(firstTicket?._id || '');

        setAttendee({
          name: user?.name || '',
          email: user?.email || '',
          phone: ''
        });
      } catch (err) {
        console.error('Event loading error:', err);

        if (mounted) {
          setError(
            err.response?.data?.message ||
            'Unable to load this event. Please try again.'
          );
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    loadEvent();

    return () => {
      mounted = false;
    };
  }, [id, user]);

  const selectedTicket = useMemo(() => {
    if (!event?.ticketTypes) return null;

    return event.ticketTypes.find(
      (ticket) => String(ticket._id) === String(type)
    ) || null;
  }, [event, type]);

  /*
   * IMPORTANT:
   * Event date/time is treated as the purchase cutoff.
   */
  const eventDateTime = useMemo(() => {
    if (!event?.date) return null;

    const date = new Date(event.date);

    if (Number.isNaN(date.getTime())) {
      return null;
    }

    /*
     * If event.time exists separately, use it.
     * Example: "09:00"
     */
    if (event.time) {
      const match = String(event.time).match(
        /^(\d{1,2}):(\d{2})(?:\s*(AM|PM))?$/i
      );

      if (match) {
        let hours = Number(match[1]);
        const minutes = Number(match[2]);
        const ampm = match[3]?.toUpperCase();

        if (ampm === 'PM' && hours < 12) {
          hours += 12;
        }

        if (ampm === 'AM' && hours === 12) {
          hours = 0;
        }

        date.setHours(hours, minutes, 0, 0);
      }
    }

    return date;
  }, [event]);

  const eventHasStarted = eventDateTime
    ? eventDateTime.getTime() <= Date.now()
    : false;

  const availableTickets = selectedTicket
    ? Math.max(
        0,
        Number(selectedTicket.quantity || 0) -
          Number(selectedTicket.sold || 0)
      )
    : 0;

  const totalSold = (event?.ticketTypes || []).reduce(
    (sum, ticket) => sum + Number(ticket.sold || 0),
    0
  );

  const totalCapacity = event?.capacity
    ? Number(event.capacity)
    : (event?.ticketTypes || []).reduce(
        (sum, ticket) => sum + Number(ticket.quantity || 0),
        0
      );

  const totalAvailable = Math.max(
    0,
    totalCapacity - totalSold
  );

  const totalAmount =
    Number(selectedTicket?.price || 0) * Number(qty || 0);

  const validatePurchase = () => {
    setError('');

    if (!user) {
      setError('Please sign in before purchasing a ticket.');
      return false;
    }

    if (user.role !== 'attendee') {
      setError(
        'Organizer and admin accounts cannot purchase tickets. Please sign in with an attendee account.'
      );
      return false;
    }

    if (!event) {
      setError('Event information is not available.');
      return false;
    }

    if (event.status !== 'approved') {
      setError(
        'This event is not currently available for ticket purchase.'
      );
      return false;
    }

    if (eventHasStarted) {
      setError(
        'Ticket purchasing is closed because this event has already started.'
      );
      return false;
    }

    if (!selectedTicket) {
      setError('Please select a ticket type.');
      return false;
    }

    if (availableTickets <= 0) {
      setError(
        `${selectedTicket.name} is sold out. Please choose another ticket type.`
      );
      return false;
    }

    const quantity = Number(qty);

    if (!Number.isInteger(quantity) || quantity < 1) {
      setError('Please enter a valid ticket quantity.');
      return false;
    }

    if (quantity > 10) {
      setError('You can purchase a maximum of 10 tickets at a time.');
      return false;
    }

    if (quantity > availableTickets) {
      setError(
        `Only ${availableTickets} ${selectedTicket.name} ticket${
          availableTickets === 1 ? '' : 's'
        } available. Please reduce the quantity.`
      );
      return false;
    }

    if (!attendee.name.trim()) {
      setError('Attendee name is required.');
      return false;
    }

    if (!attendee.email.trim()) {
      setError('Attendee email is required.');
      return false;
    }

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailPattern.test(attendee.email.trim())) {
      setError('Please enter a valid email address.');
      return false;
    }

    if (!attendee.phone.trim()) {
      setError('Phone number is required.');
      return false;
    }

    const phoneDigits = attendee.phone.replace(/\D/g, '');

    if (phoneDigits.length < 10) {
      setError('Please enter a valid phone number.');
      return false;
    }

    return true;
  };

  const checkout = async () => {
    setSuccess('');

    if (!validatePurchase()) {
      return;
    }

    setCheckoutLoading(true);
    setError('');

    try {
      /*
       * Backend MUST also validate:
       * - attendee role
       * - event status
       * - event date/time
       * - available tickets
       */
      const response = await api.post('/tickets/create-order', {
        eventId: id,
        ticketTypeId: type,
        quantity: Number(qty),
        attendee: {
          name: attendee.name.trim(),
          email: attendee.email.trim().toLowerCase(),
          phone: attendee.phone.trim()
        }
      });

      const data = response.data;

      if (!data?.order?.id || !data?.registrationId) {
        throw new Error(
          'The payment order could not be created. Please try again.'
        );
      }

      if (!window.Razorpay) {
        throw new Error(
          'Razorpay payment service is unavailable. Please refresh the page and try again.'
        );
      }

      const razorpayOptions = {
        key: data.keyId,
        amount: data.order.amount,
        currency: data.order.currency || 'INR',
        name: 'EventHub',
        description: event.title,
        order_id: data.order.id,

        prefill: {
          name: attendee.name.trim(),
          email: attendee.email.trim(),
          contact: attendee.phone.trim()
        },

        theme: {
          color: '#6d5dfc'
        },

        handler: async (paymentResponse) => {
          try {
            setError('');
            setSuccess('Payment received. Confirming your registration...');

            await api.post('/tickets/verify', {
              registrationId: data.registrationId,
              ...paymentResponse
            });

            setSuccess(
              'Payment successful! Your ticket has been confirmed.'
            );

            /*
             * Give the customer a moment to see success.
             * Dashboard reloads the registration from the backend.
             */
            setTimeout(() => {
              navigate('/dashboard', {
                replace: true,
                state: {
                  paymentSuccess: true,
                  eventTitle: event.title
                }
              });
            }, 1200);
          } catch (verifyError) {
            console.error('Payment verification error:', verifyError);

            setSuccess('');

            setError(
              verifyError.response?.data?.message ||
              'Payment was received, but ticket confirmation failed. Please contact support before trying again.'
            );
          }
        },

        modal: {
          ondismiss: () => {
            setCheckoutLoading(false);

            setError(
              'Payment window was closed. Your ticket was not confirmed.'
            );
          }
        }
      };

      const razorpay = new window.Razorpay(razorpayOptions);

      razorpay.on('payment.failed', (paymentError) => {
        console.error(
          'Razorpay payment failed:',
          paymentError?.error
        );

        setCheckoutLoading(false);
        setSuccess('');

        setError(
          paymentError?.error?.description ||
          'Payment failed. Please check your payment details and try again.'
        );
      });

      razorpay.open();

      /*
       * Razorpay window is now open.
       * Do not leave the page.
       */
      setCheckoutLoading(false);
    } catch (err) {
      console.error('Purchase error:', err);

      setCheckoutLoading(false);
      setSuccess('');

      setError(
        err.response?.data?.message ||
        err.message ||
        'Unable to start the purchase. Please try again.'
      );
    }
  };

  if (loading) {
    return (
      <div className="container py-20">
        <div className="card p-10 text-center">
          <div className="animate-spin w-10 h-10 border-4 border-brand/20 border-t-brand rounded-full mx-auto" />
          <p className="text-gray-500 mt-4">
            Loading event...
          </p>
        </div>
      </div>
    );
  }

  if (error && !event) {
    return (
      <div className="container py-20 max-w-2xl">
        <div className="card p-8 text-center">
          <AlertCircle
            className="mx-auto text-red-500"
            size={48}
          />

          <h1 className="text-2xl font-black mt-4">
            Unable to load event
          </h1>

          <p className="text-red-600 mt-3">
            {error}
          </p>

          <button
            type="button"
            className="btn btn-primary mt-6"
            onClick={() => window.location.reload()}
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  if (!event) {
    return null;
  }

  return (
    <div className="container py-10">
      <div className="grid lg:grid-cols-[1.5fr_1fr] gap-8">

        {/* =====================================================
            EVENT INFORMATION
        ===================================================== */}

        <div>
          <img
            src={
              event.image ||
              'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=1200&q=80'
            }
            alt={event.title}
            className="w-full h-[420px] object-cover rounded-3xl"
          />

          <div className="mt-7">
            <span className="badge">
              {event.category}
            </span>

            <h1 className="text-4xl font-black mt-3">
              {event.title}
            </h1>

            <div className="flex flex-wrap gap-5 text-gray-600 mt-4">

              <span>
                <CalendarDays
                  className="inline mr-1"
                  size={18}
                />

                {new Date(event.date).toLocaleDateString()}
              </span>

              {event.time && (
                <span>
                  <Clock3
                    className="inline mr-1"
                    size={18}
                  />

                  {event.time}
                </span>
              )}

              {event.location && (
                <span>
                  <MapPin
                    className="inline mr-1"
                    size={18}
                  />

                  {event.location}
                </span>
              )}

            </div>

            <p className="text-gray-600 mt-6 whitespace-pre-line">
              {event.description}
            </p>

            {event.address && (
              <p className="text-gray-500 mt-3">
                <strong>Address:</strong>{' '}
                {event.address}
              </p>
            )}

            {event.videoUrl && (
              <a
                className="text-brand font-bold mt-4 inline-block"
                href={event.videoUrl}
                target="_blank"
                rel="noreferrer"
              >
                Watch event video →
              </a>
            )}

            {/* EVENT INVENTORY */}

            <div className="grid md:grid-cols-3 gap-4 mt-8">

              <div className="card p-5">
                <div className="text-sm text-gray-500">
                  Total capacity
                </div>

                <div className="text-2xl font-black mt-1">
                  {totalCapacity}
                </div>
              </div>

              <div className="card p-5">
                <div className="text-sm text-gray-500">
                  Tickets sold
                </div>

                <div className="text-2xl font-black mt-1">
                  {totalSold}
                </div>
              </div>

              <div className="card p-5">
                <div className="text-sm text-gray-500">
                  Tickets available
                </div>

                <div className="text-2xl font-black mt-1">
                  {totalAvailable}
                </div>
              </div>

            </div>

            {/* SCHEDULE */}

            <h2 className="font-bold text-2xl mt-10">
              Schedule
            </h2>

            <div className="mt-4 space-y-3">

              {(event.sessions || []).length === 0 ? (
                <p className="text-gray-500">
                  No sessions have been added yet.
                </p>
              ) : (
                event.sessions.map((session) => (
                  <div
                    className="card p-4"
                    key={session._id}
                  >
                    <b>{session.title}</b>

                    <div className="text-sm text-gray-500 mt-1">
                      {session.speaker || 'Speaker TBD'}
                      {' · '}
                      {session.room || 'Room TBD'}
                    </div>

                    {session.startTime && (
                      <div className="text-sm text-gray-500 mt-1">
                        {new Date(
                          session.startTime
                        ).toLocaleString()}
                      </div>
                    )}

                    {session.description && (
                      <p className="text-gray-500 mt-2">
                        {session.description}
                      </p>
                    )}
                  </div>
                ))
              )}

            </div>
          </div>
        </div>

        {/* =====================================================
            PURCHASE PANEL
        ===================================================== */}

        <aside className="card p-6 h-fit sticky top-24">

          <h2 className="font-black text-xl">
            Get your ticket
          </h2>

          {/* ERROR MESSAGE */}

          {error && (
            <div className="mt-5 rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">
              <div className="flex gap-3">
                <AlertCircle
                  size={20}
                  className="shrink-0 mt-0.5"
                />

                <div>
                  <p className="font-bold">
                    Purchase could not continue
                  </p>

                  <p className="text-sm mt-1">
                    {error}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* SUCCESS MESSAGE */}

          {success && (
            <div className="mt-5 rounded-xl border border-green-200 bg-green-50 p-4 text-green-700">
              <div className="flex gap-3">
                <CheckCircle2
                  size={20}
                  className="shrink-0 mt-0.5"
                />

                <div>
                  <p className="font-bold">
                    Payment successful
                  </p>

                  <p className="text-sm mt-1">
                    {success}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* ORGANIZER BLOCK */}

          {user?.role === 'organizer' && (
            <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-4 text-amber-800">
              <div className="flex gap-3">
                <AlertCircle
                  size={20}
                  className="shrink-0"
                />

                <div>
                  <p className="font-bold">
                    Ticket purchase unavailable
                  </p>

                  <p className="text-sm mt-1">
                    Organizer accounts cannot purchase tickets.
                    Please use an attendee account.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* PAST EVENT BLOCK */}

          {eventHasStarted && (
            <div className="mt-5 rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">
              <div className="flex gap-3">
                <Clock3
                  size={20}
                  className="shrink-0"
                />

                <div>
                  <p className="font-bold">
                    Ticket sales closed
                  </p>

                  <p className="text-sm mt-1">
                    This event has already started.
                    Tickets can no longer be purchased.
                  </p>
                </div>
              </div>
            </div>
          )}

          <label className="block text-sm font-bold mt-5">
            Ticket type
          </label>

          <select
            className="field mt-2"
            value={type}
            disabled={eventHasStarted || checkoutLoading}
            onChange={(e) => {
              setType(e.target.value);
              setQty(1);
              setError('');
            }}
          >
            {(event.ticketTypes || []).map((ticket) => {
              const available = Math.max(
                0,
                Number(ticket.quantity || 0) -
                  Number(ticket.sold || 0)
              );

              return (
                <option
                  value={ticket._id}
                  key={ticket._id}
                >
                  {ticket.name} — {money(ticket.price)} —{' '}
                  {available} available
                </option>
              );
            })}
          </select>

          {selectedTicket && (
            <div className="mt-3 rounded-xl bg-gray-50 p-4">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">
                  Sold
                </span>

                <strong>
                  {selectedTicket.sold || 0}
                </strong>
              </div>

              <div className="flex justify-between text-sm mt-2">
                <span className="text-gray-500">
                  Available
                </span>

                <strong>
                  {availableTickets}
                </strong>
              </div>

              {availableTickets === 0 && (
                <p className="text-red-600 text-sm font-bold mt-3">
                  This ticket type is sold out.
                </p>
              )}
            </div>
          )}

          <label className="block text-sm font-bold mt-4">
            Quantity
          </label>

          <input
            className="field mt-2"
            type="number"
            min="1"
            max={Math.max(
              1,
              Math.min(10, availableTickets)
            )}
            value={qty}
            disabled={
              eventHasStarted ||
              checkoutLoading ||
              availableTickets <= 0
            }
            onChange={(e) => {
              const value = Number(e.target.value);

              setQty(
                Number.isFinite(value)
                  ? value
                  : 1
              );

              setError('');
            }}
          />

          {Number(qty) > availableTickets &&
            availableTickets > 0 && (
              <p className="text-red-600 text-sm mt-2">
                Only {availableTickets} ticket
                {availableTickets === 1 ? '' : 's'} available.
              </p>
            )}

          <div className="grid gap-3 mt-4">

            <label className="text-sm font-bold">
              Attendee name
              <input
                className="field mt-1"
                value={attendee.name}
                disabled={checkoutLoading}
                onChange={(e) =>
                  setAttendee({
                    ...attendee,
                    name: e.target.value
                  })
                }
              />
            </label>

            <label className="text-sm font-bold">
              Email
              <input
                className="field mt-1"
                type="email"
                value={attendee.email}
                disabled={checkoutLoading}
                onChange={(e) =>
                  setAttendee({
                    ...attendee,
                    email: e.target.value
                  })
                }
              />
            </label>

            <label className="text-sm font-bold">
              Phone
              <input
                className="field mt-1"
                type="tel"
                placeholder="Phone number"
                value={attendee.phone}
                disabled={checkoutLoading}
                onChange={(e) =>
                  setAttendee({
                    ...attendee,
                    phone: e.target.value
                  })
                }
              />
            </label>

          </div>

          <div className="flex justify-between font-black text-xl mt-6">
            <span>Total</span>

            <span>
              {money(totalAmount)}
            </span>
          </div>

          <button
            type="button"
            className="btn btn-primary w-full mt-5 disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={checkout}
            disabled={
              checkoutLoading ||
              eventHasStarted ||
              user?.role !== 'attendee' ||
              !selectedTicket ||
              availableTickets <= 0 ||
              Number(qty) < 1 ||
              Number(qty) > availableTickets
            }
          >
            {checkoutLoading
              ? 'Preparing payment...'
              : eventHasStarted
                ? 'Ticket sales closed'
                : availableTickets <= 0
                  ? 'Sold out'
                  : 'Pay securely'}
          </button>

          {!user && (
            <button
              type="button"
              className="btn btn-secondary w-full mt-3"
              onClick={() =>
                navigate('/login', {
                  state: {
                    from: `/events/${id}`
                  }
                })
              }
            >
              Sign in to purchase
            </button>
          )}

          <div className="flex items-center justify-center gap-2 text-xs text-gray-400 mt-4">
            <Ticket size={14} />
            Payments processed securely by Razorpay.
          </div>

        </aside>
      </div>
    </div>
  );
}

export default EventDetails;