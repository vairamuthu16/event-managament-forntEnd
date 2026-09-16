import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

import {
  Check,
  X,
  Users,
  CreditCard,
  LifeBuoy,
  UserPlus,
  RefreshCw
} from 'lucide-react';

import api from '../services/api';
import { money } from '../utils/format';

import Stat from '../components/Stat';
import ChartCard from '../components/ChartCard';
import RoleGuard from '../components/RoleGuard';


// ============================================================
// ADMIN CONTENT
// ============================================================

function AdminContent() {
  const [tab, setTab] = useState('overview');

  const [data, setData] = useState(null);
  const [events, setEvents] = useState([]);
  const [users, setUsers] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [reports, setReports] = useState(null);
  const [support, setSupport] = useState([]);

  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');


  // ============================================================
  // LOAD ADMIN DATA
  // ============================================================

  const load = async () => {
    try {
      setError('');

      const [
        overviewResponse,
        eventsResponse,
        usersResponse,
        transactionsResponse,
        reportsResponse,
        supportResponse
      ] = await Promise.all([
        api.get('/admin/overview'),
        api.get('/admin/events'),
        api.get('/admin/users'),
        api.get('/admin/transactions'),
        api.get('/admin/reports'),
        api.get('/admin/support')
      ]);

      setData(
        overviewResponse.data || {}
      );

      setEvents(
        Array.isArray(eventsResponse.data)
          ? eventsResponse.data
          : []
      );

      setUsers(
        Array.isArray(usersResponse.data)
          ? usersResponse.data
          : []
      );

      setTransactions(
        Array.isArray(transactionsResponse.data)
          ? transactionsResponse.data
          : []
      );

      setReports(
        reportsResponse.data || {}
      );

      setSupport(
        Array.isArray(supportResponse.data)
          ? supportResponse.data
          : []
      );
    } catch (error) {
      console.error(
        'Failed to load admin dashboard:',
        error
      );

      setError(
        error.response?.data?.message ||
          'Failed to load admin dashboard'
      );
    } finally {
      setLoading(false);
    }
  };


  useEffect(() => {
    load();
  }, []);


  // ============================================================
  // APPROVE / REJECT EVENT
  // ============================================================

  const updateEventStatus = async (
    eventId,
    newStatus
  ) => {
    setBusy(true);

    try {
      const response = await api.patch(
        `/admin/events/${eventId}/status`,
        {
          status: newStatus
        }
      );

      // Immediately update the event list
      setEvents((currentEvents) =>
        currentEvents.map((event) =>
          event._id === eventId
            ? {
                ...event,
                ...response.data,
                status: newStatus
              }
            : event
        )
      );

      // Refresh overview/reports/etc.
      await load();

      // Stay on event approvals tab
      setTab('events');
    } catch (error) {
      console.error(
        'Failed to update event status:',
        error
      );

      alert(
        error.response?.data?.message ||
          'Failed to update event status'
      );
    } finally {
      setBusy(false);
    }
  };


  // ============================================================
  // ATTENDANCE
  // ============================================================

  const updateAttendance = async (
    registrationId,
    attended
  ) => {
    try {
      await api.patch(
        `/admin/registrations/${registrationId}/attendance`,
        {
          attended
        }
      );

      setTransactions(
        (currentTransactions) =>
          currentTransactions.map(
            (transaction) =>
              transaction._id === registrationId
                ? {
                    ...transaction,
                    attended
                  }
                : transaction
          )
      );

      // Refresh reports
      const reportsResponse = await api.get(
        '/admin/reports'
      );

      setReports(
        reportsResponse.data || {}
      );
    } catch (error) {
      console.error(
        'Failed to update attendance:',
        error
      );

      alert(
        error.response?.data?.message ||
          'Failed to update attendance'
      );
    }
  };


  // ============================================================
  // USER ROLE UPDATE
  // ============================================================

  const updateUserRole = async (
    userId,
    role
  ) => {
    try {
      const response = await api.patch(
        `/admin/users/${userId}/role`,
        {
          role
        }
      );

      setUsers(
        (currentUsers) =>
          currentUsers.map(
            (user) =>
              user._id === userId
                ? response.data
                : user
          )
      );
    } catch (error) {
      console.error(
        'Failed to update user role:',
        error
      );

      alert(
        error.response?.data?.message ||
          'Failed to update user role'
      );
    }
  };


  // ============================================================
  // SUPPORT STATUS / REPLY
  // ============================================================

  const updateSupportStatus = async (
    supportId,
    status,
    adminReply
  ) => {
    try {
      const response = await api.patch(
        `/admin/support/${supportId}`,
        {
          status,
          adminReply
        }
      );

      setSupport(
        (currentSupport) =>
          currentSupport.map(
            (item) =>
              item._id === supportId
                ? response.data
                : item
          )
      );
    } catch (error) {
      console.error(
        'Failed to update support request:',
        error
      );

      alert(
        error.response?.data?.message ||
          'Failed to update support request'
      );

      throw error;
    }
  };


  // ============================================================
  // LOADING
  // ============================================================

  if (loading) {
    return (
      <div className="container py-16">
        <div className="card p-6">
          <p className="text-gray-500">
            Loading admin dashboard...
          </p>
        </div>
      </div>
    );
  }


  // ============================================================
  // ERROR
  // ============================================================

  if (error) {
    return (
      <div className="container py-16">
        <div className="card p-6">
          <h2 className="text-xl font-black">
            Unable to load admin dashboard
          </h2>

          <p className="text-red-600 mt-2">
            {error}
          </p>

          <button
            type="button"
            className="btn btn-primary mt-5"
            onClick={() => {
              setLoading(true);
              load();
            }}
          >
            <RefreshCw size={16} />
            Try again
          </button>
        </div>
      </div>
    );
  }


  // ============================================================
  // SAFE DATA
  // ============================================================

  const safeData = data || {};
  const safeReports = reports || {};

  const eventStats = Array.isArray(
    safeReports.eventStats
  )
    ? safeReports.eventStats
    : Array.isArray(safeReports.events)
      ? safeReports.events
      : [];

  const monthly = Array.isArray(
    safeReports.monthly
  )
    ? safeReports.monthly
    : [];

  const feedback =
    safeReports.feedback &&
    typeof safeReports.feedback === 'object'
      ? safeReports.feedback
      : {};

  const totalRevenue =
    Number(safeData.revenue) || 0;

  const pendingEvents =
    Number(safeData.pendingEvents) || 0;


  // ============================================================
  // RENDER
  // ============================================================

  return (
    <div className="container py-10">

      {/* ======================================================
          HEADER
      ======================================================= */}

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">

        <div>
          <span className="badge">
            Administration
          </span>

          <h1 className="text-3xl font-black mt-2">
            Admin dashboard
          </h1>

          <p className="text-gray-500 mt-1">
            Moderate events, manage users,
            monitor payments and support.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">

          <Link
            className="btn btn-secondary"
            to="/admin/create-account"
          >
            <UserPlus size={16} />
            Create admin
          </Link>

          <Link
            className="btn btn-secondary"
            to="/events/new"
          >
            Create event
          </Link>

        </div>
      </div>


      {/* ======================================================
          STATISTICS
      ======================================================= */}

      <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4 mt-7">

        <Stat
          title="Users"
          value={
            Number(safeData.users) || 0
          }
        />

        <Stat
          title="Events"
          value={
            Number(safeData.events) || 0
          }
        />

        <Stat
          title="Paid registrations"
          value={
            Number(safeData.registrations) || 0
          }
        />

        <Stat
          title="Revenue"
          value={money(totalRevenue)}
        />

        <Stat
          title="Pending approvals"
          value={pendingEvents}
        />

      </div>


      {/* ======================================================
          TABS
      ======================================================= */}

      <div className="flex flex-wrap gap-2 mt-8 border-b pb-3">

        <button
          type="button"
          className={
            tab === 'overview'
              ? 'btn btn-primary'
              : 'btn btn-secondary'
          }
          onClick={() => setTab('overview')}
        >
          Overview
        </button>

        <button
          type="button"
          className={
            tab === 'events'
              ? 'btn btn-primary'
              : 'btn btn-secondary'
          }
          onClick={() => setTab('events')}
        >
          Event approvals
          {pendingEvents > 0 && (
            <span className="ml-2">
              ({pendingEvents})
            </span>
          )}
        </button>

        <button
          type="button"
          className={
            tab === 'users'
              ? 'btn btn-primary'
              : 'btn btn-secondary'
          }
          onClick={() => setTab('users')}
        >
          Users
        </button>

        <button
          type="button"
          className={
            tab === 'transactions'
              ? 'btn btn-primary'
              : 'btn btn-secondary'
          }
          onClick={() => setTab('transactions')}
        >
          Transactions
        </button>

        <button
          type="button"
          className={
            tab === 'reports'
              ? 'btn btn-primary'
              : 'btn btn-secondary'
          }
          onClick={() => setTab('reports')}
        >
          Reports
        </button>

        <button
          type="button"
          className={
            tab === 'support'
              ? 'btn btn-primary'
              : 'btn btn-secondary'
          }
          onClick={() => setTab('support')}
        >
          Support
        </button>

      </div>


      {/* ======================================================
          OVERVIEW
      ======================================================= */}

      {tab === 'overview' && (
        <div className="mt-6">

          <div className="grid lg:grid-cols-2 gap-5">

            <div className="card p-6">
              <h2 className="font-black text-xl">
                Platform overview
              </h2>

              <div className="grid grid-cols-2 gap-4 mt-5">

                <div className="border rounded-xl p-4">
                  <p className="text-sm text-gray-500">
                    Organizers
                  </p>

                  <p className="text-2xl font-black mt-1">
                    {Number(safeData.organizers) || 0}
                  </p>
                </div>

                <div className="border rounded-xl p-4">
                  <p className="text-sm text-gray-500">
                    Attendees
                  </p>

                  <p className="text-2xl font-black mt-1">
                    {Number(safeData.attendees) || 0}
                  </p>
                </div>

                <div className="border rounded-xl p-4">
                  <p className="text-sm text-gray-500">
                    Pending events
                  </p>

                  <p className="text-2xl font-black mt-1">
                    {pendingEvents}
                  </p>
                </div>

                <div className="border rounded-xl p-4">
                  <p className="text-sm text-gray-500">
                    Open support
                  </p>

                  <p className="text-2xl font-black mt-1">
                    {Number(safeData.supportTickets) || 0}
                  </p>
                </div>

              </div>
            </div>


            <div className="card p-6">
              <h2 className="font-black text-xl">
                Revenue summary
              </h2>

              <p className="text-4xl font-black mt-5">
                {money(totalRevenue)}
              </p>

              <p className="text-gray-500 mt-2">
                Total revenue from paid registrations.
              </p>

              <div className="mt-6">
                <Link
                  to="/admin"
                  className="btn btn-secondary"
                  onClick={() => setTab('reports')}
                >
                  View reports
                </Link>
              </div>
            </div>

          </div>


          {/* Recent events */}

          <div className="card p-5 mt-5">

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">

              <div>
                <h2 className="font-black text-xl">
                  Recent events
                </h2>

                <p className="text-sm text-gray-500">
                  Review the latest events submitted by organizers.
                </p>
              </div>

              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setTab('events')}
              >
                View all events
              </button>

            </div>


            <div className="overflow-auto mt-4">

              <table className="w-full text-left">

                <thead>
                  <tr className="border-b">
                    <th className="py-3">
                      Event
                    </th>

                    <th>
                      Organizer
                    </th>

                    <th>
                      Status
                    </th>

                    <th>
                      Date
                    </th>
                  </tr>
                </thead>

                <tbody>

                  {events.slice(0, 5).map(
                    (event) => (
                      <tr
                        key={event._id}
                        className="border-b"
                      >
                        <td className="py-3 font-bold">
                          {event.title}
                        </td>

                        <td>
                          {event.organizer?.name ||
                            '—'}
                        </td>

                        <td>
                          <span className="badge">
                            {event.status}
                          </span>
                        </td>

                        <td>
                          {event.date
                            ? new Date(
                                event.date
                              ).toLocaleDateString()
                            : '—'}
                        </td>
                      </tr>
                    )
                  )}

                  {events.length === 0 && (
                    <tr>
                      <td
                        colSpan="4"
                        className="py-8 text-center text-gray-500"
                      >
                        No events found.
                      </td>
                    </tr>
                  )}

                </tbody>

              </table>

            </div>
          </div>

        </div>
      )}


      {/* ======================================================
          EVENT APPROVALS
      ======================================================= */}

      {tab === 'events' && (
        <div className="card p-5 mt-6">

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">

            <div>
              <h2 className="font-black text-xl">
                Event approvals
              </h2>

              <p className="text-sm text-gray-500 mt-1">
                Review organizer-submitted events.
              </p>
            </div>

            <button
              type="button"
              className="btn btn-secondary"
              onClick={load}
              disabled={busy}
            >
              <RefreshCw size={16} />
              Refresh
            </button>

          </div>


          <div className="space-y-4 mt-5">

            {events.length === 0 ? (
              <p className="text-gray-500">
                No events found.
              </p>
            ) : (
              events.map((event) => (
                <div
                  key={event._id}
                  className="border rounded-xl p-5"
                >

                  <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-5">

                    <div className="flex-1">

                      <div className="flex flex-wrap items-center gap-2">

                        <h3 className="font-black text-lg">
                          {event.title}
                        </h3>

                        <span className="badge">
                          {event.status}
                        </span>

                      </div>

                      <p className="text-gray-600 mt-2">
                        {event.description}
                      </p>

                      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 mt-4 text-sm">

                        <div>
                          <span className="text-gray-500">
                            Category
                          </span>

                          <p className="font-bold">
                            {event.category || '—'}
                          </p>
                        </div>

                        <div>
                          <span className="text-gray-500">
                            Organizer
                          </span>

                          <p className="font-bold">
                            {event.organizer?.name ||
                              '—'}
                          </p>
                        </div>

                        <div>
                          <span className="text-gray-500">
                            Date
                          </span>

                          <p className="font-bold">
                            {event.date
                              ? new Date(
                                  event.date
                                ).toLocaleDateString()
                              : '—'}
                          </p>
                        </div>

                        <div>
                          <span className="text-gray-500">
                            Location
                          </span>

                          <p className="font-bold">
                            {event.location || '—'}
                          </p>
                        </div>

                      </div>

                    </div>


                    <div className="flex flex-wrap gap-2">

                      {event.status === 'pending' && (
                        <>
                          <button
                            type="button"
                            disabled={busy}
                            className="btn btn-primary"
                            onClick={() =>
                              updateEventStatus(
                                event._id,
                                'approved'
                              )
                            }
                          >
                            <Check size={16} />
                            Approve
                          </button>

                          <button
                            type="button"
                            disabled={busy}
                            className="btn btn-danger"
                            onClick={() =>
                              updateEventStatus(
                                event._id,
                                'rejected'
                              )
                            }
                          >
                            <X size={16} />
                            Reject
                          </button>
                        </>
                      )}


                      {event.status === 'approved' && (
                        <>
                          <button
                            type="button"
                            disabled={busy}
                            className="btn btn-danger"
                            onClick={() =>
                              updateEventStatus(
                                event._id,
                                'rejected'
                              )
                            }
                          >
                            <X size={16} />
                            Reject
                          </button>

                          <span className="badge text-green-600">
                            Approved
                          </span>
                        </>
                      )}


                      {event.status === 'rejected' && (
                        <>
                          <button
                            type="button"
                            disabled={busy}
                            className="btn btn-primary"
                            onClick={() =>
                              updateEventStatus(
                                event._id,
                                'approved'
                              )
                            }
                          >
                            <Check size={16} />
                            Approve
                          </button>

                          <span className="badge text-red-600">
                            Rejected
                          </span>
                        </>
                      )}

                    </div>

                  </div>

                </div>
              ))
            )}

          </div>

        </div>
      )}


      {/* ======================================================
          USERS
      ======================================================= */}

      {tab === 'users' && (
        <div className="card p-5 mt-6">

          <h2 className="font-black text-xl flex items-center gap-2">
            <Users size={20} />
            User accounts
          </h2>

          <div className="overflow-auto mt-4">

            <table className="w-full text-left">

              <thead>
                <tr className="border-b">

                  <th className="py-3">
                    Name
                  </th>

                  <th>
                    Email
                  </th>

                  <th>
                    Role
                  </th>

                  <th>
                    Created
                  </th>

                </tr>
              </thead>

              <tbody>

                {users.length === 0 ? (
                  <tr>
                    <td
                      colSpan="4"
                      className="py-8 text-center text-gray-500"
                    >
                      No users found.
                    </td>
                  </tr>
                ) : (
                  users.map((user) => (
                    <tr
                      className="border-b"
                      key={user._id}
                    >

                      <td className="py-3 font-bold">
                        {user.name}
                      </td>

                      <td>
                        {user.email}
                      </td>

                      <td>

                        <select
                          className="field max-w-40"
                          value={user.role}
                          onChange={(event) =>
                            updateUserRole(
                              user._id,
                              event.target.value
                            )
                          }
                        >
                          <option value="attendee">
                            attendee
                          </option>

                          <option value="organizer">
                            organizer
                          </option>

                          <option value="admin">
                            admin
                          </option>
                        </select>

                      </td>

                      <td>
                        {user.createdAt
                          ? new Date(
                              user.createdAt
                            ).toLocaleDateString()
                          : '—'}
                      </td>

                    </tr>
                  ))
                )}

              </tbody>

            </table>

          </div>

        </div>
      )}


      {/* ======================================================
          TRANSACTIONS
      ======================================================= */}

      {tab === 'transactions' && (
        <div className="card p-5 mt-6">

          <h2 className="font-black text-xl flex items-center gap-2">
            <CreditCard size={20} />
            Payment transactions
          </h2>

          <div className="overflow-auto mt-4">

            <table className="w-full text-left">

              <thead>
                <tr className="border-b">

                  <th className="py-3">
                    User
                  </th>

                  <th>
                    Event
                  </th>

                  <th>
                    Amount
                  </th>

                  <th>
                    Payment
                  </th>

                  <th>
                    Attendance
                  </th>

                  <th>
                    Date
                  </th>

                </tr>
              </thead>

              <tbody>

                {transactions.length === 0 ? (
                  <tr>
                    <td
                      colSpan="6"
                      className="py-8 text-center text-gray-500"
                    >
                      No transactions found.
                    </td>
                  </tr>
                ) : (
                  transactions.map(
                    (transaction) => (
                      <tr
                        className="border-b"
                        key={transaction._id}
                      >

                        <td className="py-3">
                          {transaction.user?.email ||
                            '—'}
                        </td>

                        <td>
                          {transaction.event?.title ||
                            '—'}
                        </td>

                        <td>
                          {money(
                            Number(
                              transaction.amount
                            ) || 0
                          )}
                        </td>

                        <td>
                          <span className="badge">
                            {transaction.paymentStatus ||
                              'unknown'}
                          </span>
                        </td>

                        <td>

                          {transaction.paymentStatus ===
                          'paid' ? (
                            <label className="flex items-center gap-2">

                              <input
                                type="checkbox"
                                checked={
                                  !!transaction.attended
                                }
                                onChange={(event) =>
                                  updateAttendance(
                                    transaction._id,
                                    event.target.checked
                                  )
                                }
                              />

                              <span className="text-sm">
                                Attended
                              </span>

                            </label>
                          ) : (
                            '—'
                          )}

                        </td>

                        <td>
                          {transaction.createdAt
                            ? new Date(
                                transaction.createdAt
                              ).toLocaleString()
                            : '—'}
                        </td>

                      </tr>
                    )
                  )
                )}

              </tbody>

            </table>

          </div>

        </div>
      )}


      {/* ======================================================
          REPORTS
      ======================================================= */}

      {tab === 'reports' && (
        <div className="grid lg:grid-cols-2 gap-5 mt-6">

          <ChartCard
            title="Monthly revenue"
            type="line"
            data={monthly.map(
              (item) => ({
                name:
                  item._id ||
                  item.name ||
                  'Month',

                value:
                  Number(
                    item.revenue
                  ) || 0
              })
            )}
            prefix="₹"
          />


          <ChartCard
            title="Event performance"
            data={eventStats.map(
              (item) => {
                const eventName = String(
                  item.name ||
                    item.title ||
                    'Event'
                );

                return {
                  name:
                    eventName.length > 16
                      ? `${eventName.slice(0, 16)}…`
                      : eventName,

                  value:
                    Number(
                      item.revenue
                    ) || 0
                };
              }
            )}
            prefix="₹"
          />


          {/* Attendance */}

          <div className="card p-5">

            <h3 className="font-black text-lg">
              Attendance
            </h3>

            <p className="text-4xl font-black mt-4">
              {Number(
                safeReports.attendance?.rate
              ) || 0}
              %
            </p>

            <p className="text-gray-500 mt-1">
              {Number(
                safeReports.attendance?.attended
              ) || 0}{' '}
              attendees marked present out of{' '}
              {Number(
                safeReports.attendance?.tickets
              ) || 0}{' '}
              paid tickets.
            </p>

          </div>


          {/* Feedback */}

          <div className="card p-5">

            <h3 className="font-black text-lg">
              Attendee feedback
            </h3>

            <p className="text-4xl font-black mt-4">
              {Number(
                feedback.average
              ).toFixed(1)}
              {' '}
              / 5
            </p>

            <p className="text-gray-500 mt-1">
              Average rating from{' '}
              {Number(
                feedback.count
              ) || 0}{' '}
              submitted reviews.
            </p>

          </div>

        </div>
      )}


      {/* ======================================================
          SUPPORT
      ======================================================= */}

      {tab === 'support' && (
        <div className="card p-5 mt-6">

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">

            <div>
              <h2 className="font-black text-xl flex items-center gap-2">
                <LifeBuoy size={20} />
                Support inquiries
              </h2>

              <p className="text-sm text-gray-500 mt-1">
                Respond to client support requests and manage their status.
              </p>
            </div>

            <span className="badge">
              {support.length} ticket
              {support.length === 1 ? '' : 's'}
            </span>

          </div>


          <div className="space-y-4 mt-5">

            {support.length === 0 ? (
              <p className="text-gray-500">
                No support inquiries.
              </p>
            ) : (
              support.map((item) => (
                <SupportAdminCard
                  key={item._id}
                  item={item}
                  updateSupportStatus={
                    updateSupportStatus
                  }
                />
              ))
            )}

          </div>

        </div>
      )}

    </div>
  );
}


// ============================================================
// SUPPORT ADMIN CARD
// ============================================================

function SupportAdminCard({
  item,
  updateSupportStatus
}) {
  const [status, setStatus] = useState(
    item.status || 'open'
  );

  const [reply, setReply] = useState(
    item.adminReply || ''
  );

  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);

    try {
      await updateSupportStatus(
        item._id,
        status,
        reply
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="border rounded-xl p-5">

      {/* Header */}

      <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">

        <div>

          <b className="text-lg">
            {item.subject}
          </b>

          <p className="text-sm text-gray-500 mt-1">
            {item.user?.name || 'Client'}
            {' · '}
            {item.user?.email || ''}
          </p>

          {item.category && (
            <span className="badge mt-2">
              {item.category}
            </span>
          )}

        </div>


        <select
          className="field max-w-44"
          value={status}
          onChange={(event) =>
            setStatus(event.target.value)
          }
        >
          <option value="open">
            Open
          </option>

          <option value="in_progress">
            In progress
          </option>

          <option value="resolved">
            Resolved
          </option>
        </select>

      </div>


      {/* Client message */}

      <div className="bg-gray-50 rounded-xl p-4 mt-4">

        <p className="text-xs font-bold text-gray-500 uppercase">
          Client message
        </p>

        <p className="mt-2">
          {item.message}
        </p>

      </div>


      {/* Client feedback */}

      {item.feedback?.rating && (
        <div className="mt-4 border rounded-xl p-4">

          <p className="font-bold">
            Client feedback
          </p>

          <p className="text-yellow-600 text-lg mt-1">
            {'★'.repeat(
              Number(item.feedback.rating)
            )}

            {'☆'.repeat(
              5 -
                Number(item.feedback.rating)
            )}
          </p>

          {item.feedback.comment && (
            <p className="text-sm text-gray-600 mt-1">
              {item.feedback.comment}
            </p>
          )}

        </div>
      )}


      {/* Admin reply */}

      <label className="text-sm font-bold block mt-4">
        Admin reply
      </label>

      <textarea
        className="field mt-1 min-h-28"
        value={reply}
        onChange={(event) =>
          setReply(event.target.value)
        }
        placeholder="Write a response to the client..."
      />


      {/* Save */}

      <div className="flex justify-end mt-4">

        <button
          type="button"
          className="btn btn-primary"
          onClick={save}
          disabled={saving}
        >
          {saving
            ? 'Saving...'
            : 'Save support update'}
        </button>

      </div>

    </div>
  );
}


// ============================================================
// ADMIN ROLE PROTECTION
// ============================================================

export default function Admin() {
  return (
    <RoleGuard roles={['admin']}>
      <AdminContent />
    </RoleGuard>
  );
}