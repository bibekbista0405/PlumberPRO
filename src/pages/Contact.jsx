import React, { useState } from 'react';
import '../styles/Contact.css';
import { Link } from 'react-router-dom';
import { sendContactMessage } from '../api/contactApi';
import { useFormCache } from '../hooks/useFormCache';
import { useSEO } from '../hooks/useSEO';

const initial = { name:'', email:'', subject:'', message:'' };
function Contact() {
  useSEO({ title: 'Contact PlumbPro', description: 'Get in touch with the PlumbPro team — questions, feedback, or help with a booking.', path: '/contact' });
  const [form, setForm, clearFormCache] = useFormCache('contact-form', initial); const [state, setState] = useState({busy:false,error:'',success:''});
  const change = e => setForm(v => ({...v,[e.target.name]:e.target.value}));
  const submit = async e => { e.preventDefault(); setState({busy:true,error:'',success:''}); try { await sendContactMessage(form); clearFormCache(); setForm(initial); setState({busy:false,error:'',success:"Thanks — your message has been sent. We'll get back to you soon."}); } catch(err) { setState({busy:false,error:err.message,success:''}); } };
  return <main className="contact-page"><section className="contact-hero"><div><span className="eyebrow">CONTACT PLUMBPRO</span><h1>Let's get your plumbing request moving.</h1><p>Send us a message and a real member of the PlumbPro team will get back to you.</p></div><div className="contact-meta"><div><span>Support</span><strong>Contact form</strong></div><div><span>Service area</span><strong>Nepal</strong></div><div><span>Response time</span><strong>Within 1 business day</strong></div></div></section><section className="contact-layout"><div className="contact-info-card"><span className="eyebrow">BEFORE YOU SEND</span><h2>Include the details that matter.</h2><p>Tell us what you need, where the service is required and any useful context. Do not include passwords or other sensitive account credentials.</p><div className="contact-note">We only use these details to respond to you. See our <Link to="/privacy">Privacy Policy</Link> for how we handle your information.</div></div><form className="contact-form-card" onSubmit={submit}>{state.success&&<div className="form-success">{state.success}</div>}{state.error&&<div className="form-error">{state.error}</div>}<div className="form-grid"><label>Name<input name="name" value={form.name} onChange={change} autoComplete="name" required maxLength="120" placeholder="Your full name"/></label><label>Email<input name="email" value={form.email} onChange={change} type="email" autoComplete="email" required maxLength="190" placeholder="you@example.com"/></label></div><label>Subject<input name="subject" value={form.subject} onChange={change} required maxLength="255" placeholder="How can we help?"/></label><label>Message<textarea name="message" value={form.message} onChange={change} required maxLength="4000" rows="7" placeholder="Tell us what you need..."></textarea></label><button className="contact-submit" disabled={state.busy}>{state.busy ? 'Sending message…' : 'Send message'}</button></form></section></main>;
}
export default Contact;
