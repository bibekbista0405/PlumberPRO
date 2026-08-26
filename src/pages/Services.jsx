import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import '../styles/ServicesPage.css';
import { getServices } from '../api/serviceApi';
function Services(){const [services,setServices]=useState([]);const [loading,setLoading]=useState(true);useEffect(()=>{getServices().then(d=>setServices(d.services)).catch(console.error).finally(()=>setLoading(false));},[]);return <div className="services-page"><h1>Our Services</h1><p className="page-lead">Reliable plumbing solutions, now powered by real bookings and service management.</p><div className="services-container">{loading?<p>Loading services…</p>:services.map(s=><div className="service-box" key={s.id}><div className="icon">{s.icon}</div><h3>{s.name}</h3><p>{s.description}</p><strong>NPR {Number(s.price).toLocaleString()}</strong><Link to="/book-plumber">Book Service</Link></div>)}</div></div>}
export default Services;
