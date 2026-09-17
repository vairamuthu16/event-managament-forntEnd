import {
  useEffect,
  useState
} from 'react';

import { Search } from 'lucide-react';

import api from '../services/api';
import EventCard from '../components/EventCard';

function Events() {
  const [events, setEvents] =
    useState([]);

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState('');

  const [filters, setFilters] =
    useState({
      q: '',
      category: '',
      location: '',
      minPrice: '',
      maxPrice: '',
      from: '',
      to: ''
    });

  const updateFilter = (
    field,
    value
  ) => {
    setFilters(
      (current) => ({
        ...current,
        [field]: value
      })
    );
  };

  const load = async () => {
    setLoading(true);
    setError('');

    try {
      const response =
        await api.get(
          '/events',
          {
            params: filters
          }
        );

      setEvents(
        Array.isArray(
          response.data
        )
          ? response.data
          : []
      );
    } catch (err) {
      console.error(
        'Event search error:',
        err
      );

      setError(
        err.response?.data
          ?.message ||
          'Failed to load events.'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const clearFilters = () => {
    setFilters({
      q: '',
      category: '',
      location: '',
      minPrice: '',
      maxPrice: '',
      from: '',
      to: ''
    });
  };

  return (
    <div className="container py-10">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-7">
        <div>
          <span className="badge">
            Event discovery
          </span>

          <h1 className="text-3xl font-black mt-2">
            Discover events
          </h1>

          <p className="text-gray-500 mt-1">
            Search and filter events by
            date, location, category and
            price.
          </p>
        </div>
      </div>

      <div className="card p-5 mb-7">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="relative lg:col-span-2">
            <Search
              className="absolute left-3 top-3 text-gray-400"
              size={18}
            />

            <input
              className="field pl-10"
              placeholder="Search events"
              value={filters.q}
              onChange={(event) =>
                updateFilter(
                  'q',
                  event.target.value
                )
              }
            />
          </div>

          <input
            className="field"
            placeholder="Category"
            value={filters.category}
            onChange={(event) =>
              updateFilter(
                'category',
                event.target.value
              )
            }
          />

          <input
            className="field"
            placeholder="Location"
            value={filters.location}
            onChange={(event) =>
              updateFilter(
                'location',
                event.target.value
              )
            }
          />

          <input
            className="field"
            type="date"
            value={filters.from}
            onChange={(event) =>
              updateFilter(
                'from',
                event.target.value
              )
            }
          />

          <input
            className="field"
            type="date"
            value={filters.to}
            onChange={(event) =>
              updateFilter(
                'to',
                event.target.value
              )
            }
          />

          <input
            className="field"
            type="number"
            min="0"
            placeholder="Minimum price"
            value={
              filters.minPrice
            }
            onChange={(event) =>
              updateFilter(
                'minPrice',
                event.target.value
              )
            }
          />

          <input
            className="field"
            type="number"
            min="0"
            placeholder="Maximum price"
            value={
              filters.maxPrice
            }
            onChange={(event) =>
              updateFilter(
                'maxPrice',
                event.target.value
              )
            }
          />
        </div>

        <div className="flex flex-wrap gap-3 mt-4">
          <button
            type="button"
            className="btn btn-primary"
            onClick={load}
            disabled={loading}
          >
            {loading
              ? 'Searching...'
              : 'Search events'}
          </button>

          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => {
              clearFilters();

              setTimeout(
                () => load(),
                0
              );
            }}
          >
            Clear filters
          </button>
        </div>
      </div>

      {error && (
        <div className="card border-red-200 bg-red-50 p-5 mb-6">
          <p className="text-red-700 font-medium">
            {error}
          </p>
        </div>
      )}

      {loading ? (
        <div className="py-20 text-center text-gray-500">
          Loading events...
        </div>
      ) : (
        <>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {events.map(
              (event) => (
                <EventCard
                  key={
                    event._id
                  }
                  e={event}
                />
              )
            )}
          </div>

          {!events.length && (
            <div className="card p-12 text-center text-gray-500">
              <h2 className="font-black text-xl text-gray-700">
                No events found
              </h2>

              <p className="mt-2">
                Try changing your search
                or filters.
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default Events;