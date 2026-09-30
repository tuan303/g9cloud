/**
 * Thu nhỏ ảnh món ngay trên máy (canvas) trước khi lưu dạng data URL.
 * Bản demo lưu thực đơn trong localStorage (~5 MB) nên ảnh cần gọn: tối đa 640px, JPEG ~0.8.
 * Khi có backend thật, nên tải ảnh lên kho lưu trữ (Storage/CDN) và chỉ lưu URL.
 */

export const IMAGE_MAX_SIDE = 640;
export const IMAGE_QUALITY = 0.8;
/** Ngưỡng cảnh báo dung lượng ảnh sau khi nén */
export const IMAGE_WARN_BYTES = 250 * 1024;

export interface ProcessedImage {
  dataUrl: string;
  bytes: number;
  width: number;
  height: number;
}

/** Ước lượng số byte thật của một data URL base64 */
export function dataUrlBytes(dataUrl: string): number {
  const comma = dataUrl.indexOf(',');
  const body = comma >= 0 ? dataUrl.slice(comma + 1) : dataUrl;
  if (!dataUrl.slice(0, comma).includes(';base64')) return body.length;
  const padding = body.endsWith('==') ? 2 : body.endsWith('=') ? 1 : 0;
  return Math.max(0, Math.floor((body.length * 3) / 4) - padding);
}

/** "58 KB" / "1,2 MB" */
export function formatBytes(bytes: number): string {
  if (bytes >= 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1).replace('.', ',')} MB`;
  return `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.decoding = 'async';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('decode'));
    img.src = src;
  });
}

function makeCanvas(width: number, height: number) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Trình duyệt không hỗ trợ xử lý ảnh');
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  return { canvas, ctx };
}

export async function resizeImageFile(
  file: File,
  { maxSide = IMAGE_MAX_SIDE, quality = IMAGE_QUALITY }: { maxSide?: number; quality?: number } = {},
): Promise<ProcessedImage> {
  if (!file.type.startsWith('image/')) throw new Error('Tệp đã chọn không phải là ảnh');
  const objectUrl = URL.createObjectURL(file);
  try {
    let img: HTMLImageElement;
    try {
      img = await loadImage(objectUrl);
    } catch {
      throw new Error('Không đọc được ảnh này — hãy thử ảnh JPG hoặc PNG khác');
    }
    const srcW = img.naturalWidth;
    const srcH = img.naturalHeight;
    if (!srcW || !srcH) throw new Error('Không đọc được kích thước ảnh');

    const scale = Math.min(1, maxSide / Math.max(srcW, srcH));
    const width = Math.max(1, Math.round(srcW * scale));
    const height = Math.max(1, Math.round(srcH * scale));

    // Thu nhỏ từng nửa một để ảnh mịn, tránh răng cưa khi giảm kích thước nhiều lần
    let source: CanvasImageSource = img;
    let curW = srcW;
    let curH = srcH;
    while (curW / 2 >= width && curH / 2 >= height) {
      const nextW = Math.round(curW / 2);
      const nextH = Math.round(curH / 2);
      const step = makeCanvas(nextW, nextH);
      step.ctx.drawImage(source, 0, 0, nextW, nextH);
      source = step.canvas;
      curW = nextW;
      curH = nextH;
    }

    const out = makeCanvas(width, height);
    // JPEG không có nền trong suốt → phủ màu kem cho ảnh PNG
    out.ctx.fillStyle = '#FBF6EC';
    out.ctx.fillRect(0, 0, width, height);
    out.ctx.drawImage(source, 0, 0, width, height);

    let dataUrl = out.canvas.toDataURL('image/jpeg', quality);
    if (dataUrlBytes(dataUrl) > IMAGE_WARN_BYTES) {
      const lighter = out.canvas.toDataURL('image/jpeg', Math.min(quality, 0.65));
      if (lighter.length < dataUrl.length) dataUrl = lighter;
    }
    return { dataUrl, bytes: dataUrlBytes(dataUrl), width, height };
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}
