import { Link } from 'react-router-dom';
import {
  CalendarDays,
  MapPin
} from 'lucide-react';

import {
  money
} from '../utils/format';

export default function EventCard({
  e
}) {
  const tickets =
    e.ticketTypes || [];

  const minPrice =
    tickets.length > 0
      ? Math.min(
          ...tickets.map(
            (ticket) =>
              Number(
                ticket.price
              ) || 0
          )
        )
      : 0;

  const totalTickets =
    tickets.reduce(
      (sum, ticket) =>
        sum +
        Number(
          ticket.quantity
        || 0),
      0
    );

  const soldTickets =
    tickets.reduce(
      (sum, ticket) =>
        sum +
        Number(
          ticket.sold || 0
        ),
      0
    );

  const availableTickets =
    Math.max(
      totalTickets -
        soldTickets,
      0
    );

  return (
    <Link
      to={`/events/${e._id}`}
      className="card overflow-hidden hover:-translate-y-1 transition block"
    >
      <img
        src={
          e.image ||
          'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=900&q=80'
        }
        alt={e.title}
        className="w-full h-48 object-cover"
      />

      <div className="p-5">
        <span className="badge">
          {e.category}
        </span>

        <h3 className="font-bold text-xl mt-3">
          {e.title}
        </h3>

        <p className="text-gray-500 mt-2 line-clamp-2">
          {e.description}
        </p>

        <div className="mt-4 text-sm text-gray-600 space-y-2">
          <div>
            <CalendarDays
              size={15}
              className="inline mr-1"
            />

            {new Date(
              e.date
            ).toLocaleDateString()}

            {e.time
              ? ` · ${e.time}`
              : ''}
          </div>

          <div>
            <MapPin
              size={15}
              className="inline mr-1"
            />

            {e.location ||
              'Location TBA'}
          </div>
        </div>

        <div className="mt-4 font-bold">
          {tickets.length > 0
            ? `${money(
                minPrice
              )} onwards`
            : 'Free / TBA'}
        </div>

        <div className="grid grid-cols-3 gap-2 mt-5 text-center">
          <div className="rounded-xl bg-gray-50 p-3">
            <p className="text-xs text-gray-500">
              Total
            </p>

            <p className="font-black mt-1">
              {totalTickets}
            </p>
          </div>

          <div className="rounded-xl bg-gray-50 p-3">
            <p className="text-xs text-gray-500">
              Sold
            </p>

            <p className="font-black mt-1">
              {soldTickets}
            </p>
          </div>

          <div className="rounded-xl bg-gray-50 p-3">
            <p className="text-xs text-gray-500">
              Available
            </p>

            <p
              className={`font-black mt-1 ${
                availableTickets === 0
                  ? 'text-red-600'
                  : availableTickets <= 10
                    ? 'text-orange-600'
                    : 'text-green-600'
              }`}
            >
              {availableTickets}
            </p>
          </div>
        </div>

        {availableTickets ===
          0 && (
          <div className="mt-4 rounded-xl bg-red-50 border border-red-200 px-3 py-2 text-center text-red-700 text-sm font-bold">
            Sold out
          </div>
        )}
      </div>
    </Link>
  );
}