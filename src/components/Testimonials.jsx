import React, { useEffect, useState } from 'react';
import "../styles/Testimonials.css";
import { getPublicReviews } from '../api/reviewApi';
import { getPublicFeedback } from '../api/feedbackApi';
import Icon from './Icon';

function Testimonials() {
  const [items,setItems]=useState([]); const [loading,setLoading]=useState(true);
  useEffect(()=>{
    Promise.all([
      getPublicReviews().catch(()=>({reviews:[]})),
      getPublicFeedback().catch(()=>({feedback:[]})),
    ]).then(([reviewData,feedbackData])=>{
      const reviews=(reviewData.reviews||[]).map(r=>({
        key:`review-${r.id}`, rating:r.rating, comment:r.comment, name:r.customer_name,
        caption:r.plumber_name?`Service by ${r.plumber_name}`:'Verified booking review', date:r.created_at,
      }));
      // Platform feedback (about PlumbPro itself, from customers or plumbers) — admin-approved only.
      // Added alongside the existing per-booking reviews, never replacing them.
      const feedback=(feedbackData.feedback||[]).map((f,i)=>({
        key:`feedback-${i}-${f.created_at}`, rating:f.rating, comment:f.comment, name:f.user_name,
        caption:f.role==='plumber'?'Plumber on PlumbPro':'PlumbPro customer', date:f.created_at,
      }));
      const merged=[...reviews,...feedback].sort((a,b)=>new Date(b.date)-new Date(a.date)).slice(0,6);
      setItems(merged);
    }).finally(()=>setLoading(false));
  },[]);
  if(!loading && items.length===0) return null;
  return <section className="testimonials-section" data-reveal><div className="testimonials-heading"><span className="eyebrow">REAL FEEDBACK</span><h2>What customers say</h2><p>Only reviews and feedback submitted by real PlumbPro users appear here.</p></div><div className="testimonial-grid">{loading?<p>Loading reviews…</p>:items.map(item=><article className="testimonial-card" key={item.key}><p className="rating">{Array.from({length:5}).map((_,i)=><Icon key={i} name="star" size={15} filled={i<Number(item.rating||0)} className={i<Number(item.rating||0)?'star-on':'star-off'}/>)}</p><p className="review">“{item.comment||'No written comment.'}”</p><h4>{item.name}</h4><span>{item.caption}</span></article>)}</div></section>;
}
export default Testimonials;
