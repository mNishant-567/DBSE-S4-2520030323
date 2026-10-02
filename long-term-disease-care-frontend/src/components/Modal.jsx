import React, { useEffect } from "react";
import { X } from "lucide-react";

export function Modal({ isOpen, onClose, title, kicker, icon: Icon, children, maxWidth = 560 }) {
  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === "Escape") onClose();
    }
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    }
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="modal-backdrop" onClick={onClose} role="dialog" aria-modal="true">
      <div
        className="modal"
        style={{ maxWidth: `${maxWidth}px` }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          className="modal-close"
          onClick={onClose}
          aria-label="Close modal"
          id="btn-close-modal"
        >
          <X size={18} />
        </button>

        {Icon && (
          <div className="modal-icon">
            <Icon size={22} />
          </div>
        )}

        {kicker && <div className="section-kicker">{kicker}</div>}
        {title && <h2>{title}</h2>}

        <div className="modal-content-body">{children}</div>
      </div>
    </div>
  );
}
