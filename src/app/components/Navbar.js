'use client';
import Image from 'next/image';
import LampToggle from './LampToggle';

export default function Navbar() {
  return (
    <nav className="navbar">
      <div className="navbar-inner">
        {/* Logo */}
        <a href="/" className="navbar-logo">
          <Image
            src="/logo.webp"
            alt="PixelForge Logo"
            width={36}
            height={36}
            style={{ borderRadius: 8, objectFit: 'contain' }}
            priority
          />
          <span className="navbar-brand">
            Pixel<span className="navbar-brand-accent">Forge</span>
          </span>
        </a>

        {/* Right side */}
        <div className="navbar-right">
          <span className="navbar-tagline">AI Image Tools</span>
          <LampToggle />
        </div>
      </div>
    </nav>
  );
}
