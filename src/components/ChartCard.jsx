import { ResponsiveContainer, BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, PieChart, Pie, Cell, Legend } from 'recharts';

export default function ChartCard({ title, description, type='bar', data=[], dataKey='value', xKey='name', height=280, prefix='', suffix='' }) {
  const tooltip = {
    formatter: (value) => [`${prefix}${Number(value).toLocaleString()}${suffix}`, title],
  };
  return <div className="card p-5">
    <h3 className="font-black text-lg">{title}</h3>
    {description && <p className="text-sm text-gray-500 mt-1">{description}</p>}
    <div className="mt-4" style={{ width:'100%', height }}>
      <ResponsiveContainer>
        {type === 'line' ? <LineChart data={data}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey={xKey} /><YAxis /><Tooltip formatter={(v)=>[`${prefix}${Number(v).toLocaleString()}${suffix}`, title]} /><Line type="monotone" dataKey={dataKey} stroke="#6d5dfc" strokeWidth={3} dot={{ r: 3 }} /></LineChart>
        : type === 'pie' ? <PieChart><Pie data={data} dataKey={dataKey} nameKey={xKey} cx="50%" cy="50%" outerRadius={90} label>{data.map((_,i)=><Cell key={i} fill={['#6d5dfc','#22c55e','#f59e0b','#ef4444','#06b6d4','#8b5cf6'][i%6]} />)}</Pie><Tooltip formatter={(v)=>[`${prefix}${Number(v).toLocaleString()}${suffix}`, 'Value']} /><Legend /></PieChart>
        : <BarChart data={data}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey={xKey} /><YAxis /><Tooltip formatter={tooltip.formatter} /><Bar dataKey={dataKey} fill="#6d5dfc" radius={[6,6,0,0]} /></BarChart>}
      </ResponsiveContainer>
    </div>
  </div>;
}
