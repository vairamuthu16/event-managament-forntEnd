import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Plus,
  Pencil,
  Trash2,
  BarChart3,
  Users,
  Ticket,
  CalendarDays,
  MapPin,
  X,
  AlertTriangle,
  Download,
  RefreshCw
} from 'lucide-react';

import api from '../services/api';
import { money } from '../utils/format';

export default function Organizer() {
  const [events, setEvents] = useState([]);

  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Event selected for delete confirmation
  const [deleteEvent, setDeleteEvent] =
    useState(null);

  // ============================================================
  // LOAD ORGANIZER EVENTS
  // ============================================================

  const loadEvents = async () => {
    try {
      setLoading(true);
      setError('');
      setSuccess('');

      /*
        status=all allows the organizer to see:

        pending
        approved
        rejected
        draft

        The backend also returns organizer information.
      */

      const response = await api.get(
        '/events',
        {
          params: {
            status: 'all'
          }
        }
      );

      const data = Array.isArray(
        response.data
      )
        ? response.data
        : [];

      /*
        Only display events belonging to
        the currently authenticated organizer.

        This keeps the organizer dashboard
        separate from other organizers' events.
      */

      const storedUser =
        JSON.parse(
          localStorage.getItem('user') ||
            'null'
        );

      const organizerId =
        storedUser?._id ||
        storedUser?.id;

      const ownEvents =
        organizerId
          ? data.filter((event) => {
              const eventOrganizer =
                event.organizer;

              const eventOrganizerId =
                typeof eventOrganizer ===
                'object'
                  ? eventOrganizer?._id
                  : eventOrganizer;

              return (
                String(
                  eventOrganizerId
                ) ===
                String(organizerId)
              );
            })
          : data;

      setEvents(ownEvents);
    } catch (err) {
      console.error(
        'Failed to load organizer events:',
        err
      );

      setError(
        err.response?.data?.message ||
          'Failed to load your events.'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEvents();
  }, []);

  // ============================================================
  // CLEAR MESSAGES
  // ============================================================

  const clearMessages = () => {
    setError('');
    setSuccess('');
  };

  // ============================================================
  // DELETE CLICK
  // ============================================================

  const requestDelete = (event) => {
    clearMessages();

    const registrationCount =
      Number(
        event.registrationCount || 0
      );

    /*
      Do not even open the confirmation popup
      when registrations already exist.
    */

    if (registrationCount > 0) {
      setError(
        `This event cannot be deleted because ${registrationCount} ${
          registrationCount === 1
            ? 'registration'
            : 'registrations'
        } already exist.`
      );

      return;
    }

    setDeleteEvent(event);
  };

  // ============================================================
  // CANCEL DELETE
  // ============================================================

  const cancelDelete = () => {
    if (deleting) return;

    setDeleteEvent(null);
  };

  // ============================================================
  // CONFIRM DELETE
  // ============================================================

  const confirmDelete = async () => {
    if (!deleteEvent || deleting) {
      return;
    }

    try {
      setDeleting(true);
      setError('');
      setSuccess('');

      await api.delete(
        `/events/${deleteEvent._id}`
      );

      /*
        Remove event immediately from
        the organizer dashboard.
      */

      setEvents((current) =>
        current.filter(
          (event) =>
            event._id !==
            deleteEvent._id
        )
      );

      setDeleteEvent(null);

      setSuccess(
        `"${deleteEvent.title}" was deleted successfully.`
      );
    } catch (err) {
      console.error(
        'Delete event error:',
        err
      );

      setError(
        err.response?.data?.message ||
          'Failed to delete the event.'
      );

      /*
        Close popup if backend rejects
        deletion, because the backend
        provides the actual reason.
      */

      setDeleteEvent(null);
    } finally {
      setDeleting(false);
    }
  };

  // ============================================================
  // EXPORT ATTENDEES
  // ============================================================

  const exportAttendees = async (
    event
  ) => {
    try {
      setError('');
      setSuccess('');

      const response =
        await api.get(
          `/events/${event._id}/attendees/export`,
          {
            responseType: 'blob'
          }
        );

      const blob =
        new Blob(
          [response.data],
          {
            type:
              'text/csv;charset=utf-8;'
          }
        );

      const url =
        window.URL.createObjectURL(
          blob
        );

      const link =
        document.createElement(
          'a'
        );

      link.href = url;

      link.download =
        `${event.title
          .replace(
            /[^a-z0-9]+/gi,
            '-'
          )
          .replace(
            /^-+|-+$/g,
            ''
          )
          .toLowerCase() || 'event'}-attendees.csv`;

      document.body.appendChild(link);

      link.click();

      link.remove();

      window.URL.revokeObjectURL(
        url
      );

      setSuccess(
        'Attendee list exported successfully.'
      );
    } catch (err) {
      console.error(
        'Export attendees error:',
        err
      );

      setError(
        err.response?.data?.message ||
          'Failed to export attendee list.'
      );
    }
  };

  // ============================================================
  // EVENT STATUS
  // ============================================================

  const getStatusClass = (
    status
  ) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-700';

      case 'rejected':
        return 'bg-red-100 text-red-700';

      case 'pending':
        return 'bg-yellow-100 text-yellow-700';

      case 'draft':
        return 'bg-gray-100 text-gray-700';

      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  // ============================================================
  // CALCULATE EVENT INVENTORY
  // ============================================================

  const getTicketStats = (
    event
  ) => {
    const tickets =
      Array.isArray(
        event.ticketTypes
      )
        ? event.ticketTypes
        : [];

    const sold =
      tickets.reduce(
        (total, ticket) =>
          total +
          Number(ticket.sold || 0),
        0
      );

    const available =
      tickets.reduce(
        (total, ticket) =>
          total +
          Math.max(
            0,
            Number(
              ticket.quantity || 0
            ) -
              Number(
                ticket.sold || 0
              )
          ),
        0
      );

    return {
      sold,
      available
    };
  };

  // ============================================================
  // CALCULATE REVENUE
  // ============================================================

  const getRevenue = (
    event
  ) => {
    /*
      Backend may already provide revenue
      in future versions.

      For the current event response,
      use ticket sold * ticket price.
    */

    if (
      Number.isFinite(
        Number(event.revenue)
      )
    ) {
      return Number(
        event.revenue
      );
    }

    const tickets =
      Array.isArray(
        event.ticketTypes
      )
        ? event.ticketTypes
        : [];

    return tickets.reduce(
      (total, ticket) =>
        total +
        Number(ticket.price || 0) *
          Number(ticket.sold || 0),
      0
    );
  };

  // ============================================================
  // LOADING
  // ============================================================

  if (loading) {
    return (
      <div className="container py-16">
        <div className="card p-8 text-center">
          <RefreshCw
            className="animate-spin mx-auto mb-3"
            size={28}
          />

          <p className="text-gray-500">
            Loading organizer dashboard...
          </p>
        </div>
      </div>
    );
  }

  // ============================================================
  // UI
  // ============================================================

  return (
    <div className="container py-10">

      {/* ======================================================
          HEADER
      ======================================================= */}

      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">

        <div>
          <span className="badge">
            Organizer portal
          </span>

          <h1 className="text-3xl font-black mt-3">
            My events
          </h1>

          <p className="text-gray-500 mt-1">
            Create, manage and monitor
            your events.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">

          <Link
            to="/organizer/analytics"
            className="btn btn-secondary"
          >
            <BarChart3
              size={18}
            />

            Analytics
          </Link>

          <Link
            to="/organizer/event/new"
            className="btn btn-primary"
          >
            <Plus
              size={18}
            />

            Create event
          </Link>

        </div>

      </div>

      {/* ======================================================
          ERROR
      ======================================================= */}

      {error && (
        <div className="mt-6 bg-red-50 border border-red-200 text-red-700 rounded-xl p-4 flex gap-3">

          <AlertTriangle
            size={20}
            className="shrink-0 mt-0.5"
          />

          <div>
            <p className="font-bold">
              Action could not be completed
            </p>

            <p className="text-sm mt-1">
              {error}
            </p>
          </div>

          <button
            type="button"
            className="ml-auto"
            onClick={() =>
              setError('')
            }
          >
            <X size={18} />
          </button>

        </div>
      )}

      {/* ======================================================
          SUCCESS
      ======================================================= */}

      {success && (
        <div className="mt-6 bg-green-50 border border-green-200 text-green-700 rounded-xl p-4 flex gap-3">

          <div>
            <p className="font-bold">
              Success
            </p>

            <p className="text-sm mt-1">
              {success}
            </p>
          </div>

          <button
            type="button"
            className="ml-auto"
            onClick={() =>
              setSuccess('')
            }
          >
            <X size={18} />
          </button>

        </div>
      )}

      {/* ======================================================
          SUMMARY
      ======================================================= */}

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5 mt-8">

        <div className="card p-5">

          <div className="flex justify-between">

            <div>
              <p className="text-sm text-gray-500">
                Total events
              </p>

              <p className="text-3xl font-black mt-2">
                {events.length}
              </p>
            </div>

            <CalendarDays
              className="text-brand"
              size={28}
            />

          </div>

        </div>

        <div className="card p-5">

          <div className="flex justify-between">

            <div>
              <p className="text-sm text-gray-500">
                Tickets sold
              </p>

              <p className="text-3xl font-black mt-2">
                {events.reduce(
                  (total, event) =>
                    total +
                    getTicketStats(
                      event
                    ).sold,
                  0
                )}
              </p>
            </div>

            <Ticket
              className="text-brand"
              size={28}
            />

          </div>

        </div>

        <div className="card p-5">

          <div className="flex justify-between">

            <div>
              <p className="text-sm text-gray-500">
                Available tickets
              </p>

              <p className="text-3xl font-black mt-2">
                {events.reduce(
                  (total, event) =>
                    total +
                    getTicketStats(
                      event
                    ).available,
                  0
                )}
              </p>
            </div>

            <Users
              className="text-brand"
              size={28}
            />

          </div>

        </div>

        <div className="card p-5">

          <div className="flex justify-between">

            <div>
              <p className="text-sm text-gray-500">
                Revenue
              </p>

              <p className="text-2xl font-black mt-2">
                {money(
                  events.reduce(
                    (total, event) =>
                      total +
                      getRevenue(event),
                    0
                  )
                )}
              </p>
            </div>

            <BarChart3
              className="text-brand"
              size={28}
            />

          </div>

        </div>

      </div>

      {/* ======================================================
          EVENTS
      ======================================================= */}

      {!events.length ? (
        <div className="card p-10 text-center mt-8">

          <CalendarDays
            size={44}
            className="mx-auto text-gray-300"
          />

          <h2 className="font-black text-xl mt-4">
            No events yet
          </h2>

          <p className="text-gray-500 mt-2">
            Create your first event to
            start selling tickets.
          </p>

          <Link
            to="/organizer/event/new"
            className="btn btn-primary mt-5 inline-flex"
          >
            <Plus size={18} />

            Create your first event
          </Link>

        </div>
      ) : (
        <div className="space-y-6 mt-8">

          {events.map((event) => {
            const ticketStats =
              getTicketStats(
                event
              );

            const registrationCount =
              Number(
                event.registrationCount ||
                  0
              );

            const canDelete =
              registrationCount ===
              0;

            const revenue =
              getRevenue(event);

            return (
              <div
                key={event._id}
                className="card overflow-hidden"
              >

                <div className="p-6">

                  {/* ==========================================
                      EVENT HEADER
                  =========================================== */}

                  <div className="flex flex-col lg:flex-row lg:justify-between gap-5">

                    <div className="min-w-0">

                      <div className="flex flex-wrap items-center gap-2">

                        <span
                          className={`px-3 py-1 rounded-full text-xs font-bold capitalize ${getStatusClass(
                            event.status
                          )}`}
                        >
                          {event.status ||
                            'pending'}
                        </span>

                        {event.featured && (
                          <span className="px-3 py-1 rounded-full text-xs font-bold bg-purple-100 text-purple-700">
                            Featured
                          </span>
                        )}

                      </div>

                      <h2 className="text-2xl font-black mt-3">
                        {event.title}
                      </h2>

                      <div className="flex flex-wrap gap-4 text-sm text-gray-500 mt-3">

                        <span>
                          <CalendarDays
                            size={15}
                            className="inline mr-1"
                          />

                          {event.date
                            ? new Date(
                                event.date
                              ).toLocaleDateString()
                            : 'Date not set'}
                        </span>

                        {event.time && (
                          <span>
                            {event.time}
                          </span>
                        )}

                        {event.location && (
                          <span>
                            <MapPin
                              size={15}
                              className="inline mr-1"
                            />

                            {event.location}
                          </span>
                        )}

                      </div>

                    </div>

                    {/* ========================================
                        ACTION BUTTONS
                    ========================================= */}

                    <div className="flex flex-wrap gap-2 shrink-0">

                      <Link
                        to={`/organizer/event/${event._id}/edit`}
                        className="btn btn-secondary"
                      >
                        <Pencil
                          size={16}
                        />

                        Edit
                      </Link>

                      {registrationCount >
                        0 && (
                        <button
                          type="button"
                          className="btn btn-secondary"
                          onClick={() =>
                            exportAttendees(
                              event
                            )
                          }
                        >
                          <Download
                            size={16}
                          />

                          Export attendees
                        </button>
                      )}

                      {canDelete ? (
                        <button
                          type="button"
                          className="btn btn-danger"
                          onClick={() =>
                            requestDelete(
                              event
                            )
                          }
                        >
                          <Trash2
                            size={16}
                          />

                          Delete
                        </button>
                      ) : (
                        <span className="inline-flex items-center px-3 py-2 rounded-lg bg-gray-100 text-gray-500 text-sm font-bold">
                          <Trash2
                            size={15}
                            className="mr-1"
                          />

                          Delete unavailable
                        </span>
                      )}

                    </div>

                  </div>

                  {/* ==========================================
                      DESCRIPTION
                  =========================================== */}

                  {event.description && (
                    <p className="text-gray-600 mt-5 line-clamp-2">
                      {event.description}
                    </p>
                  )}

                  {/* ==========================================
                      STATISTICS
                  =========================================== */}

                  <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">

                    <div className="bg-gray-50 rounded-xl p-4">

                      <div className="flex items-center gap-2 text-gray-500 text-sm">
                        <Ticket size={16} />

                        Tickets sold
                      </div>

                      <p className="text-2xl font-black mt-1">
                        {
                          ticketStats.sold
                        }
                      </p>

                    </div>

                    <div className="bg-gray-50 rounded-xl p-4">

                      <div className="flex items-center gap-2 text-gray-500 text-sm">
                        <Ticket size={16} />

                        Tickets available
                      </div>

                      <p className="text-2xl font-black mt-1">
                        {
                          ticketStats.available
                        }
                      </p>

                    </div>

                    <div className="bg-gray-50 rounded-xl p-4">

                      <div className="flex items-center gap-2 text-gray-500 text-sm">
                        <Users size={16} />

                        Registrations
                      </div>

                      <p className="text-2xl font-black mt-1">
                        {
                          registrationCount
                        }
                      </p>

                    </div>

                    <div className="bg-gray-50 rounded-xl p-4">

                      <div className="flex items-center gap-2 text-gray-500 text-sm">
                        <BarChart3 size={16} />

                        Revenue
                      </div>

                      <p className="text-2xl font-black mt-1">
                        {money(
                          revenue
                        )}
                      </p>

                    </div>

                  </div>

                  {/* ==========================================
                      DELETE INFORMATION
                  =========================================== */}

                  <div className="mt-5">

                    {registrationCount ===
                      0 ? (
                      <div className="bg-green-50 border border-green-100 rounded-xl px-4 py-3 text-sm text-green-700">
                        This event has no
                        registrations.
                        It can be deleted.
                      </div>
                    ) : (
                      <div className="bg-yellow-50 border border-yellow-200 rounded-xl px-4 py-3 text-sm text-yellow-800">

                        <strong>
                          Delete disabled:
                        </strong>{' '}

                        This event has{' '}
                        {
                          registrationCount
                        }{' '}
                        {registrationCount ===
                        1
                          ? 'registration'
                          : 'registrations'}
                        . Events with
                        registrations
                        cannot be deleted.

                      </div>
                    )}

                  </div>

                </div>

              </div>
            );
          })}

        </div>
      )}

      {/* ======================================================
          DELETE CONFIRMATION POPUP
      ======================================================= */}

      {deleteEvent && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-event-title"
        >

          {/* Backdrop */}

          <button
            type="button"
            aria-label="Close delete dialog"
            className="absolute inset-0 bg-black/50"
            onClick={cancelDelete}
            disabled={deleting}
          />

          {/* Modal */}

          <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl p-6">

            {/* Close */}

            <button
              type="button"
              className="absolute right-4 top-4 text-gray-400 hover:text-gray-700"
              onClick={cancelDelete}
              disabled={deleting}
            >
              <X size={22} />
            </button>

            {/* Icon */}

            <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center">

              <Trash2
                size={23}
              />

            </div>

            <h2
              id="delete-event-title"
              className="text-2xl font-black mt-5"
            >
              Delete event?
            </h2>

            <p className="text-gray-600 mt-2">
              Are you sure you want to
              delete this event?
            </p>

            <div className="bg-gray-50 rounded-xl p-4 mt-5">

              <p className="font-black">
                {deleteEvent.title}
              </p>

              <p className="text-sm text-gray-500 mt-1">

                {deleteEvent.date
                  ? new Date(
                      deleteEvent.date
                    ).toLocaleDateString()
                  : ''}

                {deleteEvent.location
                  ? ` · ${deleteEvent.location}`
                  : ''}

              </p>

            </div>

            <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-4 mt-5">

              <div className="flex gap-2">

                <AlertTriangle
                  size={18}
                  className="shrink-0 mt-0.5"
                />

                <p className="text-sm">
                  This action cannot be
                  undone. The event will
                  be permanently deleted.
                </p>

              </div>

            </div>

            {/* Modal actions */}

            <div className="flex flex-col-reverse sm:flex-row gap-3 mt-6">

              <button
                type="button"
                className="btn btn-secondary flex-1"
                onClick={cancelDelete}
                disabled={deleting}
              >
                Cancel
              </button>

              <button
                type="button"
                className="btn btn-danger flex-1"
                onClick={confirmDelete}
                disabled={deleting}
              >
                {deleting ? (
                  <>
                    <RefreshCw
                      size={17}
                      className="animate-spin"
                    />

                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2
                      size={17}
                    />

                    Yes, delete event
                  </>
                )}
              </button>

            </div>

          </div>

        </div>
      )}

    </div>
  );
}