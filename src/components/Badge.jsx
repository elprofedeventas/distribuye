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
    }}>
      {label}
    </span>
  );
}