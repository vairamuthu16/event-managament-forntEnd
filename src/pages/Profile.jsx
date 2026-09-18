import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

import api from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function Profile() {
  const { user, login } = useAuth();

  const [profile, setProfile] = useState({
    name: '',
    email: '',
    role: '',
    avatar: ''
  });

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [editing, setEditing] = useState(false);

  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [support, setSupport] = useState({
    subject: '',
    message: '',
    category: 'General'
  });

  const [tickets, setTickets] = useState([]);

  const [feedback, setFeedback] = useState({});
  const [feedbackComment, setFeedbackComment] = useState({});
  const [busy, setBusy] = useState({});

  // ============================================================
  // LOAD PROFILE
  // ============================================================

  const loadProfile = async () => {
    try {
      setLoading(true);

      const response = await api.get('/users/me');

      setProfile({
        name: response.data?.name || '',
        email: response.data?.email || '',
        role: response.data?.role || '',
        avatar: response.data?.avatar || ''
      });
    } catch (error) {
      console.error('Failed to load profile:', error);

      setError(
        error.response?.data?.message ||
          'Failed to load your profile.'
      );
    } finally {
      setLoading(false);
    }
  };

  // ============================================================
  // LOAD SUPPORT TICKETS
  // ============================================================

  const loadTickets = async () => {
    try {
      const response = await api.get('/support/mine');

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

  // ============================================================
  // INITIAL LOAD
  // ============================================================

  useEffect(() => {
    loadProfile();
    loadTickets();
  }, []);

  // ============================================================
  // PROFILE INPUT
  // ============================================================

  const updateProfile = (field, value) => {
    setProfile((current) => ({
      ...current,
      [field]: value
    }));

    setMsg('');
    setError('');
  };

  // ============================================================
  // START EDITING
  // ============================================================

  const startEditing = () => {
    setMsg('');
    setError('');
    setEditing(true);
  };

  // ============================================================
  // CANCEL EDITING
  // ============================================================

  const cancelEditing = () => {
    setProfile({
      name: user?.name || '',
      email: user?.email || '',
      role: user?.role || '',
      avatar: user?.avatar || ''
    });

    setPassword('');
    setConfirmPassword('');

    setMsg('');
    setError('');
    setEditing(false);
  };

  // ============================================================
  // SAVE PROFILE
  // ============================================================

  const saveProfile = async (event) => {
    event.preventDefault();

    setMsg('');
    setError('');

    const name = profile.name.trim();

    if (!name) {
      setError('Full name is required.');
      return;
    }

    if (name.length < 2) {
      setError('Name must contain at least 2 characters.');
      return;
    }

    if (password && password.length < 6) {
      setError(
        'New password must be at least 6 characters.'
      );
      return;
    }

    if (password && password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    try {
      setSaving(true);

      const payload = {
        name,
        avatar: profile.avatar || ''
      };

      if (password) {
        payload.password = password;
      }

      const response = await api.put(
        '/users/me',
        payload
      );

      const updatedUser = {
        ...profile,
        ...response.data
      };

      setProfile({
        name: updatedUser.name || '',
        email: updatedUser.email || '',
        role: updatedUser.role || '',
        avatar: updatedUser.avatar || ''
      });

      /*
       * Keep AuthContext/localStorage synchronized
       * with the updated profile.
       */
      const token = localStorage.getItem('token');

      if (token && response.data) {
        login({
          token,
          user: {
            ...(user || {}),
            ...response.data
          }
        });
      }

      setPassword('');
      setConfirmPassword('');
      setEditing(false);

      setMsg(
        'Profile updated successfully.'
      );
    } catch (error) {
      console.error(
        'Profile update error:',
        error
      );

      setError(
        error.response?.data?.message ||
          'Failed to update your profile.'
      );
    } finally {
      setSaving(false);
    }
  };

  // ============================================================
  // CREATE SUPPORT TICKET
  // ============================================================

  const sendSupport = async (event) => {
    event.preventDefault();

    setMsg('');
    setError('');

    const subject = support.subject.trim();
    const message = support.message.trim();

    if (!subject) {
      setError('Support subject is required.');
      return;
    }

    if (!message) {
      setError('Please describe your issue.');
      return;
    }

    try {
      setBusy((current) => ({
        ...current,
        support: true
      }));

      const response = await api.post(
        '/support',
        {
          subject,
          message,
          category: support.category
        }
      );

      setTickets((current) => [
        response.data,
        ...current
      ]);

      setSupport({
        subject: '',
        message: '',
        category: 'General'
      });

      setMsg(
        'Support request submitted successfully.'
      );
    } catch (error) {
      console.error(
        'Support request error:',
        error
      );

      setError(
        error.response?.data?.message ||
          'Failed to submit support request.'
      );
    } finally {
      setBusy((current) => ({
        ...current,
        support: false
      }));
    }
  };

  // ============================================================
  // REOPEN SUPPORT TICKET
  // ============================================================

  const reopenTicket = async (ticketId) => {
    setMsg('');
    setError('');

    setBusy((current) => ({
      ...current,
      [ticketId]: true
    }));

    try {
      const response = await api.patch(
        `/support/${ticketId}/reopen`
      );

      setTickets((current) =>
        current.map((ticket) =>
          ticket._id === ticketId
            ? response.data
            : ticket
        )
      );

      setMsg(
        'Support ticket reopened.'
      );
    } catch (error) {
      console.error(
        'Reopen ticket error:',
        error
      );

      setError(
        error.response?.data?.message ||
          'Failed to reopen support ticket.'
      );
    } finally {
      setBusy((current) => ({
        ...current,
        [ticketId]: false
      }));
    }
  };

  // ============================================================
  // SUPPORT FEEDBACK
  // ============================================================

  const submitFeedback = async (ticketId) => {
    setMsg('');
    setError('');

    const rating = Number(
      feedback[ticketId]
    );

    if (
      !Number.isFinite(rating) ||
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
      const response = await api.patch(
        `/support/${ticketId}/feedback`,
        {
          rating,
          comment:
            feedbackComment[ticketId] || ''
        }
      );

      setTickets((current) =>
        current.map((ticket) =>
          ticket._id === ticketId
            ? response.data
            : ticket
        )
      );

      setMsg(
        'Support feedback submitted successfully.'
      );
    } catch (error) {
      console.error(
        'Support feedback error:',
        error
      );

      setError(
        error.response?.data?.message ||
          'Failed to submit support feedback.'
      );
    } finally {
      setBusy((current) => ({
        ...current,
        [`feedback-${ticketId}`]: false
      }));
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
            Loading profile...
          </p>
        </div>
      </div>
    );
  }

  // ============================================================
  // ROLE LABEL
  // ============================================================

  const roleLabel = {
    attendee: 'Attendee',
    organizer: 'Organizer',
    admin: 'Administrator'
  }[profile.role] || profile.role;

  // ============================================================
  // PAGE
  // ============================================================

  return (
    <div className="container py-10 max-w-5xl">

      {/* PAGE HEADER */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">

        <div>
          <h1 className="text-3xl font-black">
            Profile & settings
          </h1>

          <p className="text-gray-500 mt-1">
            Manage your account information and support requests.
          </p>
        </div>

        {!editing && (
          <button
            type="button"
            className="btn btn-primary"
            onClick={startEditing}
          >
            Edit profile
          </button>
        )}

      </div>

      {/* SUCCESS MESSAGE */}
      {msg && (
        <div className="bg-green-50 border border-green-200 text-green-700 rounded-xl p-4 mt-5">
          {msg}
        </div>
      )}

      {/* ERROR MESSAGE */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-4 mt-5">
          {error}
        </div>
      )}

      <div className="grid lg:grid-cols-2 gap-6 mt-6">

        {/* ======================================================
            PROFILE CARD
        ====================================================== */}

        <form
          className="card p-6"
          onSubmit={saveProfile}
        >
          <div className="flex items-center justify-between">

            <div>
              <h2 className="font-black text-xl">
                Profile
              </h2>

              <p className="text-sm text-gray-500 mt-1">
                Your account information
              </p>
            </div>

            {!editing && (
              <span className="badge">
                {roleLabel}
              </span>
            )}

          </div>

          {/* AVATAR */}
          {profile.avatar && (
            <div className="mt-5">
              <img
                src={profile.avatar}
                alt="Profile"
                className="w-20 h-20 rounded-full object-cover border"
              />
            </div>
          )}

          {/* NAME */}
          <label className="text-sm font-bold block mt-5">
            Full name
          </label>

          <input
            className="field mt-1"
            value={profile.name}
            disabled={!editing}
            onChange={(event) =>
              updateProfile(
                'name',
                event.target.value
              )
            }
          />

          {/* EMAIL */}
          <label className="text-sm font-bold block mt-4">
            Email address
          </label>

          <input
            className="field mt-1"
            type="email"
            value={profile.email}
            disabled
          />

          <p className="text-xs text-gray-500 mt-1">
            Email address cannot be changed from this page.
          </p>

          {/* ROLE */}
          <label className="text-sm font-bold block mt-4">
            Account type
          </label>

          <input
            className="field mt-1"
            value={roleLabel}
            disabled
          />

          {/* AVATAR */}
          {editing && (
            <>
              <label className="text-sm font-bold block mt-4">
                Profile image URL
              </label>

              <input
                className="field mt-1"
                type="url"
                placeholder="https://example.com/photo.jpg"
                value={profile.avatar}
                onChange={(event) =>
                  updateProfile(
                    'avatar',
                    event.target.value
                  )
                }
              />
            </>
          )}

          {/* PASSWORD */}
          {editing && (
            <>
              <label className="text-sm font-bold block mt-5">
                New password
              </label>

              <input
                className="field mt-1"
                type="password"
                placeholder="Leave blank to keep current password"
                value={password}
                onChange={(event) =>
                  setPassword(
                    event.target.value
                  )
                }
              />

              <label className="text-sm font-bold block mt-4">
                Confirm new password
              </label>

              <input
                className="field mt-1"
                type="password"
                placeholder="Enter the new password again"
                value={confirmPassword}
                onChange={(event) =>
                  setConfirmPassword(
                    event.target.value
                  )
                }
              />
            </>
          )}

          {/* ACTIONS */}
          {editing && (
            <div className="flex flex-wrap gap-3 mt-6">

              <button
                type="submit"
                className="btn btn-primary"
                disabled={saving}
              >
                {saving
                  ? 'Saving...'
                  : 'Save changes'}
              </button>

              <button
                type="button"
                className="btn btn-secondary"
                disabled={saving}
                onClick={cancelEditing}
              >
                Cancel
              </button>

            </div>
          )}

        </form>

        {/* ======================================================
            SUPPORT FORM
        ====================================================== */}

        <form
          className="card p-6"
          onSubmit={sendSupport}
        >
          <h2 className="font-black text-xl">
            Contact support
          </h2>

          <p className="text-sm text-gray-500 mt-1">
            Create a support ticket for an issue or question.
          </p>

          {/* CATEGORY */}
          <label className="text-sm font-bold block mt-5">
            Category
          </label>

          <select
            className="field mt-1"
            value={support.category}
            onChange={(event) =>
              setSupport((current) => ({
                ...current,
                category:
                  event.target.value
              }))
            }
          >
            <option value="General">
              General
            </option>

            <option value="Payment">
              Payment
            </option>

            <option value="Ticket">
              Ticket
            </option>

            <option value="Event">
              Event
            </option>

            <option value="Account">
              Account
            </option>

            <option value="Technical">
              Technical
            </option>
          </select>

          {/* SUBJECT */}
          <label className="text-sm font-bold block mt-4">
            Subject
          </label>

          <input
            className="field mt-1"
            placeholder="What do you need help with?"
            value={support.subject}
            onChange={(event) =>
              setSupport((current) => ({
                ...current,
                subject:
                  event.target.value
              }))
            }
            required
          />

          {/* MESSAGE */}
          <label className="text-sm font-bold block mt-4">
            Message
          </label>

          <textarea
            className="field mt-1 min-h-32"
            placeholder="Describe your issue..."
            value={support.message}
            onChange={(event) =>
              setSupport((current) => ({
                ...current,
                message:
                  event.target.value
              }))
            }
            required
          />

          <button
            type="submit"
            className="btn btn-secondary mt-4"
            disabled={busy.support}
          >
            {busy.support
              ? 'Submitting...'
              : 'Create support ticket'}
          </button>

        </form>

      </div>

      {/* ========================================================
          SUPPORT REQUESTS
      ======================================================== */}

      <div className="card p-6 mt-6">

        <h2 className="font-black text-xl">
          My support requests
        </h2>

        <p className="text-sm text-gray-500 mt-1">
          Track your submitted support tickets and admin responses.
        </p>

        <div className="mt-5 space-y-5">

          {tickets.length === 0 ? (
            <div className="border rounded-xl p-5 text-gray-500">
              You have no support requests yet.
            </div>
          ) : (
            tickets.map((ticket) => (
              <div
                className="border rounded-xl p-5"
                key={ticket._id}
              >

                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">

                  <div>
                    <h3 className="font-black text-lg">
                      {ticket.subject}
                    </h3>

                    <p className="text-sm text-gray-500 mt-1">
                      {ticket.category || 'General'}
                    </p>
                  </div>

                  <span className="badge">
                    {ticket.status}
                  </span>

                </div>

                <p className="text-gray-600 mt-4 whitespace-pre-line">
                  {ticket.message}
                </p>

                {/* ADMIN RESPONSE */}
                {ticket.adminReply && (
                  <div className="bg-green-50 border border-green-200 rounded-xl p-4 mt-4">

                    <p className="text-sm font-bold text-green-700">
                      Admin response
                    </p>

                    <p className="text-green-800 mt-1 whitespace-pre-line">
                      {ticket.adminReply}
                    </p>

                  </div>
                )}

                {/* REOPEN */}
                {ticket.status === 'resolved' && (
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
                {ticket.status === 'resolved' && (
                  <div className="border-t mt-5 pt-5">

                    <h3 className="font-black">
                      Support feedback
                    </h3>

                    {ticket.feedback?.rating ? (
                      <div className="mt-2">

                        <p className="text-yellow-600 text-xl">
                          {'★'.repeat(
                            Number(
                              ticket.feedback.rating
                            )
                          )}

                          {'☆'.repeat(
                            5 -
                            Number(
                              ticket.feedback.rating
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
                          className="field mt-1 max-w-48"
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

      {/* BACK LINK */}
      <div className="mt-6">
        <Link
          className="text-brand font-bold"
          to={
            profile.role === 'admin'
              ? '/admin'
              : profile.role === 'organizer'
                ? '/organizer'
                : '/dashboard'
          }
        >
          ← Back to dashboard
        </Link>
      </div>

    </div>
  );
}
