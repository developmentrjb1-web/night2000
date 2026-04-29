export default function Soundwave({ bars = 12, className = "" }) {
  return (
    <div className={`eq-bars ${className}`} aria-hidden>
      {Array.from({ length: bars }).map((_, i) => (
        <span key={i} />
      ))}
    </div>
  );
}
