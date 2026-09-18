import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../services/api';

function getTodayLocal() {
  const now = new Date();

  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

function EventForm() {
  const { id } = useParams();
  const navigate = useNavigate();

  const today = useMemo(() => getTodayLocal(), []);

  const [loading, setLoading] = useState(Boolean(id));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    title: '',
    description: '',
    category: 'Technology',

    date: '',
    endDate: '',
    time: '',

    location: '',
    address: '',

    image: '',
    videoUrl: '',

    capacity: 100,

    ticketTypes: [
      {
        name: 'General Admission',
        price: 499,
        quantity: 100,
        sold: 0
      }
    ],

    sessions: []
  });

  // ============================================================
  // LOAD EVENT FOR EDIT
  // ============================================================

  useEffect(() => {
    if (!id) return;

    const loadEvent = async () => {
      try {
        setLoading(true);
        setError('');

        const response = await api.get(`/events/${id}`);
        const event = response.data;

        setForm({
          title: event.title || '',
          description: event.description || '',
          category: event.category || 'Technology',

          date: event.date
            ? String(event.date).slice(0, 10)
            : '',

          endDate: event.endDate
            ? String(event.endDate).slice(0, 10)
            : '',

          time: event.time || '',

          location: event.location || '',
          address: event.address || '',

          image: event.image || '',
          videoUrl: event.videoUrl || '',

          capacity: event.capacity || 100,

          ticketTypes:
            Array.isArray(event.ticketTypes) &&
            event.ticketTypes.length > 0
              ? event.ticketTypes.map((ticket) => ({
                  _id: ticket._id,
                  name: ticket.name || '',
                  price: ticket.price ?? 0,
                  quantity: ticket.quantity ?? 1,
                  sold: ticket.sold ?? 0
                }))
              : [
                  {
                    name: 'General Admission',
                    price: 499,
                    quantity: 100,
                    sold: 0
                  }
                ],

          sessions:
            Array.isArray(event.sessions)
              ? event.sessions.map((session) => ({
                  _id: session._id,
                  title: session.title || '',
                  description:
                    session.description || '',

                  startTime: session.startTime
                    ? new Date(session.startTime)
                        .toISOString()
                        .slice(0, 16)
                    : '',

                  endTime: session.endTime
                    ? new Date(session.endTime)
                        .toISOString()
                        .slice(0, 16)
                    : '',

                  speaker: session.speaker || '',
                  room: session.room || ''
                }))
              : []
        });
      } catch (err) {
        console.error(
          'Failed to load event:',
          err
        );

        setError(
          err.response?.data?.message ||
            'Failed to load event.'
        );
      } finally {
        setLoading(false);
      }
    };

    loadEvent();
  }, [id]);

  // ============================================================
  // BASIC FIELD UPDATE
  // ============================================================

  const updateField = (field, value) => {
    setForm((current) => ({
      ...current,
      [field]: value
    }));
  };

  // ============================================================
  // TICKET FUNCTIONS
  // ============================================================

  const updateTicket = (
    index,
    field,
    value
  ) => {
    setForm((current) => {
      const ticketTypes = [
        ...current.ticketTypes
      ];

      ticketTypes[index] = {
        ...ticketTypes[index],
        [field]: value
      };

      return {
        ...current,
        ticketTypes
      };
    });
  };

  const addTicket = () => {
    setForm((current) => ({
      ...current,

      ticketTypes: [
        ...current.ticketTypes,
        {
          name: 'VIP',
          price: 999,
          quantity: 50,
          sold: 0
        }
      ]
    }));
  };

  const removeTicket = (index) => {
    if (form.ticketTypes.length <= 1) {
      setError(
        'At least one ticket type is required.'
      );
      return;
    }

    setForm((current) => ({
      ...current,

      ticketTypes:
        current.ticketTypes.filter(
          (_, ticketIndex) =>
            ticketIndex !== index
        )
    }));
  };

  // ============================================================
  // SESSION FUNCTIONS
  // ============================================================

  const addSession = () => {
    setForm((current) => ({
      ...current,

      sessions: [
        ...current.sessions,

        {
          title: '',
          description: '',
          startTime: '',
          endTime: '',
          speaker: '',
          room: ''
        }
      ]
    }));
  };

  const updateSession = (
    index,
    field,
    value
  ) => {
    setForm((current) => {
      const sessions = [
        ...current.sessions
      ];

      sessions[index] = {
        ...sessions[index],
        [field]: value
      };

      return {
        ...current,
        sessions
      };
    });
  };

  const removeSession = (index) => {
    setForm((current) => ({
      ...current,

      sessions:
        current.sessions.filter(
          (_, sessionIndex) =>
            sessionIndex !== index
        )
    }));
  };

  // ============================================================
  // VALIDATION
  // ============================================================

  const validate = () => {
    setError('');

    const title =
      form.title.trim();

    const description =
      form.description.trim();

    const category =
      form.category.trim();

    const location =
      form.location.trim();

    if (!title) {
      setError(
        'Event title is required.'
      );
      return false;
    }

    if (!description) {
      setError(
        'Event description is required.'
      );
      return false;
    }

    if (!category) {
      setError(
        'Event category is required.'
      );
      return false;
    }

    if (!form.date) {
      setError(
        'Event date is required.'
      );
      return false;
    }

    // ==========================================================
    // NO PAST DATE
    // Today IS allowed.
    // ==========================================================

    if (form.date < today) {
      setError(
        'Past event dates are not allowed. Please select today or a future date.'
      );

      return false;
    }

    if (
      form.endDate &&
      form.endDate < form.date
    ) {
      setError(
        'Event end date cannot be earlier than the event start date.'
      );

      return false;
    }

    if (!form.time) {
      setError(
        'Event start time is required.'
      );

      return false;
    }

    if (!location) {
      setError(
        'Event location is required.'
      );

      return false;
    }

    const capacity =
      Number(form.capacity);

    if (
      !Number.isInteger(capacity) ||
      capacity < 1
    ) {
      setError(
        'Event capacity must be at least 1.'
      );

      return false;
    }

    // ==========================================================
    // TICKET VALIDATION
    // ==========================================================

    if (
      !Array.isArray(form.ticketTypes) ||
      form.ticketTypes.length === 0
    ) {
      setError(
        'At least one ticket type is required.'
      );

      return false;
    }

    let totalTicketQuantity = 0;

    for (
      let index = 0;
      index < form.ticketTypes.length;
      index += 1
    ) {
      const ticket =
        form.ticketTypes[index];

      const ticketName =
        String(
          ticket.name || ''
        ).trim();

      const price =
        Number(ticket.price);

      const quantity =
        Number(ticket.quantity);

      const sold =
        Number(ticket.sold || 0);

      if (!ticketName) {
        setError(
          `Ticket type ${index + 1} needs a name.`
        );

        return false;
      }

      if (
        !Number.isFinite(price) ||
        price < 0
      ) {
        setError(
          `Ticket type ${index + 1} has an invalid price.`
        );

        return false;
      }

      if (
        !Number.isInteger(quantity) ||
        quantity < 1
      ) {
        setError(
          `Ticket type ${index + 1} quantity must be at least 1.`
        );

        return false;
      }

      // Never reduce inventory below already-sold tickets.

      if (
        id &&
        quantity < sold
      ) {
        setError(
          `${ticketName}: quantity cannot be less than ${sold}, because ${sold} ticket(s) have already been sold.`
        );

        return false;
      }

      totalTicketQuantity +=
        quantity;
    }

    if (
      totalTicketQuantity < capacity
    ) {
      setError(
        `Ticket quantities total ${totalTicketQuantity}, but event capacity is ${capacity}. Add more ticket inventory or reduce the capacity.`
      );

      return false;
    }

    // ==========================================================
    // SESSION VALIDATION
    // ==========================================================

    for (
      let index = 0;
      index < form.sessions.length;
      index += 1
    ) {
      const session =
        form.sessions[index];

      if (
        !session.title?.trim()
      ) {
        setError(
          `Session ${index + 1} needs a title.`
        );

        return false;
      }

      if (!session.startTime) {
        setError(
          `Session ${index + 1} needs a start date and time.`
        );

        return false;
      }

      if (!session.endTime) {
        setError(
          `Session ${index + 1} needs an end date and time.`
        );

        return false;
      }

      if (
        new Date(
          session.endTime
        ) <
        new Date(
          session.startTime
        )
      ) {
        setError(
          `Session ${index + 1} end time cannot be earlier than its start time.`
        );

        return false;
      }
    }

    return true;
  };

  // ============================================================
  // SAVE EVENT
  // ============================================================

  const save = async (event) => {
    event.preventDefault();

    if (!validate()) {
      window.scrollTo({
        top: 0,
        behavior: 'smooth'
      });

      return;
    }

    try {
      setSaving(true);
      setError('');

      const data = {
        title:
          form.title.trim(),

        description:
          form.description.trim(),

        category:
          form.category.trim(),

        date: form.date,

        endDate:
          form.endDate
            ? form.endDate
            : null,

        time: form.time,

        location:
          form.location.trim(),

        address:
          form.address.trim(),

        image:
          form.image.trim(),

        videoUrl:
          form.videoUrl.trim(),

        capacity:
          Number(form.capacity),

        ticketTypes:
          form.ticketTypes.map(
            (ticket) => ({
              ...(ticket._id
                ? {
                    _id: ticket._id
                  }
                : {}),

              name:
                ticket.name.trim(),

              price:
                Number(ticket.price),

              quantity:
                Number(ticket.quantity),

              ...(ticket.sold !==
                undefined
                ? {
                    sold:
                      Number(
                        ticket.sold
                      )
                  }
                : {})
            })
          ),

        sessions:
          form.sessions.map(
            (session) => ({
              ...(session._id
                ? {
                    _id:
                      session._id
                  }
                : {}),

              title:
                session.title.trim(),

              description:
                session.description?.trim() ||
                '',

              startTime:
                session.startTime,

              endTime:
                session.endTime,

              speaker:
                session.speaker?.trim() ||
                '',

              room:
                session.room?.trim() ||
                ''
            })
          )
      };

      if (id) {
        await api.put(
          `/events/${id}`,
          data
        );
      } else {
        await api.post(
          '/events',
          data
        );
      }

      navigate('/organizer', {
        replace: true
      });
    } catch (err) {
      console.error(
        'Event save error:',
        err
      );

      setError(
        err.response?.data?.message ||
          'Could not save event. Please try again.'
      );

      window.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    } finally {
      setSaving(false);
    }
  };

  // ============================================================
  // LOADING
  // ============================================================

  if (loading) {
    return (
      <div className="container py-16">
        <div className="card p-8 text-center">
          Loading event...
        </div>
      </div>
    );
  }

  // ============================================================
  // UI
  // ============================================================

  return (
    <div className="container py-10 max-w-5xl">

      <div className="mb-6">

        <h1 className="text-3xl font-black">
          {id
            ? 'Edit event'
            : 'Create event'}
        </h1>

        <p className="text-gray-500 mt-2">
          Create an event for today or
          any future date.
        </p>

      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-4 mb-6">

          <strong className="block">
            Please correct the following:
          </strong>

          <p className="mt-1">
            {error}
          </p>

        </div>
      )}

      <form
        className="card p-7"
        onSubmit={save}
      >

        {/* =====================================================
            EVENT INFORMATION
        ====================================================== */}

        <h2 className="text-xl font-black">
          Event information
        </h2>

        <div className="grid md:grid-cols-2 gap-5 mt-5">

          <div>
            <label className="text-sm font-bold">
              Event title
            </label>

            <input
              className="field mt-1"
              value={form.title}
              onChange={(e) =>
                updateField(
                  'title',
                  e.target.value
                )
              }
              placeholder="Software Engineering Conference"
              required
            />
          </div>

          <div>
            <label className="text-sm font-bold">
              Category
            </label>

            <input
              className="field mt-1"
              value={form.category}
              onChange={(e) =>
                updateField(
                  'category',
                  e.target.value
                )
              }
              placeholder="Technology"
              required
            />
          </div>

          {/* DATE */}

          <div>
            <label className="text-sm font-bold">
              Event date
            </label>

            <input
              className="field mt-1"
              type="date"
              min={today}
              value={form.date}
              onChange={(e) =>
                updateField(
                  'date',
                  e.target.value
                )
              }
              required
            />

            <p className="text-xs text-gray-500 mt-1">
              Today and future dates are
              allowed. Past dates are not
              allowed.
            </p>
          </div>

          {/* END DATE */}

          <div>
            <label className="text-sm font-bold">
              Event end date
            </label>

            <input
              className="field mt-1"
              type="date"
              min={
                form.date || today
              }
              value={form.endDate}
              onChange={(e) =>
                updateField(
                  'endDate',
                  e.target.value
                )
              }
            />

            <p className="text-xs text-gray-500 mt-1">
              Optional. Use this for
              multi-day events.
            </p>
          </div>

          {/* START TIME */}

          <div>
            <label className="text-sm font-bold">
              Event start time
            </label>

            <input
              className="field mt-1"
              type="time"
              value={form.time}
              onChange={(e) =>
                updateField(
                  'time',
                  e.target.value
                )
              }
              required
            />

            <p className="text-xs text-gray-500 mt-1">
              Time when the main event
              begins.
            </p>
          </div>

          {/* LOCATION */}

          <div>
            <label className="text-sm font-bold">
              Location
            </label>

            <input
              className="field mt-1"
              value={form.location}
              onChange={(e) =>
                updateField(
                  'location',
                  e.target.value
                )
              }
              placeholder="Chennai"
              required
            />
          </div>

          {/* ADDRESS */}

          <div>
            <label className="text-sm font-bold">
              Address
            </label>

            <input
              className="field mt-1"
              value={form.address}
              onChange={(e) =>
                updateField(
                  'address',
                  e.target.value
                )
              }
              placeholder="Venue address"
            />
          </div>

          {/* CAPACITY */}

          <div>
            <label className="text-sm font-bold">
              Event capacity
            </label>

            <input
              className="field mt-1"
              type="number"
              min="1"
              value={form.capacity}
              onChange={(e) =>
                updateField(
                  'capacity',
                  e.target.value
                )
              }
              required
            />

            <p className="text-xs text-gray-500 mt-1">
              Maximum number of attendees.
            </p>
          </div>

          {/* IMAGE */}

          <div>
            <label className="text-sm font-bold">
              Image URL
            </label>

            <input
              className="field mt-1"
              type="url"
              value={form.image}
              onChange={(e) =>
                updateField(
                  'image',
                  e.target.value
                )
              }
              placeholder="https://..."
            />
          </div>

          {/* VIDEO */}

          <div>
            <label className="text-sm font-bold">
              Video URL
            </label>

            <input
              className="field mt-1"
              type="url"
              value={form.videoUrl}
              onChange={(e) =>
                updateField(
                  'videoUrl',
                  e.target.value
                )
              }
              placeholder="https://youtube.com/..."
            />
          </div>

        </div>

        {/* DESCRIPTION */}

        <div className="mt-5">

          <label className="text-sm font-bold">
            Event description
          </label>

          <textarea
            className="field mt-1 min-h-36"
            value={form.description}
            onChange={(e) =>
              updateField(
                'description',
                e.target.value
              )
            }
            placeholder="Describe the event..."
            required
          />

        </div>

        {/* =====================================================
            TICKET TYPES
        ====================================================== */}

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mt-10">

          <div>

            <h2 className="text-xl font-black">
              Ticket types
            </h2>

            <p className="text-sm text-gray-500 mt-1">
              Define ticket prices and
              available inventory.
            </p>

          </div>

          <button
            type="button"
            className="btn btn-secondary"
            onClick={addTicket}
          >
            Add ticket type
          </button>

        </div>

        <div className="space-y-4 mt-5">

          {form.ticketTypes.map(
            (ticket, index) => (
              <div
                key={
                  ticket._id ||
                  `ticket-${index}`
                }
                className="border rounded-xl p-4"
              >

                <div className="grid md:grid-cols-3 gap-4">

                  <div>
                    <label className="text-sm font-bold">
                      Ticket name
                    </label>

                    <input
                      className="field mt-1"
                      value={ticket.name}
                      onChange={(e) =>
                        updateTicket(
                          index,
                          'name',
                          e.target.value
                        )
                      }
                      placeholder="General Admission"
                      required
                    />
                  </div>

                  <div>
                    <label className="text-sm font-bold">
                      Price
                    </label>

                    <input
                      className="field mt-1"
                      type="number"
                      min="0"
                      step="0.01"
                      value={ticket.price}
                      onChange={(e) =>
                        updateTicket(
                          index,
                          'price',
                          e.target.value
                        )
                      }
                      required
                    />
                  </div>

                  <div>
                    <label className="text-sm font-bold">
                      Available quantity
                    </label>

                    <input
                      className="field mt-1"
                      type="number"
                      min={
                        Number(ticket.sold || 0) ||
                        1
                      }
                      value={ticket.quantity}
                      onChange={(e) =>
                        updateTicket(
                          index,
                          'quantity',
                          e.target.value
                        )
                      }
                      required
                    />

                    {Number(ticket.sold || 0) > 0 && (
                      <p className="text-xs text-gray-500 mt-1">
                        Already sold:{' '}
                        <strong>
                          {ticket.sold}
                        </strong>
                      </p>
                    )}
                  </div>

                </div>

                {form.ticketTypes.length > 1 && (
                  <button
                    type="button"
                    className="text-red-600 text-sm font-bold mt-3"
                    onClick={() =>
                      removeTicket(index)
                    }
                  >
                    Remove ticket type
                  </button>
                )}

              </div>
            )
          )}

        </div>

        {/* =====================================================
            SCHEDULE
        ====================================================== */}

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mt-10">

          <div>

            <h2 className="text-xl font-black">
              Event schedule
            </h2>

            <p className="text-sm text-gray-500 mt-1">
              Add sessions, speakers and
              rooms if required.
            </p>

          </div>

          <button
            type="button"
            className="btn btn-secondary"
            onClick={addSession}
          >
            Add session
          </button>

        </div>

        <div className="space-y-5 mt-5">

          {form.sessions.map(
            (session, index) => (
              <div
                key={
                  session._id ||
                  `session-${index}`
                }
                className="border rounded-xl p-5"
              >

                <div className="flex justify-between gap-3">

                  <h3 className="font-black">
                    Session {index + 1}
                  </h3>

                  <button
                    type="button"
                    className="text-red-600 text-sm font-bold"
                    onClick={() =>
                      removeSession(index)
                    }
                  >
                    Remove
                  </button>

                </div>

                <div className="grid md:grid-cols-2 gap-4 mt-4">

                  <div>
                    <label className="text-sm font-bold">
                      Session title
                    </label>

                    <input
                      className="field mt-1"
                      value={
                        session.title
                      }
                      onChange={(e) =>
                        updateSession(
                          index,
                          'title',
                          e.target.value
                        )
                      }
                      placeholder="Opening keynote"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-bold">
                      Speaker
                    </label>

                    <input
                      className="field mt-1"
                      value={
                        session.speaker
                      }
                      onChange={(e) =>
                        updateSession(
                          index,
                          'speaker',
                          e.target.value
                        )
                      }
                      placeholder="Speaker name"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-bold">
                      Session start
                    </label>

                    <input
                      className="field mt-1"
                      type="datetime-local"
                      value={
                        session.startTime
                      }
                      onChange={(e) =>
                        updateSession(
                          index,
                          'startTime',
                          e.target.value
                        )
                      }
                    />

                    <p className="text-xs text-gray-500 mt-1">
                      Date and time when
                      this session begins.
                    </p>
                  </div>

                  <div>
                    <label className="text-sm font-bold">
                      Session end
                    </label>

                    <input
                      className="field mt-1"
                      type="datetime-local"
                      value={
                        session.endTime
                      }
                      onChange={(e) =>
                        updateSession(
                          index,
                          'endTime',
                          e.target.value
                        )
                      }
                    />

                    <p className="text-xs text-gray-500 mt-1">
                      Date and time when
                      this session ends.
                    </p>
                  </div>

                  <div>
                    <label className="text-sm font-bold">
                      Room / venue
                    </label>

                    <input
                      className="field mt-1"
                      value={
                        session.room
                      }
                      onChange={(e) =>
                        updateSession(
                          index,
                          'room',
                          e.target.value
                        )
                      }
                      placeholder="Hall A"
                    />
                  </div>

                </div>

                <div className="mt-4">

                  <label className="text-sm font-bold">
                    Session description
                  </label>

                  <textarea
                    className="field mt-1"
                    value={
                      session.description
                    }
                    onChange={(e) =>
                      updateSession(
                        index,
                        'description',
                        e.target.value
                      )
                    }
                    placeholder="Session details..."
                  />

                </div>

              </div>
            )
          )}

        </div>

        {/* =====================================================
            ACTIONS
        ====================================================== */}

        <div className="flex flex-col sm:flex-row gap-3 mt-10">

          <button
            type="submit"
            className="btn btn-primary"
            disabled={saving}
          >
            {saving
              ? 'Saving...'
              : id
                ? 'Save changes'
                : 'Submit event'}
          </button>

          <button
            type="button"
            className="btn btn-secondary"
            disabled={saving}
            onClick={() =>
              navigate('/organizer')
            }
          >
            Cancel
          </button>

        </div>

      </form>

    </div>
  );
}

export default EventForm;