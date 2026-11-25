import React from 'react';
import Icon from './Icon';

function Stars({ rating = 0, count = 0, size = 14, showCount = true }) {
  if (!count) return <span className="stars stars-empty">No reviews yet</span>;
  const full = Math.round(Number(rating) || 0);
  return (
    <span className="stars" title={`${Number(rating).toFixed(1)} out of 5`}>
      <span className="stars-icons">
        {Array.from({ length: 5 }).map((_, i) => (
          <Icon key={i} name="star" size={size} filled={i < full} className={i < full ? 'star-on' : 'star-off'} />
        ))}
      </span>
      <b>{Number(rating).toFixed(1)}</b>
      {showCount && <small>({count})</small>}
    </span>
  );
}
export default Stars;
