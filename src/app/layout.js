import './globals.css';
import { ThemeProvider } from './components/ThemeProvider';
import Navbar from './components/Navbar';

export const metadata = {
  title: 'PixelForge – Image Resizer & Converter',
  description:
    'Resize, compress, crop and convert images to PNG, JPEG, WebP, AVIF, GIF and more. Smart content-aware padding, featured image creator, custom canvas sizes.',
  keywords: 'image resizer, image converter, compress image, PNG, WebP, AVIF, JPEG, featured image',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" data-theme="dark">
      <body>
        <ThemeProvider>
          <Navbar />
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
