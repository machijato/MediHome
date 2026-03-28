import React from "react";

interface AuthModalProps {
  open: boolean;
  onClose: () => void;
}

const AuthModal: React.FC<AuthModalProps> = ({ open, onClose }) => {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-xl p-6 w-full max-w-md">
        <h2 className="text-xl font-bold mb-4">Prijava</h2>

        <p className="text-sm text-gray-600 mb-4">
          AuthModal je trenutno placeholder (privremeno rješenje).
        </p>

        <button
          onClick={onClose}
          className="w-full bg-blue-600 text-white py-2 rounded-lg"
        >
          Zatvori
        </button>
      </div>
    </div>
  );
};

export default AuthModal;
