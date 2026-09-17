export default function TicketAvailability({
  ticket
}) {
  const total =
    Number(ticket?.quantity) || 0;

  const sold =
    Number(ticket?.sold) || 0;

  const available = Math.max(
    total - sold,
    0
  );

  const percentage =
    total > 0
      ? Math.round(
          (sold / total) * 100
        )
      : 0;

  return (
    <div className="rounded-2xl border bg-gray-50 p-4 mt-4">
      <div className="grid grid-cols-3 gap-3 text-center">
        <div>
          <p className="text-xs text-gray-500">
            Total
          </p>

          <p className="font-black text-lg mt-1">
            {total}
          </p>
        </div>

        <div>
          <p className="text-xs text-gray-500">
            Sold
          </p>

          <p className="font-black text-lg mt-1">
            {sold}
          </p>
        </div>

        <div>
          <p className="text-xs text-gray-500">
            Available
          </p>

          <p
            className={`font-black text-lg mt-1 ${
              available === 0
                ? 'text-red-600'
                : available <= 10
                  ? 'text-orange-600'
                  : 'text-green-600'
            }`}
          >
            {available}
          </p>
        </div>
      </div>

      <div className="mt-4">
        <div className="flex justify-between text-xs text-gray-500">
          <span>
            {percentage}% sold
          </span>

          <span>
            {available} remaining
          </span>
        </div>

        <div className="h-2 bg-gray-200 rounded-full mt-2 overflow-hidden">
          <div
            className="h-full bg-brand rounded-full transition-all"
            style={{
              width: `${Math.min(
                percentage,
                100
              )}%`
            }}
          />
        </div>
      </div>
    </div>
  );
}