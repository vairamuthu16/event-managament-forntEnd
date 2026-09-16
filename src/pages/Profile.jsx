import { useEffect, useState } from 'react';

import api from '../services/api';

import { Link } from 'react-router-dom';


export default function Profile() {

  const [p, setP] = useState({
    name: '',
    email: '',
    role: '',
    avatar: ''
  });

  const [password, setPassword] =
    useState('');

  const [msg, setMsg] =
    useState('');

  const [error, setError] =
    useState('');

  const [support, setSupport] =
    useState({
      subject: '',
      message: ''
    });

  const [tickets, setTickets] =
    useState([]);

  const [feedback, setFeedback] =
    useState({});

  const [feedbackComment, setFeedbackComment] =
    useState({});

  const [busy, setBusy] =
    useState({});


  const loadTickets = async () => {
    try {
      const response =
        await api.get('/support/mine');

      setTickets(
        Array.isArray(response.data)
          ? response.data
          : []
      );

    } catch (error) {
      console.error(
        'Failed to load support tickets:',
        error
      );
    }
  };


  useEffect(() => {

    api
      .get('/users/me')
      .then((response) =>
        setP(response.data)
      )
      .catch((error) =>
        console.error(
          'Failed to load profile:',
          error
        )
      );

    loadTickets();

  }, []);


  const save = async (event) => {
    event.preventDefault();

    setMsg('');
    setError('');

    try {

      const { data } =
        await api.put(
          '/users/me',
          {
            name: p.name,
            avatar: p.avatar,
            password
          }
        );

      setP({
        ...p,
        ...data
      });

      setPassword('');

      setMsg(
        'Profile updated successfully.'
      );

    } catch (error) {

      setError(
        error.response?.data?.message ||
        'Failed to update profile'
      );
    }
  };


  const send = async (event) => {
    event.preventDefault();

    setMsg('');
    setError('');

    try {

      const { data } =
        await api.post(
          '/support',
          support
        );

      setTickets(
        (current) => [
          data,
          ...current
        ]
      );

      setSupport({
        subject: '',
        message: ''
      });

      setMsg(
        'Support request submitted.'
      );

    } catch (error) {

      setError(
        error.response?.data?.message ||
        'Failed to submit support request'
      );
    }
  };


  const reopenTicket = async (
    ticketId
  ) => {

    setBusy((current) => ({
      ...current,
      [ticketId]: true
    }));

    try {

      const { data } =
        await api.patch(
          `/support/${ticketId}/reopen`
        );

      setTickets(
        (current) =>
          current.map((ticket) =>
            ticket._id === ticketId
              ? data
              : ticket
          )
      );

      setMsg(
        'Support ticket reopened.'
      );

    } catch (error) {

      setError(
        error.response?.data?.message ||
        'Failed to reopen ticket'
      );

    } finally {

      setBusy((current) => ({
        ...current,
        [ticketId]: false
      }));
    }
  };


  const submitFeedback = async (
    ticketId
  ) => {

    const rating =
      Number(feedback[ticketId]);

    if (
      !rating ||
      rating < 1 ||
      rating > 5
    ) {
      setError(
        'Please select a rating from 1 to 5.'
      );
      return;
    }

    setBusy((current) => ({
      ...current,
      [`feedback-${ticketId}`]: true
    }));

    try {

      const { data } =
        await api.patch(
          `/support/${ticketId}/feedback`,
          {
            rating,
            comment:
              feedbackComment[
                ticketId
              ] || ''
          }
        );

      setTickets(
        (current) =>
          current.map((ticket) =>
            ticket._id === ticketId
              ? data
              : ticket
          )
      );

      setMsg(
        'Support feedback submitted.'
      );

    } catch (error) {

      setError(
        error.response?.data?.message ||
        'Failed to submit feedback'
      );

    } finally {

      setBusy((current) => ({
        ...current,
        [`feedback-${ticketId}`]:
          false
      }));
    }
  };


  return (
    <div className="container py-10 max-w-5xl">

      <h1 className="text-3xl font-black">
        Profile & settings
      </h1>


      {error && (
        <p className="text-red-600 text-sm mt-4">
          {error}
        </p>
      )}

      {msg && (
        <p className="text-green-600 text-sm mt-4">
          {msg}
        </p>
      )}


      <div className="grid lg:grid-cols-2 gap-5 mt-6">

        {/* PROFILE */}

        <form
          className="card p-6"
          onSubmit={save}
        >

          <h2 className="font-black text-xl">
            Profile
          </h2>


          <label className="text-sm font-bold block mt-4">
            Name
          </label>

          <input
            className="field mt-1"
            value={p.name}
            onChange={(event) =>
              setP({
                ...p,
                name:
                  event.target.value
              })
            }
          />


          <label className="text-sm font-bold block mt-4">
            Email
          </label>

          <input
            className="field mt-1"
            value={p.email}
            disabled
          />


          <label className="text-sm font-bold block mt-4">
            New password
          </label>

          <input
            className="field mt-1"
            type="password"
            value={password}
            onChange={(event) =>
              setPassword(
                event.target.value
              )
            }
            placeholder="Leave blank to keep current password"
          />


          <button className="btn btn-primary mt-5">
            Save settings
          </button>

        </form>


        {/* CONTACT SUPPORT */}

        <form
          className="card p-6"
          onSubmit={send}
        >

          <h2 className="font-black text-xl">
            Contact support
          </h2>


          <input
            className="field mt-4"
            placeholder="Subject"
            value={support.subject}
            onChange={(event) =>
              setSupport({
                ...support,
                subject:
                  event.target.value
              })
            }
            required
          />


          <textarea
            className="field mt-3 min-h-32"
            placeholder="Describe your issue"
            value={support.message}
            onChange={(event) =>
              setSupport({
                ...support,
                message:
                  event.target.value
              })
            }
            required
          />


          <button className="btn btn-secondary mt-4">
            Submit inquiry
          </button>


          <Link
            className="text-brand font-bold block mt-4"
            to="/dashboard"
          >
            ← Back to dashboard
          </Link>

        </form>

      </div>


      {/* SUPPORT TICKETS */}

      <div className="card p-6 mt-5">

        <h2 className="font-black text-xl">
          My support requests
        </h2>


        <div className="mt-5 space-y-5">

          {tickets.length === 0 ? (

            <p className="text-gray-500">
              You have no support requests.
            </p>

          ) : (

            tickets.map((ticket) => (

              <div
                className="border rounded-xl p-5"
                key={ticket._id}
              >

                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">

                  <div>

                    <b className="text-lg">
                      {ticket.subject}
                    </b>

                    <p className="text-sm text-gray-500 mt-1">
                      {ticket.category ||
                        'General'}
                    </p>

                  </div>


                  <span className="badge">
                    {ticket.status}
                  </span>

                </div>


                <p className="text-gray-600 mt-4">
                  {ticket.message}
                </p>


                {/* ADMIN REPLY */}

                {ticket.adminReply && (

                  <div className="bg-green-50 border border-green-200 rounded-xl p-4 mt-4">

                    <p className="text-sm font-bold text-green-700">
                      Admin response
                    </p>

                    <p className="text-green-800 mt-1">
                      {ticket.adminReply}
                    </p>

                  </div>

                )}


                {/* REOPEN */}

                {ticket.status ===
                  'resolved' && (

                  <div className="mt-4">

                    <button
                      type="button"
                      className="btn btn-secondary"
                      disabled={
                        busy[ticket._id]
                      }
                      onClick={() =>
                        reopenTicket(
                          ticket._id
                        )
                      }
                    >
                      {busy[ticket._id]
                        ? 'Reopening...'
                        : 'Reopen ticket'}
                    </button>

                  </div>

                )}


                {/* FEEDBACK */}

                {ticket.status ===
                  'resolved' && (

                  <div className="border-t mt-5 pt-5">

                    <h3 className="font-black">
                      Support feedback
                    </h3>


                    {ticket.feedback?.rating ? (

                      <div className="mt-2">

                        <p className="text-yellow-600 text-xl">

                          {'★'.repeat(
                            Number(
                              ticket.feedback
                                .rating
                            )
                          )}

                          {'☆'.repeat(
                            5 -
                            Number(
                              ticket.feedback
                                .rating
                            )
                          )}

                        </p>


                        {ticket.feedback.comment && (

                          <p className="text-sm text-gray-600 mt-1">
                            {ticket.feedback.comment}
                          </p>

                        )}

                      </div>

                    ) : (

                      <div className="mt-3">

                        <label className="text-sm font-bold block">
                          Rating
                        </label>

                        <select
                          className="field mt-1 max-w-40"
                          value={
                            feedback[
                              ticket._id
                            ] || ''
                          }
                          onChange={(event) =>
                            setFeedback(
                              (current) => ({
                                ...current,
                                [ticket._id]:
                                  event.target.value
                              })
                            )
                          }
                        >

                          <option value="">
                            Select rating
                          </option>

                          <option value="5">
                            5 — Excellent
                          </option>

                          <option value="4">
                            4 — Good
                          </option>

                          <option value="3">
                            3 — Average
                          </option>

                          <option value="2">
                            2 — Poor
                          </option>

                          <option value="1">
                            1 — Very poor
                          </option>

                        </select>


                        <textarea
                          className="field mt-3 min-h-24"
                          placeholder="Optional feedback"
                          value={
                            feedbackComment[
                              ticket._id
                            ] || ''
                          }
                          onChange={(event) =>
                            setFeedbackComment(
                              (current) => ({
                                ...current,
                                [ticket._id]:
                                  event.target.value
                              })
                            )
                          }
                        />


                        <button
                          type="button"
                          className="btn btn-primary mt-3"
                          disabled={
                            busy[
                              `feedback-${ticket._id}`
                            ]
                          }
                          onClick={() =>
                            submitFeedback(
                              ticket._id
                            )
                          }
                        >
                          {busy[
                            `feedback-${ticket._id}`
                          ]
                            ? 'Submitting...'
                            : 'Submit feedback'}
                        </button>

                      </div>

                    )}

                  </div>

                )}

              </div>

            ))

          )}

        </div>

      </div>

    </div>
  );
}