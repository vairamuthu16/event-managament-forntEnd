import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  CalendarDays,
  MapPin
} from 'lucide-react';

import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { money } from '../utils/format';

function EventDetails() {
  const { id } = useParams();

  const [e, setE] = useState(null);
  const [type, setType] = useState('');
  const [qty, setQty] = useState(1);

  const [att, setAtt] = useState({
    name: '',
    email: '',
    phone: ''
  });

  const { user } = useAuth();

  useEffect(() => {
    api
      .get(`/events/${id}`)
      .then((response) => {
        setE(response.data);

        setType(
          response.data.ticketTypes?.[0]?._id || ''
        );

        setAtt({
          name: user?.name || '',
          email: user?.email || '',
          phone: ''
        });
      });
  }, [id]);

  if (!e) {
    return (
      <div className="container py-20">
        Loading...
      </div>
    );
  }

  const selected = e.ticketTypes.find(
    (ticket) => ticket._id === type
  );

  const checkout = async () => {
    if (!user) {
      location.href = '/login';
      return;
    }

    const { data } = await api.post(
      '/tickets/create-order',
      {
        eventId: id,
        ticketTypeId: type,
        quantity: qty,
        attendee: att
      }
    );

    if (!window.Razorpay) {
      alert('Razorpay script unavailable');
      return;
    }

    const razorpay = new window.Razorpay({
      key: data.keyId,
      amount: data.order.amount,
      currency: data.order.currency,
      name: 'EventHub',
      description: e.title,
      order_id: data.order.id,

      handler: async (response) => {
        await api.post(
          '/tickets/verify',
          {
            registrationId: data.registrationId,
            ...response
          }
        );

        alert('Registration confirmed!');

        location.href = '/dashboard';
      }
    });

    razorpay.open();
  };

  return (
    <div className="container py-10">
      <div className="grid lg:grid-cols-[1.5fr_1fr] gap-8">
        <div>
          <img
            src={e.image}
            className="w-full h-[420px] object-cover rounded-3xl"
          />

          <div className="mt-7">
            <span className="badge">
              {e.category}
            </span>

            <h1 className="text-4xl font-black mt-3">
              {e.title}
            </h1>

            <div className="flex flex-wrap gap-5 text-gray-600 mt-4">
              <span>
                <CalendarDays
                  className="inline"
                  size={18}
                />{' '}
                {new Date(
                  e.date
                ).toLocaleString()}
              </span>

              <span>
                <MapPin
                  className="inline"
                  size={18}
                />{' '}
                {e.location}
              </span>
            </div>

            <p className="text-gray-600 mt-6 whitespace-pre-line">
              {e.description}
            </p>

            {e.videoUrl && (
              <a
                className="text-brand font-bold mt-4 inline-block"
                href={e.videoUrl}
                target="_blank"
                rel="noreferrer"
              >
                Watch event video →
              </a>
            )}

            <h2 className="font-bold text-2xl mt-10">
              Schedule
            </h2>

            <div className="mt-4 space-y-3">
              {(e.sessions || []).map(
                (session) => (
                  <div
                    className="card p-4"
                    key={session._id}
                  >
                    <b>{session.title}</b>

                    <div className="text-sm text-gray-500">
                      {session.speaker}
                      {' · '}
                      {session.room}
                      {' · '}
                      {new Date(
                        session.startTime
                      ).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </div>

                    <p className="text-gray-500 mt-1">
                      {session.description}
                    </p>
                  </div>
                )
              )}
            </div>
          </div>
        </div>

        <aside className="card p-6 h-fit sticky top-24">
          <h2 className="font-black text-xl">
            Get your ticket
          </h2>

          <label className="block text-sm font-bold mt-5">
            Ticket type
          </label>

          <select
            className="field mt-2"
            value={type}
            onChange={(event) =>
              setType(event.target.value)
            }
          >
            {e.ticketTypes.map((ticket) => (
              <option
                value={ticket._id}
                key={ticket._id}
              >
                {ticket.name} — {money(ticket.price)}
              </option>
            ))}
          </select>

          <label className="block text-sm font-bold mt-4">
            Quantity
          </label>

          <input
            className="field mt-2"
            type="number"
            min="1"
            max="10"
            value={qty}
            onChange={(event) =>
              setQty(Number(event.target.value))
            }
          />

          <div className="grid gap-3 mt-4">
            <input
              className="field"
              placeholder="Attendee name"
              value={att.name}
              onChange={(event) =>
                setAtt({
                  ...att,
                  name: event.target.value
                })
              }
            />

            <input
              className="field"
              placeholder="Email"
              value={att.email}
              onChange={(event) =>
                setAtt({
                  ...att,
                  email: event.target.value
                })
              }
            />

            <input
              className="field"
              placeholder="Phone"
              value={att.phone}
              onChange={(event) =>
                setAtt({
                  ...att,
                  phone: event.target.value
                })
              }
            />
          </div>

          <div className="flex justify-between font-black text-xl mt-6">
            <span>Total</span>

            <span>
              {money(
                (selected?.price || 0) * qty
              )}
            </span>
          </div>

          <button
            type="button"
            className="btn btn-primary w-full mt-5"
            onClick={checkout}
          >
            Pay securely
          </button>

          <p className="text-xs text-gray-400 mt-3 text-center">
            Payments processed securely by Razorpay.
          </p>
        </aside>
      </div>
    </div>
  );
}

export default EventDetails;