import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Legend
} from 'recharts';

export default function ChartCard({
  title,
  description,
  type = 'bar',
  data = [],
  dataKey = 'value',
  xKey = 'name',
  height = 300,
  prefix = '',
  suffix = ''
}) {
  const safeData = Array.isArray(data)
    ? data
    : [];

  const formatValue = (value) => {
    const number = Number(value);

    if (!Number.isFinite(number)) {
      return `${prefix}0${suffix}`;
    }

    return `${prefix}${number.toLocaleString()}${suffix}`;
  };

  const tooltipFormatter = (value) => [
    formatValue(value),
    title
  ];

  if (!safeData.length) {
    return (
      <div className="card p-5">

        <h3 className="font-black text-lg">
          {title}
        </h3>

        {description && (
          <p className="text-sm text-gray-500 mt-1">
            {description}
          </p>
        )}

        <div
          className="flex items-center justify-center text-gray-400 text-sm"
          style={{ height }}
        >
          No data available yet.
        </div>

      </div>
    );
  }

  return (
    <div className="card p-5">

      <h3 className="font-black text-lg">
        {title}
      </h3>

      {description && (
        <p className="text-sm text-gray-500 mt-1">
          {description}
        </p>
      )}

      <div
        className="mt-4"
        style={{
          width: '100%',
          height
        }}
      >

        <ResponsiveContainer
          width="100%"
          height="100%"
        >

          {type === 'line' ? (

            <LineChart
              data={safeData}
              margin={{
                top: 10,
                right: 20,
                left: 10,
                bottom: 10
              }}
            >

              <CartesianGrid
                strokeDasharray="3 3"
              />

              <XAxis
                dataKey={xKey}
                tick={{ fontSize: 12 }}
              />

              <YAxis
                allowDecimals={false}
                tick={{ fontSize: 12 }}
              />

              <Tooltip
                formatter={tooltipFormatter}
              />

              <Line
                type="monotone"
                dataKey={dataKey}
                stroke="#6d5dfc"
                strokeWidth={3}
                dot={{ r: 4 }}
                activeDot={{ r: 6 }}
              />

            </LineChart>

          ) : type === 'pie' ? (

            <PieChart>

              <Pie
                data={safeData}
                dataKey={dataKey}
                nameKey={xKey}
                cx="50%"
                cy="50%"
                outerRadius={95}
                label
              />

              <Tooltip
                formatter={(value) => [
                  formatValue(value),
                  'Value'
                ]}
              />

              <Legend />

            </PieChart>

          ) : (

            <BarChart
              data={safeData}
              margin={{
                top: 10,
                right: 20,
                left: 10,
                bottom: 25
              }}
            >

              <CartesianGrid
                strokeDasharray="3 3"
              />

              <XAxis
                dataKey={xKey}
                tick={{ fontSize: 12 }}
                interval={0}
              />

              <YAxis
                allowDecimals={false}
                tick={{ fontSize: 12 }}
              />

              <Tooltip
                formatter={tooltipFormatter}
              />

              <Bar
                dataKey={dataKey}
                fill="#6d5dfc"
                radius={[
                  6,
                  6,
                  0,
                  0
                ]}
                minPointSize={5}
              />

            </BarChart>

          )}

        </ResponsiveContainer>

      </div>

    </div>
  );
}