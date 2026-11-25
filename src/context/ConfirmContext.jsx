import React, { createContext, useCallback, useContext, useRef, useState } from 'react';
import Icon from '../components/Icon';
import '../styles/ConfirmDialog.css';

const ConfirmContext = createContext(() => Promise.resolve(false));

export function ConfirmProvider({ children }) {
  const [dialog, setDialog] = useState(null);
  const resolver = useRef(null);

  const confirm = useCallback((options) => {
    setDialog({
      title: options.title || 'Are you sure?',
      message: options.message || 'This action cannot be undone.',
      confirmLabel: options.confirmLabel || 'Confirm',
      cancelLabel: options.cancelLabel || 'Cancel',
      danger: options.danger !== false,
    });
    return new Promise((resolve) => { resolver.current = resolve; });
  }, []);

  const close = (result) => {
    setDialog(null);
    if (resolver.current) { resolver.current(result); resolver.current = null; }
  };

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      {dialog && (
        <div className="confirm-backdrop" role="alertdialog" aria-modal="true" aria-labelledby="confirm-title" onClick={() => close(false)}>
          <div className="confirm-card" onClick={(e) => e.stopPropagation()}>
            <div className={`confirm-icon ${dialog.danger ? 'danger' : ''}`}><Icon name={dialog.danger ? 'close' : 'check'} size={20} /></div>
            <h3 id="confirm-title">{dialog.title}</h3>
            <p>{dialog.message}</p>
            <div className="confirm-actions">
              <button type="button" className="confirm-cancel" onClick={() => close(false)}>{dialog.cancelLabel}</button>
              <button type="button" className={`confirm-ok ${dialog.danger ? 'danger' : ''}`} onClick={() => close(true)} autoFocus>{dialog.confirmLabel}</button>
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  );
}

export function useConfirm() {
  return useContext(ConfirmContext);
}
