export default function Feature({
  icon,
  title,
  text
}) {
  return (
    <div className="card p-6">
      <div className="w-11 h-11 rounded-xl bg-[#eeeaff] text-brand grid place-items-center">
        {icon}
      </div>

      <h3 className="font-bold text-xl mt-4">
        {title}
      </h3>

      <p className="text-gray-500 mt-2">
        {text}
      </p>
    </div>
  );
}