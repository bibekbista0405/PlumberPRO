import React, { useEffect, useState } from 'react';
import '../styles/ServicesSection.css';
import { Link } from 'react-router-dom';
import { getServices } from '../api/serviceApi';
import ServiceIcon from './ServiceIcon';
import Icon from './Icon';

function ServicesSection() {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => { getServices().then(d => setServices((d.services || []).slice(0, 6))).catch(() => setServices([])).finally(() => setLoading(false)); }, []);
  return <section className="services-section" id="services" data-reveal>
    <div className="services-section-inner">
      <div className="services-heading"><div><span className="eyebrow">WHAT WE DO</span><h2>Our Plumbing Services</h2><p>Straightforward plumbing support for everyday repairs, installations and urgent problems.</p></div><Link to="/services" className="services-all-link">View all services <Icon name="chevronRight" size={15}/></Link></div>
      {loading ? <div className="services-loading"><span></span><span></span><span></span></div> : services.length ? <div className="services-grid">{services.map((item, index) => <article className="service-card" key={item.id}><div className="service-number">0{index + 1}</div><div className="service-icon-wrap"><ServiceIcon name={item.name} size={22}/></div><div className="service-content"><h3>{item.name}</h3><p>{item.description}</p><div className="service-footer"><span>{Number(item.price || 0) ? `From NPR ${Number(item.price).toLocaleString()}` : 'Request a quote'}</span><Link to="/book-plumber" className="service-book">Book <Icon name="arrowUpRight" size={14}/></Link></div></div></article>)}</div> : <div className="empty-state">Services are currently unavailable.</div>}
    </div>
  </section>;
}
export default ServicesSection;
