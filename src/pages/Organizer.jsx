import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, BarChart3, Download } from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { money } from '../utils/format';
import Stat from '../components/Stat';
import ChartCard from '../components/ChartCard';
import RoleGuard from '../components/RoleGuard';

function OrganizerContent(){
 const [a,setA]=useState(null); const [loading,setLoading]=useState(true);
 const load=()=>{setLoading(true);api.get('/analytics/organizer').then(r=>setA(r.data)).finally(()=>setLoading(false));}; useEffect(load,[]);
 if(loading)return <div className="container py-16">Loading organizer analytics...</div>;
 return <div className="container py-10"><div className="flex flex-col md:flex-row md:items-center justify-between gap-4"><div><span className="badge">Organizer portal</span><h1 className="text-3xl font-black mt-2">Organizer dashboard</h1><p className="text-gray-500">Track ticket sales, attendance, revenue and event performance.</p></div><div className="flex gap-2"><Link className="btn btn-secondary" to="/events/new"><Plus size={17}/> New event</Link></div></div>
 <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4 mt-7"><Stat title="Events" value={a.totalEvents}/><Stat title="Tickets sold" value={a.ticketsSold}/><Stat title="Revenue" value={money(a.revenue)}/><Stat title="Attendance" value={`${a.attendanceRate}%`}/><Stat title="Avg. rating" value={a.averageRating||'—'}/></div>
 <div className="grid lg:grid-cols-2 gap-5 mt-7"><ChartCard title="Ticket sales by event" data={a.salesByEvent} /><ChartCard title="Revenue by event" data={a.revenueByEvent} prefix="₹" /><ChartCard title="Revenue trend" type="line" data={a.revenueTrend} prefix="₹" /></div>
 <div className="card p-5 mt-7"><div className="flex items-center justify-between"><div><h2 className="font-black text-xl">Event performance</h2><p className="text-sm text-gray-500">Approval status, sales and attendance.</p></div></div><div className="overflow-auto mt-4"><table className="w-full text-left"><thead><tr className="border-b"><th className="py-3">Event</th><th>Status</th><th>Sold</th><th>Attended</th><th>Revenue</th><th>Action</th></tr></thead><tbody>{a.events.map(e=><tr className="border-b" key={e.id}><td className="py-3 font-bold">{e.title}</td><td><span className="badge">{e.status}</span></td><td>{e.sold}</td><td>{e.attended}</td><td>{money(e.revenue)}</td><td><Link className="text-brand font-bold" to={`/events/${e.id}/edit`}>Edit</Link></td></tr>)}</tbody></table></div></div></div>
}
export default function Organizer(){return <RoleGuard roles={['organizer','admin']}><OrganizerContent/></RoleGuard>}
