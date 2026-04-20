export default function Badge({ label, color }) {
  return (
    <span style={{
      background: color + '22',
      color,
      border: `1px solid ${color}44`,
      borderRadius: 6,
      padding: '2px 8px',
      fontSize: 11,
      fontWeight: 600,
      letterSpacing: 0.5,
      display: 'inline-flex',
      alignItems: 'center',
      gap: 5,
    }}>
      <span style={{
        width: 8,
        height: 8,
        borderRadius: '50%',
        background: color,
        flexShrink: 0,
        display: 'inline-block',
      }} />
      {label}
    </span>
  );
}