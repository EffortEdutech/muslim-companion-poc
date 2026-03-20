export default function Loading() {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
      <div className="flex flex-col gap-5">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--gold-border)',
              borderRadius: '12px',
              padding: '24px',
              opacity: 1 - i * 0.15,
            }}
          >
            {/* Number badge skeleton */}
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                background: 'var(--bg-hover)',
                marginBottom: '16px',
                animation: 'pulse 1.8s ease-in-out infinite',
              }}
            />
            {/* Arabic text skeleton */}
            <div
              style={{
                height: '32px',
                width: '70%',
                marginLeft: 'auto',
                background: 'var(--bg-hover)',
                borderRadius: '6px',
                marginBottom: '16px',
                animation: 'pulse 1.8s ease-in-out infinite',
              }}
            />
            {/* Divider */}
            <div
              style={{
                height: '1px',
                background: 'var(--gold-border)',
                margin: '16px 0',
              }}
            />
            {/* English text skeleton lines */}
            {[100, 85, 65].map((w, j) => (
              <div
                key={j}
                style={{
                  height: '16px',
                  width: `${w}%`,
                  background: 'var(--bg-hover)',
                  borderRadius: '4px',
                  marginBottom: '10px',
                  animation: `pulse 1.8s ease-in-out ${j * 0.1}s infinite`,
                }}
              />
            ))}
          </div>
        ))}
      </div>
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 0.4; }
          50% { opacity: 0.7; }
        }
      `}</style>
    </div>
  );
}
