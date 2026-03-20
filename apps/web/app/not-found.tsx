import Link from 'next/link';

export default function NotFound() {
  return (
    <div
      style={{
        minHeight: '70vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px 20px',
        textAlign: 'center',
      }}
    >
      <div
        dir="rtl"
        lang="ar"
        style={{
          fontFamily: 'var(--font-amiri)',
          fontSize: '3rem',
          color: 'var(--gold)',
          opacity: 0.4,
          marginBottom: '20px',
          lineHeight: 1.8,
        }}
      >
        ٤٠٤
      </div>
      <h1
        className="page-heading"
        style={{ fontSize: '2rem', marginBottom: '12px' }}
      >
        Page Not Found
      </h1>
      <p
        style={{
          fontFamily: 'var(--font-lora)',
          color: 'var(--ink-secondary)',
          fontSize: '0.95rem',
          maxWidth: '360px',
          lineHeight: 1.7,
          marginBottom: '28px',
        }}
      >
        The page you are looking for does not exist or may have been moved.
      </p>
      <Link
        href="/"
        style={{
          fontFamily: 'var(--font-lora)',
          color: 'var(--gold)',
          textDecoration: 'none',
          padding: '10px 20px',
          borderRadius: '8px',
          border: '1px solid var(--gold-border)',
          background: 'var(--bg-card)',
          fontSize: '0.9rem',
        }}
      >
        ← Back to Collections
      </Link>
    </div>
  );
}
