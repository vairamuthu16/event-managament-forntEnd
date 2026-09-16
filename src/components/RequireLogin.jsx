import { Link } from 'react-router-dom';

export default function RequireLogin() {
  return (
    <div className="container py-20 text-center">
      <h2 className="text-2xl font-black">
        Please sign in
      </h2>

      <Link
        className="btn btn-primary mt-4"
        to="/login"
      >
        Sign in
      </Link>
    </div>
  );
}