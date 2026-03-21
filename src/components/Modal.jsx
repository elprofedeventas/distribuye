export default function Modal({ title, onClose, children }) {
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 100,
      background: 'rgba(0,0,0,0.7)',
      display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
    }} onClick={onClose}>
      <div style={{
        background: 'var(--surface)',
        borderRadius: '16px 16px 0 0',
        width: '100%', maxWidth: 640,
        padding: '20px 16px 32px',
        maxHeight: '90vh', overflowY: 'auto',
      }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <span style={{ fontWeight: 600, fontSize: 16 }}>{title}</span>
          <button className="btn btn-ghost" style={{ padding: '6px 12px' }} onClick={onClose}>✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}