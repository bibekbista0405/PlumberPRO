import React from 'react';

const paths = {
  bell: 'M12 3.5c-3 0-5 2.2-5 5.3v2.6c0 .8-.3 1.6-.9 2.3L4.8 15c-.6.7-.1 1.8.8 1.8h12.8c.9 0 1.4-1.1.8-1.8l-1.3-1.3a3.3 3.3 0 0 1-.9-2.3V8.8c0-3.1-2-5.3-5-5.3Z|M9.5 19a2.5 2.5 0 0 0 5 0',
  star: 'M12 3.6l2.3 4.9 5.3.6-4 3.7 1.1 5.3-4.7-2.7-4.7 2.7 1.1-5.3-4-3.7 5.3-.6z',
  starOutline: 'M12 3.6l2.3 4.9 5.3.6-4 3.7 1.1 5.3-4.7-2.7-4.7 2.7 1.1-5.3-4-3.7 5.3-.6z',
  check: 'M4 12.5l5 5L20 7',
  chevronRight: 'M9 5l7 7-7 7',
  chevronDown: 'M5 8l7 7 7-7',
  search: 'M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14Z|M21 21l-4.3-4.3',
  refresh: 'M4 4v5h5|M20 20v-5h-5|M4.5 15a8 8 0 0 0 14.6 2.5|M19.5 9A8 8 0 0 0 5 6.5',
  sun: 'M12 4V2|M12 22v-2|M4 12H2|M22 12h-2|M5 5l-1.4-1.4|M20.4 20.4L19 19|M19 5l1.4-1.4|M3.6 20.4L5 19|CIRCLE:12,12,4.3',
  moon: 'M20 14.5A8.5 8.5 0 1 1 9.5 4a7 7 0 0 0 10.5 10.5Z',
  close: 'M6 6l12 12|M18 6L6 18',
  wrench: 'M14.7 6.3a4 4 0 0 1-5.4 5.4L4 17l3 3 5.3-5.3a4 4 0 0 1 5.4-5.4l-2.6 2.6-2-2 2.6-2.6Z',
  droplet: 'M12 3s6 6.5 6 11a6 6 0 0 1-12 0c0-4.5 6-11 6-11Z',
  shower: 'M6 8h13a1 1 0 0 1 1 1v1H5V9a1 1 0 0 1 1-1Z|M4 12h16|M8 15v1|M12 15v2|M16 15v1|M7 4h2',
  fork: 'M7 3v6a2 2 0 0 0 4 0V3|M9 9v12|M16 3c-1.5 1.5-1.5 6 0 7.5V21',
  drain: 'CIRCLE:12,12,8|M12 8v8|M8.5 9.5l7 5|M15.5 9.5l-7 5',
  bolt: 'M13 2 4 14h6l-1 8 9-12h-6l1-8Z',
  tap: 'M5 8h6v2a2 2 0 0 0 2 2h4|M17 8V6|M9 12v7|M13 8v10',
  mapPin: 'CIRCLE:12,10,2.4|M12 21s7-6.6 7-11.3A7 7 0 0 0 5 9.7C5 14.4 12 21 12 21Z',
  mail: 'M4 6h16v12H4Z|M4 7l8 6 8-6',
  clock: 'CIRCLE:12,12,8.5|M12 8v4.3l3 2',
  arrowUpRight: 'M8 16L16 8|M9 8h7v7',
  shield: 'M12 3l7 3v6c0 4.6-3 8-7 9-4-1-7-4.4-7-9V6Z',
  shieldCheck: 'M12 3l7 3v6c0 4.6-3 8-7 9-4-1-7-4.4-7-9V6Z|M9 12.3l2 2 4-4.3',
  plus: 'M12 5v14|M5 12h14',
  dashboard: 'M4 4h7v7H4Z|M13 4h7v4h-7Z|M13 11h7v9h-7Z|M4 14h7v6H4Z',
  bookings: 'M6 3h9l4 4v14H6Z|M15 3v4h4|M9 12h6|M9 16h6',
  users: 'CIRCLE:9,8,3|M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6|CIRCLE:17,9,2.4|M15.5 13.2c1.6.3 3 1.5 3.5 3.3',
  briefcase: 'M4 8h16v11H4Z|M9 8V6a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2|M4 13h16',
  reviewStar: 'M12 3.6l2.3 4.9 5.3.6-4 3.7 1.1 5.3-4.7-2.7-4.7 2.7 1.1-5.3-4-3.7 5.3-.6z',
  message: 'M4 5h16v11H8l-4 4Z',
  settings: 'CIRCLE:12,12,3|M19 12a7 7 0 0 0-.2-1.6l2-1.6-2-3.4-2.4 1a7 7 0 0 0-2.8-1.6L13 2h-4l-.6 2.8a7 7 0 0 0-2.8 1.6l-2.4-1-2 3.4 2 1.6A7 7 0 0 0 3 12c0 .5 0 1.1.2 1.6l-2 1.6 2 3.4 2.4-1c.8.7 1.8 1.3 2.8 1.6L9 22h4l.6-2.8c1-.3 2-.9 2.8-1.6l2.4 1 2-3.4-2-1.6c.2-.5.2-1.1.2-1.6Z',
  logout: 'M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4|M16 17l5-5-5-5|M21 12H9',
  location: 'CIRCLE:12,10,2.4|M12 21s7-6.6 7-11.3A7 7 0 0 0 5 9.7C5 14.4 12 21 12 21Z',
  filter: 'M4 5h16|M7 12h10|M10 19h4',
  camera: 'M4 8h3l1.5-2h7L17 8h3a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1Z|CIRCLE:12,13,3.4',
  send: 'M4 12L20 4l-6 16-3-7-7-1Z',
  chart: 'M4 20V10|M10 20V4|M16 20v-7|M4 20h16',
};

function Icon({ name, size = 18, strokeWidth = 1.9, filled = false, className = '', ...rest }) {
  const spec = paths[name];
  if (!spec) return null;
  const segments = spec.split('|');
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={`icon icon-${name} ${className}`}
      aria-hidden="true"
      {...rest}
    >
      {segments.map((seg, i) => {
        if (seg.startsWith('CIRCLE:')) {
          const [cx, cy, r] = seg.replace('CIRCLE:', '').split(',').map(Number);
          return <circle key={i} cx={cx} cy={cy} r={r} stroke="currentColor" strokeWidth={strokeWidth} fill={filled ? 'currentColor' : 'none'} />;
        }
        return <path key={i} d={seg} stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" fill={(name === 'star' && filled) ? 'currentColor' : 'none'} />;
      })}
    </svg>
  );
}

export default Icon;
