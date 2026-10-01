import { Fragment } from 'react';

/**
 * Hiển thị bản dịch có đoạn in đậm đánh dấu <b>…</b>, VD t('…') = "Đang có <b>3 đơn mẫu</b> …".
 * Chỉ tách chữ (không chèn HTML) nên an toàn với dữ liệu người dùng trong biến.
 */
export function Rich({ text, className }: { text: string; className?: string }) {
  const parts = text.split(/<b>(.*?)<\/b>/g);
  return (
    <>
      {parts.map((part, i) =>
        i % 2 === 1 ? (
          <b key={i} className={className}>
            {part}
          </b>
        ) : (
          <Fragment key={i}>{part}</Fragment>
        ),
      )}
    </>
  );
}
