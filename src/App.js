import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './pages/Home';
import Services from './pages/Services';
import About from './pages/About';
import Contact from './pages/Contact';
import BookPlumber from './pages/BookPlumber';
import CustomerDashboard from './pages/CustomerDashboard';
import AdminDashboard from './pages/AdminDashboard';
import PlumberDashboard from './pages/PlumberDashboard';
import LoginRegister from './pages/LoginRegister';
import Terms from './pages/Terms';
import Privacy from './pages/Privacy';
import Legal from './pages/Legal';
import ProtectedRoute from './components/ProtectedRoute';

function Layout(){const location=useLocation();const dashboardRoute=location.pathname.endsWith('dashboard');
useEffect(() => {
  const hash = location.hash.replace(/^#/, '');
  if (hash) {
    const frame = window.requestAnimationFrame(() => {
      const target = document.getElementById(hash);
      if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      else window.scrollTo({ top: 0, behavior: 'auto' });
    });
    return () => window.cancelAnimationFrame(frame);
  }
  window.scrollTo({ top: 0, behavior: 'auto' });
  return undefined;
}, [location.pathname, location.hash]);
useEffect(() => {
  const nodes = document.querySelectorAll('[data-reveal]');
  if (!('IntersectionObserver' in window)) { nodes.forEach(node => node.classList.add('is-visible')); return undefined; }
  const observer = new IntersectionObserver((entries) => { entries.forEach(entry => { if (entry.isIntersecting) { entry.target.classList.add('is-visible'); observer.unobserve(entry.target); } }); }, { threshold: 0.08, rootMargin: '0px 0px -40px' });
  nodes.forEach(node => observer.observe(node));
  return () => observer.disconnect();
}, [location.pathname]);
return <><Navbar/><div className="route-transition" key={location.pathname}><Routes location={location}><Route path="/" element={<Home/>}/><Route path="/services" element={<Services/>}/><Route path="/about" element={<About/>}/><Route path="/contact" element={<Contact/>}/><Route path="/book-plumber" element={<BookPlumber/>}/><Route path="/login" element={<LoginRegister/>}/><Route path="/terms" element={<Terms/>}/><Route path="/privacy" element={<Privacy/>}/><Route path="/legal" element={<Legal/>}/><Route path="/customer-dashboard" element={<ProtectedRoute roles={['customer']}><CustomerDashboard/></ProtectedRoute>}/><Route path="/plumber-dashboard" element={<ProtectedRoute roles={['plumber']}><PlumberDashboard/></ProtectedRoute>}/><Route path="/admin-dashboard" element={<ProtectedRoute roles={['admin']}><AdminDashboard/></ProtectedRoute>}/></Routes></div>{!dashboardRoute&&location.pathname!=='/login'&&<Footer/>}</>}
function App(){return <BrowserRouter><Layout/></BrowserRouter>}
export default App;
