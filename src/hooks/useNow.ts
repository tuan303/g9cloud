import { useEffect, useState } from 'react';

/** Trả về Date.now() cập nhật định kỳ — dùng cho đồng hồ đếm ngược / "5 phút trước" */
export function useNow(intervalMs = 1000) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = window.setInterval(() => setNow(Date.now()), intervalMs);
    return () => window.clearInterval(t);
  }, [intervalMs]);
  return now;
}
