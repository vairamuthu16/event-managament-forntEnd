import { Link } from 'react-router-dom';
import {
  CalendarDays,
  MapPin
} from 'lucide-react';

import { money } from '../utils/format';

export default function EventCard({ e }) {
  const min = Math.min(
    ...(e.ticketTypes || []).map(
      (t) => t.price
    )
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

        <div className="mt-4 text-sm text-gray-600 flex gap-4">
          <span>
            <CalendarDays
              size={15}
              className="inline"
            />{' '}
            {new Date(
              e.date
            ).toLocaleDateString()}
          </span>

          <span>
            <MapPin
              size={15}
              className="inline"
            />{' '}
            {e.location}
          </span>
        </div>

        <div className="mt-4 font-bold">
          {money(min)} onwards
        </div>
      </div>
    </Link>
  );
}