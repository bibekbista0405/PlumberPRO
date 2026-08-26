import React from 'react';
import Icon from './Icon';

const rules = [
  [/leak|leakage/i, 'droplet'],
  [/pipe/i, 'wrench'],
  [/bathroom|shower/i, 'shower'],
  [/kitchen|sink/i, 'fork'],
  [/drain/i, 'drain'],
  [/emergency|urgent/i, 'bolt'],
  [/tap|faucet/i, 'tap'],
  [/tank|heater|water/i, 'droplet'],
  [/toilet/i, 'shower'],
];

function ServiceIcon({ name = '', size = 20, className = '' }) {
  const match = rules.find(([pattern]) => pattern.test(name));
  return <Icon name={match ? match[1] : 'wrench'} size={size} className={className} />;
}

export default ServiceIcon;
