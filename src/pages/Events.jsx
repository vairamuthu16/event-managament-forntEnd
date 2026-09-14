import { useEffect, useState } from 'react';
import { Search } from 'lucide-react';
import api from '../services/api';
import EventCard from '../components/EventCard';

function Events(){const [events,setEvents]=useState([]),[f,setF]=useState({q:'',category:'',location:'',minPrice:'',maxPrice:''});const load=async()=>setEvents((await api.get('/events',{params:f})).data);useEffect(()=>{load()},[]);return <div className="container py-10"><div className="flex justify-between items-end mb-7"><div><h1 className="text-3xl font-black">Discover events</h1><p className="text-gray-500 mt-1">Search by topic, location and price.</p></div></div><div className="card p-4 grid md:grid-cols-5 gap-3 mb-7"><div className="md:col-span-2 relative"><Search className="absolute left-3 top-3 text-gray-400" size={18}/><input className="field pl-10" placeholder="Search events" value={f.q} onChange={e=>setF({...f,q:e.target.value})}/></div><input className="field" placeholder="Category" value={f.category} onChange={e=>setF({...f,category:e.target.value})}/><input className="field" placeholder="Location" value={f.location} onChange={e=>setF({...f,location:e.target.value})}/><button className="btn btn-primary" onClick={load}>Search</button></div><div className="grid md:grid-cols-3 gap-6">{events.map(e=><EventCard key={e._id} e={e}/>)}</div>{!events.length&&<div className="text-center py-20 text-gray-500">No events found.</div>}</div>}

export default Events;
