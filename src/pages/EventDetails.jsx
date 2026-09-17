import {
  useEffect,
  useState
} from 'react';

import { useParams } from 'react-router-dom';

import {
  CalendarDays,
  MapPin
} from 'lucide-react';

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

import TicketAvailability from '../components/TicketAvailability';

function EventDetails() {
  const { id } =
    useParams();

  const { user } =
    useAuth();

  const { notify } =
    useNotification();

  const [event, setEvent] =
    useState(null);

  const [ticketTypeId, setTicketTypeId] =
    useState('');

  const [quantity, setQuantity] =
    useState(1);

  const [attendee, setAttendee] =
    useState({
      name: '',
      email: '',
      phone: ''
    });

  const [loading, setLoading] =
    useState(true);

  const [paymentLoading, setPaymentLoading] =
    useState(false);

  const [success, setSuccess] =
    useState(null);

  useEffect(() => {
    const loadEvent =
      async () => {
        try {
          setLoading(true);

          const response =
            await api.get(
              `/events/${id}`
            );

          setEvent(
            response.data
          );

          setTicketTypeId(
            response.data
              .ticketTypes?.[0]
              ?._id || ''
          );
        } catch (error) {
          console.error(
            'Load event error:',
            error
          );

          notify(
            error.response?.data
              ?.message ||
              'Failed to load event.',
            'error'
          );
        } finally {
          setLoading(false);
        }
      };

    loadEvent();
  }, [id]);

  useEffect(() => {
    if (!user) return;

    setAttendee({
      name: user.name || '',
      email: user.email || '',
      phone: ''
    });
  }, [user]);

  if (loading) {
    return (
      <div className="container py-20 text-center">
        Loading event...
      </div>
    );
  }

  if (!event) {
    return (
      <div className="container py-20 text-center">
        <h2 className="text-2xl font-black">
          Event not found
        </h2>
      </div>
    );
  }

  const selectedTicket =
    event.ticketTypes?.find(
      (ticket) =>
        ticket._id ===
        ticketTypeId
    );

  const available =
    selectedTicket
      ? Math.max(
          Number(
            selectedTicket.quantity
          ) -
            Number(
              selectedTicket.sold
            || 0),
          0
        )
      : 0;

  const totalAmount =
    Number(
      selectedTicket?.price
    || 0) *
    Number(quantity || 0);

  const updateAttendee = (
    field,
    value
  ) => {
    setAttendee(
      (current) => ({
        ...current,
        [field]: value
      })
    );
  };

  const checkout =
    async () => {
      if (!user) {
        notify(
          'Please sign in before purchasing a ticket.',
          'warning'
        );

        window.location.href =
          '/login';

        return;
      }

      if (!selectedTicket) {
        notify(
          'Please select a ticket type.',
          'warning'
        );

        return;
      }

      if (available <= 0) {
        notify(
          'This ticket type is sold out.',
          'error'
        );

        return;
      }

      if (
        quantity < 1 ||
        quantity > available
      ) {
        notify(
          `Only ${available} ticket(s) are currently available.`,
          'error'
        );

        return;
      }

      if (
        !attendee.name.trim() ||
        !attendee.email.trim()
      ) {
        notify(
          'Attendee name and email are required.',
          'warning'
        );

        return;
      }

      try {
        setPaymentLoading(
          true
        );

        const response =
          await api.post(
            '/tickets/create-order',
            {
              eventId: id,
              ticketTypeId,
              quantity,
              attendee
            }
          );

        const data =
          response.data;

        if (!window.Razorpay) {
          notify(
            'Razorpay is unavailable. Please refresh the page and try again.',
            'error'
          );

          return;
        }

        const razorpay =
          new window.Razorpay({
            key: data.keyId,
            amount:
              data.order.amount,
            currency:
              data.order.currency,
            name: 'EventHub',
            description:
              event.title,
            order_id:
              data.order.id,

            handler:
              async (
                paymentResponse
              ) => {
                try {
                  const verification =
                    await api.post(
                      '/tickets/verify',
                      {
                        registrationId:
                          data.registrationId,
                        ...paymentResponse
                      }
                    );

                  setSuccess({
                    registrationId:
                      data.registrationId,
                    paymentId:
                      paymentResponse.razorpay_payment_id,
                    orderId:
                      paymentResponse.razorpay_order_id,
                    amount:
                      totalAmount,
                    registration:
                      verification.data
                  });

                  notify(
                    'Payment successful. Your registration is confirmed.',
                    'success'
                  );
                } catch (error) {
                  console.error(
                    'Payment verification error:',
                    error
                  );

                  notify(
                    error.response?.data
                      ?.message ||
                      'Payment verification failed.',
                    'error'
                  );
                } finally {
                  setPaymentLoading(
                    false
                  );
                }
              },

            modal: {
              ondismiss:
                () => {
                  setPaymentLoading(
                    false
                  );

                  notify(
                    'Payment window was closed.',
                    'info'
                  );
                }
            }
          });

        razorpay.open();
      } catch (error) {
        console.error(
          'Checkout error:',
          error
        );

        notify(
          error.response?.data
            ?.message ||
            'Could not start payment.',
          'error'
        );

        setPaymentLoading(
          false
        );
      }
    };

  if (success) {
    return (
      <div className="container py-16 max-w-3xl">
        <div className="card p-8 text-center">
          <div className="w-16 h-16 rounded-full bg-green-100 text-green-600 grid place-items-center mx-auto text-3xl font-black">
            ✓
          </div>

          <h1 className="text-3xl font-black mt-5">
            Registration successful
          </h1>

          <p className="text-gray-500 mt-2">
            Your payment was successful and
            your ticket has been confirmed.
          </p>

          <div className="grid sm:grid-cols-2 gap-4 text-left mt-7">
            <div className="rounded-2xl bg-gray-50 p-4">
              <p className="text-xs text-gray-500">
                Event
              </p>

              <p className="font-bold mt-1">
                {event.title}
              </p>
            </div>

            <div className="rounded-2xl bg-gray-50 p-4">
              <p className="text-xs text-gray-500">
                Amount
              </p>

              <p className="font-bold mt-1">
                {money(
                  success.amount
                )}
              </p>
            </div>

            <div className="rounded-2xl bg-gray-50 p-4">
              <p className="text-xs text-gray-500">
                Payment ID
              </p>

              <p className="font-bold mt-1 break-all">
                {success.paymentId}
              </p>
            </div>

            <div className="rounded-2xl bg-gray-50 p-4">
              <p className="text-xs text-gray-500">
                Registration ID
              </p>

              <p className="font-bold mt-1 break-all">
                {
                  success.registrationId
                }
              </p>
            </div>
          </div>

          <div className="mt-6 rounded-2xl border border-green-200 bg-green-50 p-4 text-green-700">
            A confirmation email will be sent to{' '}
            <strong>
              {attendee.email}
            </strong>
            .
          </div>

          <div className="flex flex-wrap justify-center gap-3 mt-7">
            <a
              href="/dashboard"
              className="btn btn-primary"
            >
              Go to dashboard
            </a>

            <a
              href="/events"
              className="btn btn-secondary"
            >
              Discover more events
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-10">
      <div className="grid lg:grid-cols-[1.5fr_1fr] gap-8">
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
                  className="inline"
                  size={18}
                />{' '}
                {new Date(
                  event.date
                ).toLocaleDateString()}

                {event.time
                  ? ` · ${event.time}`
                  : ''}
              </span>

              <span>
                <MapPin
                  className="inline"
                  size={18}
                />{' '}
                {event.location ||
                  'Location TBA'}
              </span>
            </div>

            <p className="text-gray-600 mt-6 whitespace-pre-line">
              {event.description}
            </p>

            {event.videoUrl && (
              <a
                className="text-brand font-bold mt-4 inline-block"
                href={
                  event.videoUrl
                }
                target="_blank"
                rel="noreferrer"
              >
                Watch event video →
              </a>
            )}

            <h2 className="font-bold text-2xl mt-10">
              Event schedule
            </h2>

            <div className="mt-4 space-y-3">
              {!event.sessions?.length ? (
                <div className="card p-5 text-gray-500">
                  Schedule will be announced
                  soon.
                </div>
              ) : (
                event.sessions.map(
                  (session) => (
                    <div
                      className="card p-4"
                      key={
                        session._id
                      }
                    >
                      <b>
                        {
                          session.title
                        }
                      </b>

                      <div className="text-sm text-gray-500 mt-1">
                        {session.speaker ||
                          'Speaker TBA'}{' '}
                        ·{' '}
                        {session.room ||
                          'Room TBA'}
                      </div>

                      <div className="text-sm text-gray-500">
                        {session.startTime
                          ? new Date(
                              session.startTime
                            ).toLocaleString()
                          : 'Start time TBA'}

                        {' → '}

                        {session.endTime
                          ? new Date(
                              session.endTime
                            ).toLocaleTimeString(
                              [],
                              {
                                hour: '2-digit',
                                minute:
                                  '2-digit'
                              }
                            )
                          : 'End time TBA'}
                      </div>

                      {session.description && (
                        <p className="text-gray-500 mt-2">
                          {
                            session.description
                          }
                        </p>
                      )}
                    </div>
                  )
                )
              )}
            </div>
          </div>
        </div>

        <aside className="card p-6 h-fit sticky top-24">
          <h2 className="font-black text-xl">
            Get your ticket
          </h2>

          <div className="mt-5 space-y-3">
            {event.ticketTypes?.map(
              (ticket) => (
                <button
                  type="button"
                  key={
                    ticket._id
                  }
                  onClick={() =>
                    setTicketTypeId(
                      ticket._id
                    )
                  }
                  className={`w-full text-left rounded-2xl border p-4 ${
                    ticket._id ===
                    ticketTypeId
                      ? 'border-brand ring-2 ring-brand/20'
                      : 'border-gray-200'
                  }`}
                >
                  <div className="flex justify-between gap-4">
                    <div>
                      <p className="font-bold">
                        {ticket.name}
                      </p>

                      <p className="text-brand font-black mt-1">
                        {money(
                          ticket.price
                        )}
                      </p>
                    </div>

                    <span
                      className={`text-sm font-bold ${
                        Number(
                          ticket.quantity
                        ) -
                          Number(
                            ticket.sold ||
                              0
                          ) <=
                        0
                          ? 'text-red-600'
                          : 'text-green-600'
                      }`}
                    >
                      {Math.max(
                        Number(
                          ticket.quantity
                        ) -
                          Number(
                            ticket.sold ||
                              0
                          ),
                        0
                      )}{' '}
                      left
                    </span>
                  </div>

                  <TicketAvailability
                    ticket={
                      ticket
                    }
                  />
                </button>
              )
            )}
          </div>

          <label className="block text-sm font-bold mt-5">
            Quantity
          </label>

          <input
            className="field mt-2"
            type="number"
            min="1"
            max={Math.min(
              10,
              Math.max(
                available,
                1
              )
            )}
            value={quantity}
            disabled={
              available <= 0
            }
            onChange={(
              event
            ) =>
              setQuantity(
                Number(
                  event.target
                    .value
                )
              )
            }
          />

          <div className="grid gap-3 mt-4">
            <input
              className="field"
              placeholder="Attendee name"
              value={
                attendee.name
              }
              onChange={(
                event
              ) =>
                updateAttendee(
                  'name',
                  event.target
                    .value
                )
              }
            />

            <input
              className="field"
              type="email"
              placeholder="Email"
              value={
                attendee.email
              }
              onChange={(
                event
              ) =>
                updateAttendee(
                  'email',
                  event.target
                    .value
                )
              }
            />

            <input
              className="field"
              placeholder="Phone"
              value={
                attendee.phone
              }
              onChange={(
                event
              ) =>
                updateAttendee(
                  'phone',
                  event.target
                    .value
                )
              }
            />
          </div>

          <div className="flex justify-between font-black text-xl mt-6">
            <span>
              Total
            </span>

            <span>
              {money(
                totalAmount
              )}
            </span>
          </div>

          <button
            type="button"
            className="btn btn-primary w-full mt-5"
            disabled={
              paymentLoading ||
              available <= 0 ||
              quantity >
                available
            }
            onClick={
              checkout
            }
          >
            {paymentLoading
              ? 'Opening payment...'
              : available <= 0
                ? 'Sold out'
                : 'Pay securely'}
          </button>

          <p className="text-xs text-gray-400 mt-3 text-center">
            Payments processed securely
            by Razorpay.
          </p>
        </aside>
      </div>
    </div>
  );
}

export default EventDetails;