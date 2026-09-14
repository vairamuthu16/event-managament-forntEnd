import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import AuthBox from '../components/AuthBox';

function Login(){const {login}=useAuth(),nav=useNavigate();const [f,setF]=useState({email:'',password:''}),[err,setErr]=useState('');const go=async e=>{e.preventDefault();try{const data=(await api.post('/auth/login',f)).data;login(data);nav(data.user.role==='admin'?'/admin':data.user.role==='organizer'?'/organizer':'/dashboard')}catch(x){setErr(x.response?.data?.message||'Login failed')}};return <AuthBox title="Welcome back" submit={go} fields={f} set={setF} err={err} button="Sign in" adminLink/>}

export default Login;
