import React, { useEffect, useRef, useState } from 'react';
import '../styles/Testimonials.css';
import { getPublicReviews } from '../api/reviewApi';
import { getPublicFeedback } from '../api/feedbackApi';
import Icon from './Icon';

function Testimonials() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const gridRef = useRef(null);

  useEffect(() => {
    Promise.all([
      getPublicReviews().catch(() => ({ reviews: [] })),
      getPublicFeedback().catch(() => ({ feedback: [] })),
    ]).then(([reviewData, feedbackData]) => {
      const reviews = (reviewData.reviews || []).map(r => ({
        key: `review-${r.id}`,
        rating: r.rating,
        comment: r.comment,
        name: r.customer_name,
        caption: r.plumber_name ? `Service by ${r.plumber_name}` : 'Verified booking review',
        date: r.created_at,
      }));
      // Platform feedback (about PlumbPro itself, from customers or plumbers) —
      // admin-approved only. Added alongside the existing per-booking reviews,
      // never replacing them. If either source is empty, the merge just uses
      // whatever the other one has.
      const feedback = (feedbackData.feedback || []).map((f, i) => ({
        key: `feedback-${i}-${f.created_at}`,
        rating: f.rating,
        comment: f.comment,
        name: f.user_name,
        caption: f.role === 'plumber' ? 'Plumber on PlumbPro' : 'PlumbPro customer',
        date: f.created_at,
      }));
      const merged = [...reviews, ...feedback]
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .slice(0, 6);
      setItems(merged);
    }).finally(() => setLoading(false));
  }, []);

  // A per-card scroll-reveal, set up here rather than relying on the site-wide
  // observer in App.js: that one only scans the DOM once, right when the route
  // mounts. These cards render later, after this async fetch resolves, so the
  // site-wide observer would never see them — they'd stay invisible forever.
  // Re-running this whenever `items` changes means it always observes cards
  // that actually exist in the DOM.
  useEffect(() => {
    if (!gridRef.current || items.length === 0) return undefined;
    const cards = gridRef.current.querySelectorAll('.testimonial-card');
    if (!('IntersectionObserver' in window)) {
      cards.forEach(card => card.classList.add('is-visible'));
      return undefined;
    }
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -30px' });
    cards.forEach(card => observer.observe(card));
    return () => observer.disconnect();
  }, [items]);

  if (!loading && items.length === 0) return null;

  return (
    <section className="testimonials-section">
      <div className="testimonials-heading" data-reveal>
        <span className="eyebrow">REAL FEEDBACK</span>
        <h2>What customers say</h2>
        <p>Only reviews and feedback submitted by real PlumbPro users appear here.</p>
      </div>
      <div className="testimonial-grid" ref={gridRef}>
        {loading ? <p className="testimonial-loading">Loading reviews…</p> : items.map((item, i) => (
          <article className={`testimonial-card reveal-card reveal-card-${i % 6}`} key={item.key}>
            <Icon name="reviewStar" size={20} className="testimonial-quote-mark" />
            <div className="rating">
              {Array.from({ length: 5 }).map((_, s) => (
                <Icon key={s} name="star" size={15} filled={s < Number(item.rating || 0)} className={s < Number(item.rating || 0) ? 'star-on' : 'star-off'} />
              ))}
            </div>
            <p className="review">{item.comment || 'No written comment.'}</p>
            <div className="testimonial-attribution">
              <h4>{item.name}</h4>
              <span>{item.caption}</span>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
export default Testimonials;
