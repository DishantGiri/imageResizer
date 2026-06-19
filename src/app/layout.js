import './globals.css';

export const metadata = {
  title: 'PixelForge – Image Resizer & Converter',
  description:
    'Resize, compress, crop and convert images to PNG, JPEG, WebP, AVIF, GIF and more. Smart content-aware padding, featured image creator, custom canvas sizes.',
  keywords: 'image resizer, image converter, compress image, PNG, WebP, AVIF, JPEG, featured image',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
