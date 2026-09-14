# EventHub - Frontend

EventHub is an online event management platform frontend built with React, Vite, TailwindCSS and Axios.

The frontend communicates with the EventHub Node.js/Express backend deployed on Render.

## Features

### User Features

- User registration
- User login
- Role-based authentication
- User dashboard
- View upcoming events
- View purchased tickets
- View registration details
- Search events
- Filter events
- View event details
- Manage registrations
- Logout

### Organizer Features

- Organizer login
- Organizer dashboard
- Create events
- Edit events
- Delete events
- Manage event sessions
- View ticket sales
- View revenue
- View attendance information
- Event analytics
- Charts and reports

### Admin Features

- Dedicated admin login
- Admin dashboard
- Event approval/rejection
- User management
- Transaction monitoring
- Reports
- Event analytics
- Support management

## Technologies

- React
- Vite
- TailwindCSS
- React Router
- Axios
- Recharts
- JavaScript

## Project Structure

```text
client/
├── public/
├── src/
│   ├── components/
│   │   ├── AuthBox.jsx
│   │   ├── EventCard.jsx
│   │   ├── Feature.jsx
│   │   ├── Layout.jsx
│   │   ├── RequireLogin.jsx
│   │   └── Stat.jsx
│   │
│   ├── context/
│   │   └── AuthContext.jsx
│   │
│   ├── pages/
│   │   ├── Admin.jsx
│   │   ├── AdminLogin.jsx
│   │   ├── Dashboard.jsx
│   │   ├── EventDetails.jsx
│   │   ├── EventForm.jsx
│   │   ├── Events.jsx
│   │   ├── Home.jsx
│   │   ├── Login.jsx
│   │   ├── Organizer.jsx
│   │   └── Register.jsx
│   │
│   ├── services/
│   │   └── api.js
│   │
│   ├── utils/
│   │   └── format.js
│   │
│   ├── App.jsx
│   ├── main.jsx
│   └── index.css
│
├── .env
├── .gitignore
├── index.html
├── package.json
└── vite.config.js