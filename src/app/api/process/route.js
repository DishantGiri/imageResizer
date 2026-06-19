import { NextResponse } from 'next/server';
import sharp from 'sharp';

export const config = { api: { bodyParser: false } };

// Helper: trim transparent edges, returns tight-cropped buffer
async function trimToObject(imageBuffer) {
  const meta = await sharp(imageBuffer).metadata();
  if (!meta.hasAlpha) return imageBuffer;
  try {
    return await sharp(imageBuffer).trim({ threshold: 10 }).toBuffer();
  } catch {
    return imageBuffer;
  }
}

async function processImage(imageBuffer, {
  paddingTop = 20,
  paddingBottom = 20,
  outputWidth = 500,
  outputHeight = 500,
  bgColor = null,
}) {
  // Step 1: Remove transparency — tight-crop around the object
  const cropped = await trimToObject(imageBuffer);
  const croppedMeta = await sharp(cropped).metadata();

  // Step 2: Scale the object as BIG as possible inside the padded area (preserve proportions)
  const availableW = outputWidth;
  const availableH = Math.max(1, outputHeight - paddingTop - paddingBottom);
  const scale = Math.min(availableW / croppedMeta.width, availableH / croppedMeta.height);
  const newW = Math.round(croppedMeta.width * scale);
  const newH = Math.round(croppedMeta.height * scale);

  const resized = await sharp(cropped)
    .ensureAlpha()
    .resize(newW, newH, { fit: 'fill' })
    .toBuffer();

  // Step 3: Center on canvas and add background
  const left = Math.floor((outputWidth - newW) / 2);
  const top  = paddingTop + Math.floor((availableH - newH) / 2);

  let bg = { r: 0, g: 0, b: 0, alpha: 0 };
  if (bgColor) {
    const hex = bgColor.replace('#', '');
    bg = {
      r: parseInt(hex.substring(0, 2), 16),
      g: parseInt(hex.substring(2, 4), 16),
      b: parseInt(hex.substring(4, 6), 16),
      alpha: 1,
    };
  }

  const result = await sharp({
    create: { width: outputWidth, height: outputHeight, channels: 4, background: bg },
  })
    .composite([{ input: resized, left, top }])
    .png()
    .toBuffer();

  return { buffer: result, boundaries: null };
}

async function createFeaturedImage(imageBuffer, {
  canvasWidth = 1200,
  canvasHeight = 628,
  paddingTop = 20,
  paddingBottom = 20,
  backgroundColor = '#FFFFFF',
  gradientColor = null,
}) {
  const hex2rgb = (hex) => {
    const h = hex.replace('#', '');
    return {
      r: parseInt(h.substring(0, 2), 16),
      g: parseInt(h.substring(2, 4), 16),
      b: parseInt(h.substring(4, 6), 16),
    };
  };

  const bg = hex2rgb(backgroundColor);

  // Step 1: Trim transparent edges — get tight crop around the object
  const cropped = await trimToObject(imageBuffer);
  const meta = await sharp(cropped).metadata();

  // Step 2: Scale as BIG as possible inside the padded canvas (preserve proportions)
  const paddingH = 20; // horizontal breathing room
  const availableW = canvasWidth - paddingH * 2;
  const availableH = canvasHeight - paddingTop - paddingBottom;
  const scale = Math.min(availableW / meta.width, availableH / meta.height);
  const newW = Math.round(meta.width * scale);
  const newH = Math.round(meta.height * scale);

  // Step 3: Center on canvas
  const x = Math.floor((canvasWidth - newW) / 2);
  const y = paddingTop + Math.floor((availableH - newH) / 2);

  const resized = await sharp(cropped)
    .ensureAlpha()
    .resize(newW, newH, { fit: 'fill' })
    .toBuffer();

  // Build background (solid or gradient)
  let background;
  if (gradientColor) {
    const gc = hex2rgb(gradientColor);
    const pixels = Buffer.alloc(canvasWidth * canvasHeight * 3);
    for (let row = 0; row < canvasHeight; row++) {
      const ratio = row / canvasHeight;
      const r = Math.round(bg.r * (1 - ratio) + gc.r * ratio);
      const g = Math.round(bg.g * (1 - ratio) + gc.g * ratio);
      const b = Math.round(bg.b * (1 - ratio) + gc.b * ratio);
      for (let col = 0; col < canvasWidth; col++) {
        const idx = (row * canvasWidth + col) * 3;
        pixels[idx] = r; pixels[idx + 1] = g; pixels[idx + 2] = b;
      }
    }
    background = await sharp(pixels, { raw: { width: canvasWidth, height: canvasHeight, channels: 3 } }).png().toBuffer();
  } else {
    background = await sharp({
      create: { width: canvasWidth, height: canvasHeight, channels: 3, background: bg },
    }).png().toBuffer();
  }

  const result = await sharp(background)
    .composite([{ input: resized, left: x, top: y }])
    .png()
    .toBuffer();

  return result;
}

export async function POST(request) {
  try {
    const formData = await request.formData();

    const paddingTop = parseInt(formData.get('padding_top') ?? '20');
    const paddingBottom = parseInt(formData.get('padding_bottom') ?? '20');
    const outputWidth = Math.max(50, Math.min(5000, parseInt(formData.get('output_width') ?? '500')));
    const outputHeight = Math.max(50, Math.min(5000, parseInt(formData.get('output_height') ?? '500')));
    const customFilename = formData.get('custom_filename') ?? '';
    const outputFormat = formData.get('output_format') ?? 'png';
    const compressQuality = Math.max(1, Math.min(100, parseInt(formData.get('compress_quality') ?? '90')));
    const action = formData.get('action') ?? 'resize';
    const bgColor = formData.get('bg_color') ?? null;

    // Featured image params
    const canvasWidth = parseInt(formData.get('canvas_width') ?? '1200');
    const canvasHeight = parseInt(formData.get('canvas_height') ?? '628');
    const backgroundColor = formData.get('background_color') ?? '#FFFFFF';
    const gradientColor = formData.get('gradient_color') || null;

    let imageBuffer = null;

    const file = formData.get('file');
    const imageUrl = formData.get('image_url');

    if (file && file.size > 0) {
      const arrayBuffer = await file.arrayBuffer();
      imageBuffer = Buffer.from(arrayBuffer);
    } else if (imageUrl) {
      const res = await fetch(imageUrl);
      if (!res.ok) {
        return NextResponse.json({ success: false, message: `Failed to fetch URL: HTTP ${res.status}` });
      }
      imageBuffer = Buffer.from(await res.arrayBuffer());
    } else {
      return NextResponse.json({ success: false, message: 'No file or URL provided.' });
    }

    let outputBuffer;
    let boundaries = null;

    if (action === 'featured') {
      outputBuffer = await createFeaturedImage(imageBuffer, {
        canvasWidth, canvasHeight, paddingTop, paddingBottom, backgroundColor, gradientColor,
      });
    } else if (action === 'compress') {
      if (bgColor) {
        const hex = bgColor.replace('#', '');
        const bg = {
          r: parseInt(hex.substring(0, 2), 16),
          g: parseInt(hex.substring(2, 4), 16),
          b: parseInt(hex.substring(4, 6), 16),
          alpha: 1,
        };
        const meta = await sharp(imageBuffer).metadata();
        outputBuffer = await sharp({
          create: { width: meta.width, height: meta.height, channels: 4, background: bg }
        })
          .composite([{ input: await sharp(imageBuffer).ensureAlpha().toBuffer() }])
          .png()
          .toBuffer();
      } else {
        outputBuffer = await sharp(imageBuffer).toBuffer();
      }
    } else {
      const result = await processImage(imageBuffer, {
        paddingTop, paddingBottom, outputWidth, outputHeight, bgColor,
      });
      outputBuffer = result.buffer;
      boundaries = result.boundaries;
    }

    // Convert to requested format
    let finalBuffer;
    let mimeType;
    let ext;

    const sharpImg = sharp(outputBuffer);

    switch (outputFormat) {
      case 'jpeg':
      case 'jpg': {
        // JPEG cannot be transparent — apply bgColor or default to white
        const jpegHex = bgColor ? bgColor.replace('#', '') : 'ffffff';
        const jpegBg = {
          r: parseInt(jpegHex.substring(0, 2), 16),
          g: parseInt(jpegHex.substring(2, 4), 16),
          b: parseInt(jpegHex.substring(4, 6), 16),
        };
        finalBuffer = await sharpImg.flatten({ background: jpegBg }).jpeg({ quality: compressQuality, mozjpeg: true }).toBuffer();
        mimeType = 'image/jpeg';
        ext = 'jpg';
        break;
      }
      case 'webp':
        finalBuffer = await sharpImg.webp({ quality: compressQuality, effort: 6 }).toBuffer();
        mimeType = 'image/webp';
        ext = 'webp';
        break;
      case 'gif':
        finalBuffer = await sharpImg.gif().toBuffer();
        mimeType = 'image/gif';
        ext = 'gif';
        break;
      case 'bmp':
        finalBuffer = await sharpImg.bmp().toBuffer();
        mimeType = 'image/bmp';
        ext = 'bmp';
        break;
      case 'tiff':
        finalBuffer = await sharpImg.tiff({ quality: compressQuality }).toBuffer();
        mimeType = 'image/tiff';
        ext = 'tiff';
        break;
      case 'avif':
        finalBuffer = await sharpImg.avif({ quality: compressQuality, effort: 4 }).toBuffer();
        mimeType = 'image/avif';
        ext = 'avif';
        break;
      default:
        finalBuffer = await sharpImg.png({ 
          quality: compressQuality < 100 ? compressQuality : 100,
          palette: compressQuality < 100, // Use palette quantization (like TinyPNG) for massive size reduction
          compressionLevel: 9,            // Maximum zlib compression
          effort: 10                      // Max CPU effort for smallest size
        }).toBuffer();
        mimeType = 'image/png';
        ext = 'png';
    }

    const base64 = finalBuffer.toString('base64');
    const dataUrl = `data:${mimeType};base64,${base64}`;
    const filename = customFilename
      ? `${customFilename.replace(/\.[^/.]+$/, '')}.${ext}`
      : `processed-image.${ext}`;

    return NextResponse.json({
      success: true,
      message: `Image processed successfully`,
      dataUrl,
      filename,
      mimeType,
      boundaries,
      originalSize: imageBuffer.length,
      dimensions: action === 'featured'
        ? { width: canvasWidth, height: canvasHeight }
        : { width: outputWidth, height: outputHeight },
    });
  } catch (err) {
    console.error('API error:', err);
    return NextResponse.json({ success: false, message: `Error: ${err.message}` }, { status: 500 });
  }
}
