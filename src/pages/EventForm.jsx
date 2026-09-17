import {
  useEffect,
  useState
} from 'react';

import {
  useNavigate,
  useParams
} from 'react-router-dom';

import api from '../services/api';

import {
  useNotification
} from '../context/NotificationContext';

function EventForm() {
  const { id } =
    useParams();

  const navigate =
    useNavigate();

  const { notify } =
    useNotification();

  const [loading, setLoading] =
    useState(false);

  const [form, setForm] =
    useState({
      title: '',
      description: '',
      category: 'Technology',
      date: '',
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
          quantity: 100
        }
      ],

      sessions: []
    });

  useEffect(() => {
    if (!id) return;

    const load =
      async () => {
        try {
          const response =
            await api.get(
              `/events/${id}`
            );

          const event =
            response.data;

          setForm({
            title:
              event.title || '',
            description:
              event.description ||
              '',
            category:
              event.category ||
              'Technology',
            date: event.date
              ? new Date(
                  event.date
                )
                  .toISOString()
                  .slice(
                    0,
                    10
                  )
              : '',
            time:
              event.time || '',
            location:
              event.location ||
              '',
            address:
              event.address || '',
            image:
              event.image || '',
            videoUrl:
              event.videoUrl ||
              '',
            capacity:
              event.capacity ||
              100,

            ticketTypes:
              event.ticketTypes?.length
                ? event.ticketTypes
                : [
                    {
                      name: 'General Admission',
                      price: 499,
                      quantity: 100
                    }
                  ],

            sessions:
              event.sessions || []
          });
        } catch (error) {
          notify(
            error.response?.data
              ?.message ||
              'Failed to load event.',
            'error'
          );
        }
      };

    load();
  }, [id]);

  const updateField = (
    field,
    value
  ) => {
    setForm(
      (current) => ({
        ...current,
        [field]: value
      })
    );
  };

  const addTicket = () => {
    setForm(
      (current) => ({
        ...current,
        ticketTypes: [
          ...current.ticketTypes,
          {
            name: 'VIP',
            price: 999,
            quantity: 50
          }
        ]
      })
    );
  };

  const updateTicket = (
    index,
    field,
    value
  ) => {
    setForm(
      (current) => {
        const tickets = [
          ...current.ticketTypes
        ];

        tickets[index] = {
          ...tickets[index],
          [field]: value
        };

        return {
          ...current,
          ticketTypes:
            tickets
        };
      }
    );
  };

  const removeTicket = (
    index
  ) => {
    setForm(
      (current) => ({
        ...current,
        ticketTypes:
          current.ticketTypes.filter(
            (_, itemIndex) =>
              itemIndex !==
              index
          )
      })
    );
  };

  const addSession = () => {
    setForm(
      (current) => ({
        ...current,
        sessions: [
          ...(current.sessions ||
            []),
          {
            title: '',
            description: '',
            speaker: '',
            room: '',
            startTime: '',
            endTime: ''
          }
        ]
      })
    );
  };

  const updateSession = (
    index,
    field,
    value
  ) => {
    setForm(
      (current) => {
        const sessions = [
          ...(current.sessions ||
            [])
        ];

        sessions[index] = {
          ...sessions[index],
          [field]: value
        };

        return {
          ...current,
          sessions
        };
      }
    );
  };

  const removeSession = (
    index
  ) => {
    setForm(
      (current) => ({
        ...current,
        sessions:
          current.sessions.filter(
            (_, itemIndex) =>
              itemIndex !==
              index
          )
      })
    );
  };

  const save =
    async (event) => {
      event.preventDefault();

      setLoading(true);

      try {
        const data = {
          ...form,

          capacity:
            Number(
              form.capacity
            ) || 0,

          ticketTypes:
            form.ticketTypes.map(
              (ticket) => ({
                ...ticket,
                price:
                  Number(
                    ticket.price
                  ) || 0,
                quantity:
                  Number(
                    ticket.quantity
                  ) || 1
              })
            ),

          sessions:
            (form.sessions ||
              []).map(
              (session) => ({
                ...session,
                startTime:
                  session.startTime ||
                  null,
                endTime:
                  session.endTime ||
                  null
              })
            )
        };

        if (id) {
          await api.put(
            `/events/${id}`,
            data
          );

          notify(
            'Event updated successfully.',
            'success'
          );
        } else {
          await api.post(
            '/events',
            data
          );

          notify(
            'Event submitted successfully for approval.',
            'success'
          );
        }

        navigate(
          '/organizer'
        );
      } catch (error) {
        notify(
          error.response?.data
            ?.message ||
            'Could not save event.',
          'error'
        );
      } finally {
        setLoading(false);
      }
    };

  return (
    <div className="container py-10 max-w-5xl">
      <span className="badge">
        Organizer portal
      </span>

      <h1 className="text-3xl font-black mt-2">
        {id
          ? 'Edit event'
          : 'Create event'}
      </h1>

      <p className="text-gray-500 mt-1">
        Create a complete event listing
        with ticketing and schedule details.
      </p>

      <form
        className="card p-7 mt-6"
        onSubmit={save}
      >
        <h2 className="font-black text-xl">
          Event information
        </h2>

        <div className="grid md:grid-cols-2 gap-4 mt-4">
          <div>
            <label className="text-sm font-bold">
              Event title
            </label>

            <input
              className="field mt-1"
              value={form.title}
              onChange={(event) =>
                updateField(
                  'title',
                  event.target
                    .value
                )
              }
              required
            />
          </div>

          <div>
            <label className="text-sm font-bold">
              Category
            </label>

            <input
              className="field mt-1"
              value={
                form.category
              }
              onChange={(event) =>
                updateField(
                  'category',
                  event.target
                    .value
                )
              }
              required
            />
          </div>

          <div>
            <label className="text-sm font-bold">
              Date
            </label>

            <input
              className="field mt-1"
              type="date"
              value={form.date}
              onChange={(event) =>
                updateField(
                  'date',
                  event.target
                    .value
                )
              }
              required
            />
          </div>

          <div>
            <label className="text-sm font-bold">
              Time
            </label>

            <input
              className="field mt-1"
              type="time"
              value={form.time}
              onChange={(event) =>
                updateField(
                  'time',
                  event.target
                    .value
                )
              }
            />
          </div>

          <div>
            <label className="text-sm font-bold">
              Location
            </label>

            <input
              className="field mt-1"
              value={
                form.location
              }
              onChange={(event) =>
                updateField(
                  'location',
                  event.target
                    .value
                )
              }
            />
          </div>

          <div>
            <label className="text-sm font-bold">
              Address
            </label>

            <input
              className="field mt-1"
              value={
                form.address
              }
              onChange={(event) =>
                updateField(
                  'address',
                  event.target
                    .value
                )
              }
            />
          </div>

          <div>
            <label className="text-sm font-bold">
              Image URL
            </label>

            <input
              className="field mt-1"
              value={form.image}
              onChange={(event) =>
                updateField(
                  'image',
                  event.target
                    .value
                )
              }
            />
          </div>

          <div>
            <label className="text-sm font-bold">
              Video URL
            </label>

            <input
              className="field mt-1"
              value={
                form.videoUrl
              }
              onChange={(event) =>
                updateField(
                  'videoUrl',
                  event.target
                    .value
                )
              }
            />
          </div>

          <div>
            <label className="text-sm font-bold">
              Capacity
            </label>

            <input
              className="field mt-1"
              type="number"
              min="1"
              value={
                form.capacity
              }
              onChange={(event) =>
                updateField(
                  'capacity',
                  event.target
                    .value
                )
              }
            />
          </div>
        </div>

        <label className="text-sm font-bold block mt-5">
          Description
        </label>

        <textarea
          className="field mt-1 min-h-36"
          value={
            form.description
          }
          onChange={(event) =>
            updateField(
              'description',
              event.target
                .value
            )
          }
          required
        />

        <div className="flex flex-col sm:flex-row justify-between gap-3 mt-10">
          <div>
            <h2 className="font-black text-xl">
              Ticket types
            </h2>

            <p className="text-sm text-gray-500 mt-1">
              Set ticket prices and total
              inventory.
            </p>
          </div>

          <button
            type="button"
            className="btn btn-secondary"
            onClick={
              addTicket
            }
          >
            + Add ticket type
          </button>
        </div>

        <div className="mt-4 space-y-4">
          {form.ticketTypes.map(
            (
              ticket,
              index
            ) => (
              <div
                key={index}
                className="border rounded-2xl p-4"
              >
                <div className="grid md:grid-cols-3 gap-3">
                  <div>
                    <label className="text-xs font-bold">
                      Ticket name
                    </label>

                    <input
                      className="field mt-1"
                      value={
                        ticket.name
                      }
                      onChange={(
                        event
                      ) =>
                        updateTicket(
                          index,
                          'name',
                          event
                            .target
                            .value
                        )
                      }
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold">
                      Price
                    </label>

                    <input
                      className="field mt-1"
                      type="number"
                      min="0"
                      value={
                        ticket.price
                      }
                      onChange={(
                        event
                      ) =>
                        updateTicket(
                          index,
                          'price',
                          event
                            .target
                            .value
                        )
                      }
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold">
                      Total quantity
                    </label>

                    <input
                      className="field mt-1"
                      type="number"
                      min={
                        Number(
                          ticket.sold ||
                            0
                        ) || 1
                      }
                      value={
                        ticket.quantity
                      }
                      onChange={(
                        event
                      ) =>
                        updateTicket(
                          index,
                          'quantity',
                          event
                            .target
                            .value
                        )
                      }
                    />
                  </div>
                </div>

                <div className="flex justify-between items-center mt-3">
                  <p className="text-xs text-gray-500">
                    Sold:{' '}
                    {Number(
                      ticket.sold ||
                        0
                    )}
                  </p>

                  <button
                    type="button"
                    className="text-sm text-red-600 font-bold"
                    onClick={() =>
                      removeTicket(
                        index
                      )
                    }
                    disabled={
                      form
                        .ticketTypes
                        .length ===
                      1
                    }
                  >
                    Remove
                  </button>
                </div>
              </div>
            )
          )}
        </div>

        <div className="flex flex-col sm:flex-row justify-between gap-3 mt-10">
          <div>
            <h2 className="font-black text-xl">
              Event schedule
            </h2>

            <p className="text-sm text-gray-500 mt-1">
              Add sessions, speakers, rooms and
              timings.
            </p>
          </div>

          <button
            type="button"
            className="btn btn-secondary"
            onClick={
              addSession
            }
          >
            + Add session
          </button>
        </div>

        <div className="mt-4 space-y-4">
          {!form.sessions?.length ? (
            <div className="rounded-2xl bg-gray-50 p-5 text-sm text-gray-500">
              No sessions added yet.
            </div>
          ) : (
            form.sessions.map(
              (
                session,
                index
              ) => (
                <div
                  key={index}
                  className="border rounded-2xl p-5"
                >
                  <div className="flex justify-between gap-3">
                    <h3 className="font-bold">
                      Session{' '}
                      {index + 1}
                    </h3>

                    <button
                      type="button"
                      className="text-sm text-red-600 font-bold"
                      onClick={() =>
                        removeSession(
                          index
                        )
                      }
                    >
                      Remove
                    </button>
                  </div>

                  <div className="grid md:grid-cols-2 gap-3 mt-4">
                    <input
                      className="field"
                      placeholder="Session title"
                      value={
                        session.title ||
                        ''
                      }
                      onChange={(
                        event
                      ) =>
                        updateSession(
                          index,
                          'title',
                          event
                            .target
                            .value
                        )
                      }
                    />

                    <input
                      className="field"
                      placeholder="Speaker"
                      value={
                        session.speaker ||
                        ''
                      }
                      onChange={(
                        event
                      ) =>
                        updateSession(
                          index,
                          'speaker',
                          event
                            .target
                            .value
                        )
                      }
                    />

                    <input
                      className="field"
                      placeholder="Room"
                      value={
                        session.room ||
                        ''
                      }
                      onChange={(
                        event
                      ) =>
                        updateSession(
                          index,
                          'room',
                          event
                            .target
                            .value
                        )
                      }
                    />

                    <input
                      className="field"
                      type="datetime-local"
                      value={
                        session.startTime ||
                        ''
                      }
                      onChange={(
                        event
                      ) =>
                        updateSession(
                          index,
                          'startTime',
                          event
                            .target
                            .value
                        )
                      }
                    />

                    <input
                      className="field"
                      type="datetime-local"
                      value={
                        session.endTime ||
                        ''
                      }
                      onChange={(
                        event
                      ) =>
                        updateSession(
                          index,
                          'endTime',
                          event
                            .target
                            .value
                        )
                      }
                    />
                  </div>

                  <textarea
                    className="field mt-3 min-h-24"
                    placeholder="Session description"
                    value={
                      session.description ||
                      ''
                    }
                    onChange={(
                      event
                    ) =>
                      updateSession(
                        index,
                        'description',
                        event
                          .target
                          .value
                      )
                    }
                  />
                </div>
              )
            )
          )}
        </div>

        <button
          type="submit"
          className="btn btn-primary mt-10"
          disabled={loading}
        >
          {loading
            ? 'Saving...'
            : id
              ? 'Save changes'
              : 'Submit event for approval'}
        </button>
      </form>
    </div>
  );
}

export default EventForm;