/**
 * Burns metadata watermark onto a canvas containing a captured photo.
 * @param canvas The canvas with the photo image
 * @param metadata Metadata to burn (lat, lng, address, date, mode)
 */
export function embedMetadataOnPhoto(
  canvas: HTMLCanvasElement,
  metadata: {
    lat: number;
    lng: number;
    address: string;
    date: Date;
    mode: 'BEFORE' | 'AFTER';
  }
) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const { width, height } = canvas;
  const { lat, lng, address, date, mode } = metadata;

  // Formatting strings
  const dateStr = date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  const timeStr = date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: false });

  // Add dark gradient at bottom for visibility
  const gradientHeight = 250;
  const gradient = ctx.createLinearGradient(0, height - gradientHeight, 0, height);
  gradient.addColorStop(0, 'rgba(0,0,0,0)');
  gradient.addColorStop(1, 'rgba(0,0,0,0.9)');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, height - gradientHeight, width, gradientHeight);

  // Set default text styles
  ctx.shadowColor = 'rgba(0,0,0,0.5)';
  ctx.shadowBlur = 4;
  ctx.shadowOffsetX = 2;
  ctx.shadowOffsetY = 2;

  // Add BEFORE/AFTER label
  ctx.fillStyle = mode === 'BEFORE' ? '#f97316' : '#22c55e'; // orange or green
  ctx.font = 'bold 32px Inter, system-ui, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText(mode === 'BEFORE' ? '📸 BEFORE WORK' : '✅ AFTER WORK', 20, height - 120);

  // Add address
  ctx.fillStyle = '#ffffff';
  ctx.font = 'normal 18px Inter, system-ui, sans-serif';
  
  // Wrap address if too long
  const maxWidth = width - 40;
  const words = address.split(' ');
  let line = '';
  let y = height - 90;
  
  for (const word of words) {
    const testLine = line + word + ' ';
    const metrics = ctx.measureText(testLine);
    if (metrics.width > maxWidth && line !== '') {
      ctx.fillText(line, 20, y);
      line = word + ' ';
      y += 22;
    } else {
      line = testLine;
    }
  }
  ctx.fillText(line, 20, y);

  // Add coordinates (using current Y if address wrapped)
  y += 25;
  ctx.font = 'bold 15px ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace';
  ctx.fillText(`Lat ${lat.toFixed(6)}  Long ${lng.toFixed(6)}`, 20, y);

  // Add date/time
  y += 20;
  ctx.font = 'normal 15px Inter, system-ui, sans-serif';
  ctx.fillText(`${dateStr} ${timeStr} GMT+05:30`, 20, y);

  // Add CITIZENZ branding (top-right, semi-transparent)
  ctx.shadowBlur = 0;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 0;
  ctx.textAlign = 'right';
  ctx.fillStyle = 'rgba(255,255,255,0.25)';
  ctx.font = 'bold italic 28px Arial';
  ctx.fillText('CITIZENZ', width - 20, height - 120);
}
