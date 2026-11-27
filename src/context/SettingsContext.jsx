import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { getPublicSettings } from '../api/settingsApi';

// Safe defaults: prices stay hidden until the API says otherwise, so a slow or
// failed request never flashes prices the admin chose to hide.
const DEFAULTS = { show_service_prices: false };
const SettingsContext = createContext({ settings: DEFAULTS, showServicePrices: false, refreshSettings: () => {}, setSettings: () => {} });

export function SettingsProvider({ children }) {
  const [settings, setSettings] = useState(DEFAULTS);
  const refreshSettings = useCallback(() => getPublicSettings().then(d => setSettings({ ...DEFAULTS, ...(d.settings || {}) })).catch(() => {}), []);
  useEffect(() => { refreshSettings(); }, [refreshSettings]);
  const value = useMemo(() => ({ settings, showServicePrices: !!settings.show_service_prices, refreshSettings, setSettings }), [settings, refreshSettings]);
  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}
export const useSettings = () => useContext(SettingsContext);
