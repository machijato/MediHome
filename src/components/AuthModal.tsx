import React from 'react';

type AuthModalProps = {
  open: boolean;
  onClose: () => void;
};

export function AuthModal({ open }: AuthModalProps) {
  if (!open) {
    return null;
  }

  return null;
}
