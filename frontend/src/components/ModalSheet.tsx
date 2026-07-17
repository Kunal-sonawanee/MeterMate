import type { ReactNode } from 'react';

interface ModalSheetProps {
  open: boolean;
  title: string;
  description?: string;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
}

export function ModalSheet({ open, title, description, onClose, children, footer }: ModalSheetProps) {
  if (!open) {
    return null;
  }

  return (
    <div className="sheet-backdrop" role="presentation" onClick={onClose}>
      <section className="sheet card" role="dialog" aria-modal="true" aria-labelledby="sheet-title" onClick={(event) => event.stopPropagation()}>
        <header className="sheet-header">
          <div>
            <p className="eyebrow">Form</p>
            <h2 id="sheet-title">{title}</h2>
            {description ? <p className="muted">{description}</p> : null}
          </div>
          <button type="button" className="icon-button" onClick={onClose} aria-label="Close form">
            ×
          </button>
        </header>
        <div className="sheet-body">{children}</div>
        {footer ? <footer className="sheet-footer">{footer}</footer> : null}
      </section>
    </div>
  );
}
