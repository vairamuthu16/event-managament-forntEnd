import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft,
  BarChart3,
  CalendarDays,
  IndianRupee,
  Star,
  Ticket,
  Users
} from 'lucide-react';

import api from '../services/api';
import ChartCard from '../components/ChartCard';

function OrganizerAnalytics() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      setError('');

      const response = await api.get('/analytics/organizer');

      console.log('Organizer analytics API response:', response.data);

      setData(response.data);
    } catch (err) {
      console.error('Organizer analytics error:', err);

      setError(
        err.response?.data?.message ||
        'Unable to load organizer analytics.'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAnalytics();
  }, []);

  if (loading) {
    return (
      <div className="container py-16">
        <div className="card p-8 text-center">
          <p className="text-gray-500">
            Loading analytics...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container py-10">
        <div className="card p-6">
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-4">
            {error}
          </div>

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

  const analytics = data || {};

  /* =====================================================
     SUMMARY
  ===================================================== */

  const totalEvents = Number(
    analytics.totalEvents ?? 0
  );

  const ticketsSold = Number(
    analytics.ticketsSold ??
    analytics.totalTicketsSold ??
    0
  );

  const revenue = Number(
    analytics.revenue ??
    analytics.totalRevenue ??
    0
  );

  const attendanceRate = Number(
    analytics.attendanceRate ?? 0
  );

  const averageRating = Number(
    analytics.averageRating ?? 0
  );

  const feedbackCount = Number(
    analytics.feedbackCount ?? 0
  );


  /* =====================================================
     EVENTS
  ===================================================== */

  const rawEvents = Array.isArray(analytics.events)
    ? analytics.events
    : [];


  /*
    Normalize event data.

    This supports:
      event.id
      event._id

    and:
      event.title
      event.name
  */

  const events = rawEvents.map((event) => ({
    id: event.id || event._id,

    title:
      event.title ||
      event.name ||
      'Untitled event',

    status:
      event.status ||
      'pending',

    sold: Number(
      event.sold ??
      event.ticketsSold ??
      event.ticketSales ??
      0
    ),

    attended: Number(
      event.attended ??
      event.attendance ??
      event.attendees ??
      0
    ),

    attendanceRate: Number(
      event.attendanceRate ?? 0
    ),

    revenue: Number(
      event.revenue ??
      event.totalRevenue ??
      event.salesRevenue ??
      0
    ),

    averageRating: Number(
      event.averageRating ??
      event.rating ??
      0
    ),

    feedbackCount: Number(
      event.feedbackCount ??
      0
    )
  }));


  /* =====================================================
     TICKETS SOLD CHART
  ===================================================== */

  let salesByEvent = [];

  if (
    Array.isArray(analytics.salesByEvent) &&
    analytics.salesByEvent.length
  ) {
    salesByEvent = analytics.salesByEvent.map((item) => ({
      name:
        item.name ||
        item.title ||
        item.eventName ||
        'Event',

      sold: Number(
        item.sold ??
        item.ticketsSold ??
        item.ticketSales ??
        item.count ??
        item.value ??
        0
      )
    }));
  } else {
    /*
      If backend doesn't provide salesByEvent,
      build it from events.
    */
    salesByEvent = events.map((event) => ({
      name: event.title,
      sold: event.sold
    }));
  }


  /* =====================================================
     REVENUE BY EVENT CHART
  ===================================================== */

  let revenueByEvent = [];

  if (
    Array.isArray(analytics.revenueByEvent) &&
    analytics.revenueByEvent.length
  ) {
    revenueByEvent = analytics.revenueByEvent.map((item) => ({
      name:
        item.name ||
        item.title ||
        item.eventName ||
        'Event',

      revenue: Number(
        item.revenue ??
        item.totalRevenue ??
        item.amount ??
        item.value ??
        0
      )
    }));
  } else {
    /*
      Build from event-level analytics.
    */
    revenueByEvent = events.map((event) => ({
      name: event.title,
      revenue: event.revenue
    }));
  }


  /* =====================================================
     REVENUE TREND
  ===================================================== */

  let revenueTrend = [];

  if (
    Array.isArray(analytics.revenueTrend) &&
    analytics.revenueTrend.length
  ) {
    revenueTrend = analytics.revenueTrend.map(
      (item) => ({
        date:
          item.date ||
          item.month ||
          item.label ||
          'Period',

        revenue: Number(
          item.revenue ??
          item.totalRevenue ??
          item.amount ??
          item.value ??
          0
        )
      })
    );
  }


  /*
    If there is no trend from backend, create a
    simple event-level revenue series.

    This ensures the chart isn't completely empty
    when event analytics exist.
  */
  if (
    revenueTrend.length === 0 &&
    events.length > 0
  ) {
    revenueTrend = events.map((event) => ({
      date: event.title,
      revenue: event.revenue
    }));
  }


  console.log('Normalized sales chart:', salesByEvent);
  console.log('Normalized revenue chart:', revenueByEvent);
  console.log('Normalized revenue trend:', revenueTrend);


  return (
    <div className="container py-10">

      {/* =================================================
          HEADER
      ================================================= */}

      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">

        <div>

          <div className="flex items-center gap-3">

            <BarChart3
              size={30}
              className="text-brand"
            />

            <h1 className="text-3xl font-black">
              Organizer Analytics
            </h1>

          </div>

          <p className="text-gray-500 mt-2">
            Track ticket sales, revenue, attendance,
            and attendee feedback.
          </p>

        </div>

        <div className="flex gap-3">

          <Link
            to="/organizer"
            className="btn btn-secondary"
          >
            <ArrowLeft
              size={17}
              className="mr-2"
            />

            Back to organizer
          </Link>

          <button
            type="button"
            className="btn btn-primary"
            onClick={loadAnalytics}
          >
            Refresh
          </button>

        </div>

      </div>


      {/* =================================================
          KPI CARDS
      ================================================= */}

      <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-5 mt-8">

        {/* Events */}

        <div className="card p-5">

          <div className="flex items-center justify-between">

            <div>

              <p className="text-sm text-gray-500">
                Total events
              </p>

              <p className="text-3xl font-black mt-2">
                {totalEvents}
              </p>

            </div>

            <CalendarDays
              size={30}
              className="text-brand"
            />

          </div>

        </div>


        {/* Tickets */}

        <div className="card p-5">

          <div className="flex items-center justify-between">

            <div>

              <p className="text-sm text-gray-500">
                Tickets sold
              </p>

              <p className="text-3xl font-black mt-2">
                {ticketsSold}
              </p>

            </div>

            <Ticket
              size={30}
              className="text-brand"
            />

          </div>

        </div>


        {/* Revenue */}

        <div className="card p-5">

          <div className="flex items-center justify-between">

            <div>

              <p className="text-sm text-gray-500">
                Revenue
              </p>

              <p className="text-2xl font-black mt-2">
                ₹{revenue.toLocaleString()}
              </p>

            </div>

            <IndianRupee
              size={30}
              className="text-brand"
            />

          </div>

        </div>


        {/* Attendance */}

        <div className="card p-5">

          <div className="flex items-center justify-between">

            <div>

              <p className="text-sm text-gray-500">
                Attendance
              </p>

              <p className="text-3xl font-black mt-2">
                {attendanceRate.toFixed(1)}%
              </p>

            </div>

            <Users
              size={30}
              className="text-brand"
            />

          </div>

        </div>


        {/* Rating */}

        <div className="card p-5">

          <div className="flex items-center justify-between">

            <div>

              <p className="text-sm text-gray-500">
                Average rating
              </p>

              <p className="text-3xl font-black mt-2">
                {averageRating
                  ? averageRating.toFixed(1)
                  : '—'}
              </p>

              <p className="text-xs text-gray-400 mt-1">
                {feedbackCount}{' '}
                {feedbackCount === 1
                  ? 'feedback'
                  : 'feedbacks'}
              </p>

            </div>

            <Star
              size={30}
              className="text-brand"
            />

          </div>

        </div>

      </div>


      {/* =================================================
          CHARTS
      ================================================= */}

      <div className="grid lg:grid-cols-2 gap-6 mt-8">

        <ChartCard
          title="Tickets sold by event"
          description="Paid tickets sold for each event."
          type="bar"
          data={salesByEvent}
          dataKey="sold"
          xKey="name"
          height={340}
        />


        <ChartCard
          title="Revenue by event"
          description="Revenue generated from paid registrations."
          type="bar"
          data={revenueByEvent}
          dataKey="revenue"
          xKey="name"
          prefix="₹"
          height={340}
        />

      </div>


      {/* =================================================
          REVENUE TREND
      ================================================= */}

      <div className="mt-6">

        <ChartCard
          title="Revenue trend"
          description="Revenue generated over time."
          type="line"
          data={revenueTrend}
          dataKey="revenue"
          xKey="date"
          prefix="₹"
          height={340}
        />

      </div>


      {/* =================================================
          EVENT PERFORMANCE
      ================================================= */}

      <div className="card p-6 mt-8">

        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">

          <div>

            <h2 className="text-xl font-black">
              Event performance
            </h2>

            <p className="text-sm text-gray-500 mt-1">
              Detailed performance metrics for your events.
            </p>

          </div>

          <Link
            to="/organizer"
            className="text-brand font-bold text-sm"
          >
            Manage events →
          </Link>

        </div>


        {events.length === 0 ? (

          <div className="text-center py-12 text-gray-500">
            No event analytics available yet.
          </div>

        ) : (

          <div className="overflow-x-auto mt-6">

            <table className="w-full text-sm">

              <thead>

                <tr className="border-b text-left">

                  <th className="py-3 pr-4">
                    Event
                  </th>

                  <th className="py-3 px-4">
                    Status
                  </th>

                  <th className="py-3 px-4">
                    Sold
                  </th>

                  <th className="py-3 px-4">
                    Attended
                  </th>

                  <th className="py-3 px-4">
                    Attendance
                  </th>

                  <th className="py-3 px-4">
                    Revenue
                  </th>

                  <th className="py-3 pl-4">
                    Rating
                  </th>

                </tr>

              </thead>

              <tbody>

                {events.map((event) => (

                  <tr
                    key={event.id}
                    className="border-b last:border-0"
                  >

                    <td className="py-4 pr-4">

                      <div className="font-bold">
                        {event.title}
                      </div>

                      {event.id && (
                        <Link
                          to={`/events/${event.id}`}
                          className="text-xs text-brand mt-1 inline-block"
                        >
                          View event
                        </Link>
                      )}

                    </td>


                    <td className="py-4 px-4">

                      <span className="badge">
                        {event.status}
                      </span>

                    </td>


                    <td className="py-4 px-4 font-bold">
                      {event.sold}
                    </td>


                    <td className="py-4 px-4">
                      {event.attended}
                    </td>


                    <td className="py-4 px-4">
                      {event.attendanceRate.toFixed(1)}%
                    </td>


                    <td className="py-4 px-4 font-bold">
                      ₹{event.revenue.toLocaleString()}
                    </td>


                    <td className="py-4 pl-4">
                      {event.averageRating
                        ? event.averageRating.toFixed(1)
                        : '—'}
                    </td>

                  </tr>

                ))}

              </tbody>

            </table>

          </div>

        )}

      </div>


      {/* =================================================
          EMPTY STATE
      ================================================= */}

      {totalEvents === 0 && (

        <div className="card p-8 mt-8 text-center">

          <CalendarDays
            size={40}
            className="mx-auto text-gray-400"
          />

          <h2 className="text-xl font-black mt-4">
            No analytics yet
          </h2>

          <p className="text-gray-500 mt-2">
            Create an event and start selling tickets
            to see analytics here.
          </p>

          <Link
            to="/organizer/event/new"
            className="btn btn-primary mt-5 inline-flex"
          >
            Create your first event
          </Link>

        </div>

      )}

    </div>
  );
}

export default OrganizerAnalytics;