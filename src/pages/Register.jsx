import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import AuthBox from '../components/AuthBox';

function Register(){const {login}=useAuth(),nav=useNavigate();const [f,setF]=useState({name:'',email:'',password:'',role:'attendee'}),[err,setErr]=useState('');const go=async e=>{e.preventDefault();try{login((await api.post('/auth/register',f)).data);nav(f.role==='organizer'?'/organizer':'/dashboard')}catch(x){setErr(x.response?.data?.message||'Registration failed')}};return <AuthBox title="Create your account" submit={go} fields={f} set={setF} err={err} button="Create account" register/>}

export default Register;
