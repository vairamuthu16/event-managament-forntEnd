import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function AdminLogin(){
 const {login}=useAuth(); const nav=useNavigate(); const [form,setForm]=useState({email:'',password:''}); const [error,setError]=useState('');
 const submit=async e=>{e.preventDefault();setError('');try{const {data}=await api.post('/auth/admin-login',form);if(data.user?.role!=='admin') throw new Error('This account is not an administrator.');login(data);nav('/admin',{replace:true});}catch(err){setError(err.response?.data?.message||err.message||'Admin login failed')}};
 return <div className="container py-16 max-w-md"><div className="card p-7"><span className="badge">Administration</span><h1 className="text-3xl font-black mt-3">Admin login</h1><p className="text-gray-500 mt-2">Manage users, events, payments and reports.</p><form onSubmit={submit} className="mt-6 space-y-4"><input className="field" type="email" placeholder="Admin email" value={form.email} onChange={e=>setForm({...form,email:e.target.value})} required/><input className="field" type="password" placeholder="Password" value={form.password} onChange={e=>setForm({...form,password:e.target.value})} required/>{error&&<p className="text-red-600 text-sm">{error}</p>}<button className="btn btn-primary w-full">Sign in as admin</button></form><div className="flex justify-between mt-5 text-sm"><Link className="text-brand font-bold" to="/login">User login</Link><Link className="text-brand font-bold" to="/organizer/login">Organizer login</Link></div></div></div>
}
