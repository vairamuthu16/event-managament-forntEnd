import {
  LogIn,
  UserPlus
} from 'lucide-react';

import { Link } from 'react-router-dom';

export default function RequireLogin({
  title = 'Please sign in',
  message = 'You need to sign in to access this page.'
}) {
  return (
    <div className="container py-16">

      <div className="max-w-lg mx-auto card p-8 text-center">

        <div className="w-16 h-16 mx-auto rounded-2xl bg-brand/10 flex items-center justify-center">

          <LogIn
            size={32}
            className="text-brand"
          />

        </div>

        <h1 className="text-3xl font-black mt-6">
          {title}
        </h1>

        <p className="text-gray-500 mt-3">
          {message}
        </p>

        <div className="grid gap-3 mt-7">

          <Link
            to="/login"
            className="btn btn-primary w-full inline-flex items-center justify-center gap-2"
          >
            <LogIn size={18} />
            Sign in
          </Link>

          <Link
            to="/register"
            className="btn btn-secondary w-full inline-flex items-center justify-center gap-2"
          >
            <UserPlus size={18} />
            Create an account
          </Link>

        </div>

      </div>

    </div>
  );
}