import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import '../styles/ServicesPage.css';
import { getServices } from '../api/serviceApi';
import ServiceIcon from '../components/ServiceIcon';
import { useSEO } from '../hooks/useSEO';

function Services() {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => { getServices().then(d => setServices(d.services)).catch(console.error).finally(() => setLoading(false)); }, []);
  useSEO({
    title: 'Plumbing Services & Pricing',
    description: 'Browse real, database-driven plumbing services on PlumbPro — pipe repair, leak repair, drain cleaning, water tank installation and more.',
    path: '/services',
  });
  return (
    <div className="services-page">
      <h1>Our Services</h1>
      <p className="page-lead">Reliable plumbing solutions, now powered by real bookings and service management.</p>
      <div className="services-container">
        {loading ? <p>Loading services…</p> : services.map(s => (
          <div className="service-box" key={s.id}>
            <div className="icon"><ServiceIcon name={s.name} size={26} /></div>
            <h3>{s.name}</h3>
            <p>{s.description}</p>
            <strong>{s.is_negotiable ? 'Negotiable at the job' : `NPR ${Number(s.price).toLocaleString()}`}</strong>
            {s.is_negotiable && <span className="negotiable-note">Price is discussed and agreed with your plumber once they see the job.</span>}
            <Link to="/book-plumber">Book Service</Link>
          </div>
        ))}
      </div>
    </div>
  );
}
export default Services;
