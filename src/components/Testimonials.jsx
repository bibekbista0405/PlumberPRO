import React, { useEffect, useState } from 'react';
import "../styles/Testimonials.css";
import { getPublicReviews } from '../api/reviewApi';
import Icon from './Icon';

function Testimonials() {
  const [reviews,setReviews]=useState([]); const [loading,setLoading]=useState(true);
  useEffect(()=>{getPublicReviews().then(d=>setReviews((d.reviews||[]).slice(0,6))).catch(()=>setReviews([])).finally(()=>setLoading(false));},[]);
  if(!loading && reviews.length===0) return null;
  return <section className="testimonials-section" data-reveal><div className="testimonials-heading"><span className="eyebrow">REAL FEEDBACK</span><h2>What customers say</h2><p>Only reviews submitted through completed PlumbPro bookings appear here.</p></div><div className="testimonial-grid">{loading?<p>Loading reviews…</p>:reviews.map(item=><article className="testimonial-card" key={item.id}><p className="rating">{Array.from({length:5}).map((_,i)=><Icon key={i} name="star" size={15} filled={i<Number(item.rating||0)} className={i<Number(item.rating||0)?'star-on':'star-off'}/>)}</p><p className="review">“{item.comment||'No written comment.'}”</p><h4>{item.customer_name}</h4><span>{item.plumber_name ? `Service by ${item.plumber_name}` : 'Verified booking review'}</span></article>)}</div></section>;
}
export default Testimonials;
