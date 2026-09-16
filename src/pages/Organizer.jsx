import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus } from 'lucide-react';

import api from '../services/api';
import { money } from '../utils/format';
import Stat from '../components/Stat';
import ChartCard from '../components/ChartCard';
import RoleGuard from '../components/RoleGuard';


function OrganizerContent() {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');


  // ============================================================
  // LOAD ORGANIZER ANALYTICS
  // ============================================================

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      setError('');

      const response = await api.get(
        '/analytics/organizer'
      );

      console.log(
        'Organizer analytics:',
        response.data
      );

      setAnalytics(response.data);

    } catch (error) {
      console.error(
        'Failed to load organizer analytics:',
        error
      );

      setError(
        error.response?.data?.message ||
          'Failed to load organizer analytics'
      );

    } finally {
      setLoading(false);
    }
  };


  useEffect(() => {
    loadAnalytics();
  }, []);


  // ============================================================
  // LOADING
  // ============================================================

  if (loading) {
    return (
      <div className="container py-16">
        Loading organizer analytics...
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
            Unable to load organizer dashboard
          </h2>

          <p className="text-red-600 mt-2">
            {error}
          </p>

          <button
            type="button"
            className="btn btn-primary mt-5"
            onClick={loadAnalytics}
          >
            Try again
          </button>

        </div>

      </div>
    );
  }


  // ============================================================
  // NO DATA
  // ============================================================

  if (!analytics) {
    return (
      <div className="container py-16">
        No analytics data available.
      </div>
    );
  }


  // ============================================================
  // NORMALIZE EVENTS
  // ============================================================

  const events = Array.isArray(
    analytics.events
  )
    ? analytics.events
    : [];


  // ============================================================
  // TICKET SALES CHART
  // ============================================================

  const salesByEvent = events.map(
    (event) => ({
      name:
        event.title &&
        event.title.length > 20
          ? `${event.title.slice(0, 20)}…`
          : event.title ||
            'Untitled event',

      value:
        Number(event.sold) || 0,
    })
  );


  // ============================================================
  // REVENUE CHART
  // ============================================================

  const revenueByEvent = events.map(
    (event) => ({
      name:
        event.title &&
        event.title.length > 20
          ? `${event.title.slice(0, 20)}…`
          : event.title ||
            'Untitled event',

      value:
        Number(event.revenue) || 0,
    })
  );


  // ============================================================
  // ATTENDANCE
  // ============================================================

  /*
    Current API response:

    {
      totalEvents,
      approved,
      pending,
      ticketsSold,
      revenue,
      events
    }

    It currently does not return attendanceRate.

    If attendance data becomes available later,
    this code will automatically use it.
  */

  const totalSold = events.reduce(
    (total, event) =>
      total +
      (Number(event.sold) || 0),
    0
  );


  const totalAttended = events.reduce(
    (total, event) =>
      total +
      (Number(event.attended) || 0),
    0
  );


  const hasAttendanceData =
    analytics.attendanceRate !== undefined ||
    events.some(
      (event) =>
        event.attended !== undefined &&
        event.attended !== null
    );


  let attendanceRate = null;


  if (
    analytics.attendanceRate !== undefined &&
    analytics.attendanceRate !== null
  ) {
    attendanceRate =
      Number(
        analytics.attendanceRate
      );

  } else if (
    hasAttendanceData &&
    totalSold > 0
  ) {
    attendanceRate =
      (totalAttended / totalSold) *
      100;
  }


  // ============================================================
  // AVERAGE RATING
  // ============================================================

  let averageRating = '—';


  if (
    analytics.averageRating !== undefined &&
    analytics.averageRating !== null
  ) {
    const rating =
      Number(
        analytics.averageRating
      );

    if (Number.isFinite(rating)) {
      averageRating =
        rating.toFixed(1);
    }
  }


  // ============================================================
  // REVENUE TREND
  // ============================================================

  /*
    The current organizer API does not return
    revenueTrend, so we only render the chart
    when that data actually exists.
  */

  const revenueTrend =
    Array.isArray(
      analytics.revenueTrend
    )
      ? analytics.revenueTrend
      : [];


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
            Organizer portal
          </span>

          <h1 className="text-3xl font-black mt-2">
            Organizer dashboard
          </h1>

          <p className="text-gray-500">
            Track ticket sales, attendance,
            revenue and event performance.
          </p>

        </div>


        <div className="flex gap-2">

          <Link
            className="btn btn-secondary"
            to="/events/new"
          >
            <Plus size={17} />
            New event
          </Link>

        </div>

      </div>


      {/* ======================================================
          STATISTICS
      ======================================================= */}

      <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4 mt-7">

        <Stat
          title="Events"
          value={
            Number(
              analytics.totalEvents
            ) || 0
          }
        />


        <Stat
          title="Tickets sold"
          value={
            Number(
              analytics.ticketsSold
            ) || 0
          }
        />


        <Stat
          title="Revenue"
          value={money(
            Number(
              analytics.revenue
            ) || 0
          )}
        />


        <Stat
          title="Attendance"
          value={
            attendanceRate === null
              ? '—'
              : `${attendanceRate.toFixed(1)}%`
          }
        />


        <Stat
          title="Avg. rating"
          value={averageRating}
        />

      </div>


      {/* ======================================================
          CHARTS
      ======================================================= */}

      <div className="grid lg:grid-cols-2 gap-5 mt-7">

        <ChartCard
          title="Ticket sales by event"
          data={salesByEvent}
        />


        <ChartCard
          title="Revenue by event"
          data={revenueByEvent}
          prefix="₹"
        />


        {revenueTrend.length > 0 && (
          <ChartCard
            title="Revenue trend"
            type="line"
            data={revenueTrend}
            prefix="₹"
          />
        )}

      </div>


      {/* ======================================================
          EVENT PERFORMANCE
      ======================================================= */}

      <div className="card p-5 mt-7">

        <div className="flex items-center justify-between">

          <div>

            <h2 className="font-black text-xl">
              Event performance
            </h2>

            <p className="text-sm text-gray-500">
              Approval status, sales and attendance.
            </p>

          </div>

        </div>


        <div className="overflow-auto mt-4">

          <table className="w-full text-left">

            <thead>

              <tr className="border-b">

                <th className="py-3">
                  Event
                </th>

                <th>
                  Status
                </th>

                <th>
                  Sold
                </th>

                <th>
                  Attended
                </th>

                <th>
                  Revenue
                </th>

                <th>
                  Action
                </th>

              </tr>

            </thead>


            <tbody>

              {events.length === 0 ? (

                <tr>

                  <td
                    colSpan="6"
                    className="py-8 text-center text-gray-500"
                  >
                    No events found.
                  </td>

                </tr>

              ) : (

                events.map(
                  (event) => (

                    <tr
                      className="border-b"
                      key={event.id}
                    >

                      <td className="py-3 font-bold">
                        {event.title ||
                          'Untitled event'}
                      </td>


                      <td>

                        <span className="badge">
                          {event.status ||
                            'unknown'}
                        </span>

                      </td>


                      <td>
                        {Number(
                          event.sold
                        ) || 0}
                      </td>


                      <td>
                        {event.attended !==
                          undefined &&
                        event.attended !==
                          null
                          ? event.attended
                          : '—'}
                      </td>


                      <td>
                        {money(
                          Number(
                            event.revenue
                          ) || 0
                        )}
                      </td>


                      <td>

                        <Link
                          className="text-brand font-bold"
                          to={`/events/${event.id}/edit`}
                        >
                          Edit
                        </Link>

                      </td>

                    </tr>

                  )
                )

              )}

            </tbody>

          </table>

        </div>

      </div>

    </div>
  );
}


// ============================================================
// ORGANIZER ROLE GUARD
// ============================================================

export default function Organizer() {

  return (
    <RoleGuard
      roles={[
        'organizer',
        'admin'
      ]}
    >
      <OrganizerContent />
    </RoleGuard>
  );
}