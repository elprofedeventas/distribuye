import { useState } from 'react';

function Spinner() {
  return (
    <span style={{
      display: 'inline-block',
      width: 16, height: 16,
      border: '2px solid rgba(255,255,255,0.3)',
      borderTopColor: '#fff',
      borderRadius: '50%',
      animation: 'spin 0.7s linear infinite',
    }} />
  );
}

export default function LoadingButton({
  onClick, children, className = 'btn btn-primary',
  style = {}, disabled = false
}) {
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    if (loading || disabled) return;
    setLoading(true);
    try {
      await onClick();
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      className={className}
      style={{ ...style, opacity: (loading || disabled) ? 0.6 : 1, cursor: loading ? 'wait' : 'pointer' }}
      onClick={handleClick}
      disabled={loading || disabled}
    >
      {loading ? <Spinner /> : children}
    </button>
  );
}