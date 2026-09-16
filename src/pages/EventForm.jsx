import { useEffect, useState } from 'react';
import {
  useNavigate,
  useParams
} from 'react-router-dom';

import api from '../services/api';

function EventForm() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [form, setForm] = useState({
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
    if (id) {
      api
        .get(`/events/${id}`)
        .then((response) =>
          setForm(response.data)
        );
    }
  }, [id]);

  const save = async (event) => {
    event.preventDefault();

    const data = {
      ...form,
      capacity: Number(form.capacity),

      ticketTypes: form.ticketTypes.map(
        (ticket) => ({
          ...ticket,
          price: Number(ticket.price),
          quantity: Number(ticket.quantity)
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

    navigate('/organizer');
  };

  const addTicket = () => {
    setForm({
      ...form,
      ticketTypes: [
        ...form.ticketTypes,
        {
          name: 'VIP',
          price: 999,
          quantity: 50
        }
      ]
    });
  };

  return (
    <div className="container py-10 max-w-4xl">
      <h1 className="text-3xl font-black">
        {id
          ? 'Edit event'
          : 'Create event'}
      </h1>

      <form
        className="card p-7 mt-6"
        onSubmit={save}
      >
        <div className="grid md:grid-cols-2 gap-4">
          {[
            ['title', 'Event title'],
            ['category', 'Category'],
            ['date', 'Date'],
            ['time', 'Time'],
            ['location', 'Location'],
            ['address', 'Address'],
            ['image', 'Image URL'],
            ['videoUrl', 'Video URL'],
            ['capacity', 'Capacity']
          ].map(([key, label]) => (
            <div key={key}>
              <label className="text-sm font-bold">
                {label}
              </label>

              <input
                className="field mt-1"
                type={
                  key === 'date'
                    ? 'date'
                    : key === 'capacity'
                      ? 'number'
                      : 'text'
                }
                value={form[key] || ''}
                onChange={(event) =>
                  setForm({
                    ...form,
                    [key]: event.target.value
                  })
                }
                required={[
                  'title',
                  'category',
                  'date'
                ].includes(key)}
              />
            </div>
          ))}
        </div>

        <label className="text-sm font-bold block mt-4">
          Description
        </label>

        <textarea
          className="field mt-1 min-h-32"
          value={form.description}
          onChange={(event) =>
            setForm({
              ...form,
              description: event.target.value
            })
          }
          required
        />

        <div className="flex justify-between mt-8">
          <h2 className="font-black text-xl">
            Ticket types
          </h2>

          <button
            type="button"
            className="btn btn-secondary"
            onClick={addTicket}
          >
            Add ticket
          </button>
        </div>

        {form.ticketTypes.map(
          (ticket, index) => (
            <div
              className="grid md:grid-cols-3 gap-3 mt-3"
              key={index}
            >
              <input
                className="field"
                value={ticket.name}
                placeholder="Ticket name"
                onChange={(event) => {
                  const updatedTickets = [
                    ...form.ticketTypes
                  ];

                  updatedTickets[index] = {
                    ...updatedTickets[index],
                    name: event.target.value
                  };

                  setForm({
                    ...form,
                    ticketTypes: updatedTickets
                  });
                }}
              />

              <input
                className="field"
                type="number"
                value={ticket.price}
                placeholder="Price"
                onChange={(event) => {
                  const updatedTickets = [
                    ...form.ticketTypes
                  ];

                  updatedTickets[index] = {
                    ...updatedTickets[index],
                    price: event.target.value
                  };

                  setForm({
                    ...form,
                    ticketTypes: updatedTickets
                  });
                }}
              />

              <input
                className="field"
                type="number"
                value={ticket.quantity}
                placeholder="Quantity"
                onChange={(event) => {
                  const updatedTickets = [
                    ...form.ticketTypes
                  ];

                  updatedTickets[index] = {
                    ...updatedTickets[index],
                    quantity: event.target.value
                  };

                  setForm({
                    ...form,
                    ticketTypes: updatedTickets
                  });
                }}
              />
            </div>
          )
        )}

        <button
          type="submit"
          className="btn btn-primary mt-8"
        >
          {id
            ? 'Save changes'
            : 'Submit event'}
        </button>
      </form>
    </div>
  );
}

export default EventForm;