import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Check,
  X,
  Users,
  CreditCard,
  LifeBuoy,
} from 'lucide-react';

import api from '../services/api';
import { money } from '../utils/format';
import Stat from '../components/Stat';
import ChartCard from '../components/ChartCard';
import RoleGuard from '../components/RoleGuard';

function AdminContent() {
  const [tab, setTab] = useState('overview');

  const [data, setData] = useState(null);
  const [events, setEvents] = useState([]);
  const [users, setUsers] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [reports, setReports] = useState(null);
  const [support, setSupport] = useState([]);

  const [busy, setBusy] = useState(false);

  // =========================
  // LOAD ADMIN DATA
  // =========================
  const load = async () => {
    try {
      const [
        overviewResponse,
        eventsResponse,
        usersResponse,
        transactionsResponse,
        reportsResponse,
        supportResponse,
      ] = await Promise.all([
        api.get('/admin/overview'),
        api.get('/admin/events'),
        api.get('/admin/users'),
        api.get('/admin/transactions'),
        api.get('/admin/reports'),
        api.get('/admin/support'),
      ]);

      setData(overviewResponse.data);
      setEvents(eventsResponse.data);
      setUsers(usersResponse.data);
      setTransactions(transactionsResponse.data);
      setReports(reportsResponse.data);
      setSupport(supportResponse.data);
    } catch (error) {
      console.error('Failed to load admin dashboard:', error);

      alert(
        error.response?.data?.message ||
          'Failed to load admin dashboard'
      );
    }
  };

  useEffect(() => {
    load();
  }, []);

  // =========================
  // APPROVE / REJECT EVENT
  // =========================
  const updateEventStatus = async (eventId, newStatus) => {
    setBusy(true);

    try {
      const response = await api.patch(
        `/admin/events/${eventId}/status`,
        {
          status: newStatus,
        }
      );

      const updatedEvent = response.data;

      setEvents((currentEvents) =>
        currentEvents.map((event) =>
          event._id === eventId
            ? {
                ...event,
                ...updatedEvent,
                status: newStatus,
              }
            : event
        )
      );
    } catch (error) {
      console.error('Failed to update event status:', error);

      alert(
        error.response?.data?.message ||
          'Failed to update event status'
      );
    } finally {
      setBusy(false);
    }
  };

  // =========================
  // ATTENDANCE
  // =========================
  const updateAttendance = async (registrationId, attended) => {
    try {
      await api.patch(
        `/admin/registrations/${registrationId}/attendance`,
        {
          attended,
        }
      );

      setTransactions((currentTransactions) =>
        currentTransactions.map((transaction) =>
          transaction._id === registrationId
            ? {
                ...transaction,
                attended,
              }
            : transaction
        )
      );
    } catch (error) {
      console.error('Failed to update attendance:', error);

      alert(
        error.response?.data?.message ||
          'Failed to update attendance'
      );
    }
  };

  // =========================
  // USER ROLE UPDATE
  // =========================
  const updateUserRole = async (userId, role) => {
    try {
      const response = await api.patch(
        `/admin/users/${userId}/role`,
        {
          role,
        }
      );

      setUsers((currentUsers) =>
        currentUsers.map((user) =>
          user._id === userId
            ? response.data
            : user
        )
      );
    } catch (error) {
      console.error('Failed to update user role:', error);

      alert(
        error.response?.data?.message ||
          'Failed to update user role'
      );
    }
  };

  // =========================
  // SUPPORT STATUS
  // =========================
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
          adminReply,
        }
      );

      setSupport((currentSupport) =>
        currentSupport.map((item) =>
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
    }
  };

  // =========================
  // LOADING
  // =========================
  if (!data || !reports) {
    return (
      <div className="container py-16">
        Loading admin dashboard...
      </div>
    );
  }

  // =========================
  // RENDER
  // =========================
  return (
    <div className="container py-10">

      {/* =========================
          HEADER
      ========================== */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="badge">
            Administration
          </span>

          <h1 className="text-3xl font-black mt-2">
            Admin dashboard
          </h1>

          <p className="text-gray-500">
            Moderate events, manage users, monitor payments
            and support.
          </p>
        </div>

        <div className="flex gap-2">
          <Link
            className="btn btn-secondary"
            to="/events/new"
          >
            Create event
          </Link>
        </div>
      </div>

      {/* =========================
          STATISTICS
      ========================== */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4 mt-7">

        <Stat
          title="Users"
          value={data.users}
        />

        <Stat
          title="Events"
          value={data.events}
        />

        <Stat
          title="Paid registrations"
          value={data.registrations}
        />

        <Stat
          title="Revenue"
          value={money(data.revenue)}
        />

        <Stat
          title="Pending events"
          value={data.pendingEvents}
        />

      </div>

      {/* =========================
          ADMIN TABS
      ========================== */}
      <div className="flex flex-wrap gap-2 mt-8">

        {[
          ['overview', 'Overview'],
          ['events', 'Event approvals'],
          ['users', 'Users'],
          ['transactions', 'Transactions'],
          ['reports', 'Reports'],
          ['support', 'Support'],
        ].map(([key, label]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`btn ${
              tab === key
                ? 'btn-primary'
                : 'btn-secondary'
            }`}
          >
            {label}
          </button>
        ))}

      </div>

      {/* =====================================================
          OVERVIEW
      ====================================================== */}
      {tab === 'overview' && (
        <div className="grid lg:grid-cols-2 gap-5 mt-6">

          <ChartCard
            title="Revenue by event"
            data={reports.eventStats.map((item) => ({
              name:
                item.name.length > 18
                  ? item.name.slice(0, 18) + '…'
                  : item.name,
              value: item.revenue,
            }))}
            prefix="₹"
          />

          <ChartCard
            title="Tickets by event"
            data={reports.eventStats.map((item) => ({
              name:
                item.name.length > 18
                  ? item.name.slice(0, 18) + '…'
                  : item.name,
              value: item.tickets,
            }))}
          />

        </div>
      )}

      {/* =====================================================
          EVENT APPROVALS
      ====================================================== */}
      {tab === 'events' && (
        <div className="card p-5 mt-6">

          <h2 className="font-black text-xl">
            Event approvals
          </h2>

          <div className="space-y-3 mt-4">

            {events.length === 0 ? (
              <p className="text-gray-500">
                No events available.
              </p>
            ) : (
              events.map((event) => (

                <div
                  key={event._id}
                  className="border rounded-xl p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-3"
                >

                  {/* EVENT INFORMATION */}
                  <div>

                    <b className="text-lg">
                      {event.title}
                    </b>

                    <div className="text-sm text-gray-500 mt-1">
                      {event.organizer?.name ||
                        'Unknown organizer'}

                      {' · '}

                      {event.organizer?.email || ''}

                      {' · '}

                      <span
                        className={`font-bold ${
                          event.status === 'approved'
                            ? 'text-green-600'
                            : event.status === 'rejected'
                            ? 'text-red-600'
                            : 'text-orange-600'
                        }`}
                      >
                        {event.status}
                      </span>
                    </div>

                  </div>

                  {/* ACTIONS */}
                  <div className="flex gap-2 items-center">

                    {/* ---------------------------------
                        PENDING
                        Show BOTH buttons
                    ---------------------------------- */}
                    {event.status === 'pending' && (
                      <>
                        <button
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

                    {/* ---------------------------------
                        APPROVED
                        DO NOT SHOW APPROVE
                        Show only Reject
                    ---------------------------------- */}
                    {event.status === 'approved' && (
                      <>
                        <button
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

                    {/* ---------------------------------
                        REJECTED
                        DO NOT SHOW REJECT
                        Show only Approve
                    ---------------------------------- */}
                    {event.status === 'rejected' && (
                      <>
                        <button
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

              ))
            )}

          </div>

        </div>
      )}

      {/* =====================================================
          USERS
      ====================================================== */}
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

                {users.map((user) => (

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
                      {new Date(
                        user.createdAt
                      ).toLocaleDateString()}
                    </td>

                  </tr>

                ))}

              </tbody>

            </table>

          </div>

        </div>
      )}

      {/* =====================================================
          TRANSACTIONS
      ====================================================== */}
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

                {transactions.map((transaction) => (

                  <tr
                    className="border-b"
                    key={transaction._id}
                  >

                    <td className="py-3">
                      {transaction.user?.email}
                    </td>

                    <td>
                      {transaction.event?.title}
                    </td>

                    <td>
                      {money(transaction.amount)}
                    </td>

                    <td>

                      <span className="badge">
                        {transaction.paymentStatus}
                      </span>

                    </td>

                    <td>

                      {transaction.paymentStatus ===
                      'paid' ? (
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
                      ) : (
                        '—'
                      )}

                    </td>

                    <td>
                      {new Date(
                        transaction.createdAt
                      ).toLocaleString()}
                    </td>

                  </tr>

                ))}

              </tbody>

            </table>

          </div>

        </div>
      )}

      {/* =====================================================
          REPORTS
      ====================================================== */}
      {tab === 'reports' && (
        <div className="grid lg:grid-cols-2 gap-5 mt-6">

          <ChartCard
            title="Monthly revenue"
            type="line"
            data={reports.monthly.map((item) => ({
              name: item._id,
              value: item.revenue,
            }))}
            prefix="₹"
          />

          <ChartCard
            title="Event performance"
            data={reports.eventStats.map((item) => ({
              name:
                item.name.length > 16
                  ? item.name.slice(0, 16) + '…'
                  : item.name,
              value: item.revenue,
            }))}
            prefix="₹"
          />

          <div className="card p-5">

            <h3 className="font-black text-lg">
              Attendee feedback
            </h3>

            <p className="text-4xl font-black mt-4">
              {Number(
                reports.feedback.average || 0
              ).toFixed(1)}{' '}
              / 5
            </p>

            <p className="text-gray-500 mt-1">
              Average rating from{' '}
              {reports.feedback.count || 0}{' '}
              submitted reviews.
            </p>

          </div>

        </div>
      )}

      {/* =====================================================
          SUPPORT
      ====================================================== */}
      {tab === 'support' && (
        <div className="card p-5 mt-6">

          <h2 className="font-black text-xl flex items-center gap-2">
            <LifeBuoy size={20} />
            Support inquiries
          </h2>

          <div className="space-y-3 mt-4">

            {support.length === 0 ? (

              <p className="text-gray-500">
                No support inquiries.
              </p>

            ) : (

              support.map((item) => (

                <div
                  className="border rounded-xl p-4"
                  key={item._id}
                >

                  <div className="flex justify-between gap-3">

                    <div>

                      <b>
                        {item.subject}
                      </b>

                      <p className="text-sm text-gray-500">
                        {item.user?.email}
                      </p>

                    </div>

                    <select
                      className="field max-w-44"
                      value={item.status}
                      onChange={(event) =>
                        updateSupportStatus(
                          item._id,
                          event.target.value,
                          item.adminReply
                        )
                      }
                    >

                      <option value="open">
                        open
                      </option>

                      <option value="in_progress">
                        in_progress
                      </option>

                      <option value="resolved">
                        resolved
                      </option>

                    </select>

                  </div>

                  <p className="mt-3">
                    {item.message}
                  </p>

                </div>

              ))

            )}

          </div>

        </div>
      )}

    </div>
  );
}

// =========================================================
// ADMIN ROLE PROTECTION
// =========================================================

export default function Admin() {
  return (
    <RoleGuard roles={['admin']}>
      <AdminContent />
    </RoleGuard>
  );
}