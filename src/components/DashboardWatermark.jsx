import React from 'react';
import '../styles/DashboardWatermark.css';

function DashboardWatermark({ thin = false }) {
  return (
    <div className={`dash-watermark ${thin ? 'dash-watermark-thin' : ''}`} aria-hidden="true">
      <img src="/plumbpro-mark.svg" alt="" />
      <span>PlumbPro</span>
    </div>
  );
}
export default DashboardWatermark;
