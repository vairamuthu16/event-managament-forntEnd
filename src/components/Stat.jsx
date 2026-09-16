export default function Stat({
  title,
  value
}) {
  return (
    <div className="card p-5">
      <p className="text-gray-500">
        {title}
      </p>

      <b className="text-3xl block mt-2">
        {value}
      </b>
    </div>
  );
}