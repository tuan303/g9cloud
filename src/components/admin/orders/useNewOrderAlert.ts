import { useCallback, useEffect, useRef, useState } from 'react';
import { translate } from '@/i18n';
import { repo } from '@/services';
import { platform } from '@/platform';
import { toast } from '@/store/ui';

const MUTE_KEY = 'c9.admin.alertMuted';
/** Thời gian tô sáng đơn vừa thanh toán */
const HIGHLIGHT_MS = 8_000;
/** Bỏ qua sự kiện của đơn thanh toán quá lâu (VD đồng bộ hàng loạt) */
const MAX_ALERT_AGE_MS = 2 * 60_000;
const CHIME_GAP_MS = 1_200;

// ───────────── Đơn do chính thiết bị này xác nhận ─────────────

const suppressed = new Set<string>();

/**
 * Gọi ngay trước khi màn hình này tự xác nhận thanh toán một đơn:
 * không hiện toast/âm báo “Đơn mới” trùng với thông báo thành công (vẫn tô sáng thẻ).
 */
export function suppressOrderAlert(orderId: string) {
  suppressed.add(orderId);
  window.setTimeout(() => suppressed.delete(orderId), 10_000);
}

// ───────────── Âm báo (WebAudio) ─────────────
// Trình duyệt chỉ cho phát âm thanh sau thao tác đầu tiên của người dùng → mở khoá ở lần chạm đầu.

type AudioCtor = typeof AudioContext;
let audioCtx: AudioContext | null = null;

function getAudioCtor(): AudioCtor | undefined {
  if (typeof window === 'undefined') return undefined;
  return window.AudioContext ?? (window as unknown as { webkitAudioContext?: AudioCtor }).webkitAudioContext;
}

const isAudioRunning = () => audioCtx?.state === 'running';

/** Tạo / đánh thức AudioContext — chỉ gọi trong xử lý thao tác người dùng */
async function unlockAudio(): Promise<boolean> {
  try {
    const Ctor = getAudioCtor();
    if (!Ctor) return false;
    audioCtx ??= new Ctor();
    if (audioCtx.state === 'suspended') await audioCtx.resume();
    return isAudioRunning();
  } catch {
    return false;
  }
}

/** Tiếng “ting-ting” nhẹ, ấm (2 nốt sine G5 → D6) */
function playChime() {
  const ctx = audioCtx;
  if (!ctx || ctx.state !== 'running') return;
  try {
    const master = ctx.createGain();
    master.gain.value = 0.16;
    master.connect(ctx.destination);
    const t0 = ctx.currentTime + 0.02;
    const notes: [freq: number, delay: number][] = [
      [783.99, 0],
      [1174.66, 0.17],
    ];
    for (const [freq, delay] of notes) {
      const start = t0 + delay;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, start);
      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.exponentialRampToValueAtTime(1, start + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.9);
      osc.connect(gain);
      gain.connect(master);
      osc.start(start);
      osc.stop(start + 0.95);
    }
    window.setTimeout(() => master.disconnect(), 1_400);
  } catch {
    /* thiết bị không phát được âm thanh — bỏ qua */
  }
}

function readMuted(): boolean {
  try {
    return platform.storage.getItem(MUTE_KEY) === '1';
  } catch {
    return false;
  }
}

function writeMuted(muted: boolean) {
  try {
    platform.storage.setItem(MUTE_KEY, muted ? '1' : '0');
  } catch {
    /* bỏ qua */
  }
}

/**
 * Báo đơn mới cho quầy pha chế: khi một đơn chuyển sang “Đã nhận đơn” (vừa thanh toán)
 * → toast “Đơn mới …”, rung, âm báo nhẹ và tô sáng thẻ đơn trong vài giây.
 */
export function useNewOrderAlert() {
  const [freshIds, setFreshIds] = useState<ReadonlySet<string>>(() => new Set());
  const [muted, setMuted] = useState(readMuted);
  const [audioReady, setAudioReady] = useState(isAudioRunning);
  const mutedRef = useRef(muted);
  const lastChimeRef = useRef(0);

  useEffect(() => {
    mutedRef.current = muted;
  }, [muted]);

  // Mở khoá âm thanh ở thao tác đầu tiên (và đánh thức lại nếu hệ điều hành tạm dừng)
  useEffect(() => {
    const onGesture = () => {
      if (isAudioRunning()) return;
      void unlockAudio().then(setAudioReady);
    };
    const events = ['click', 'touchend', 'keydown'] as const;
    events.forEach((e) => window.addEventListener(e, onGesture, { passive: true }));
    return () => events.forEach((e) => window.removeEventListener(e, onGesture));
  }, []);

  useEffect(() => {
    const timers = new Map<string, number>();
    const unsubscribe = repo.subscribe((e) => {
      if (e.type !== 'order') return;
      const { order, previous } = e;
      if (order.status !== 'received' || order.paymentStatus !== 'paid') return;
      if (previous && previous.status !== 'pending_payment') return;
      if (!order.paidAt || Date.now() - order.paidAt > MAX_ALERT_AGE_MS) return;

      setFreshIds((s) => new Set(s).add(order.id));
      window.clearTimeout(timers.get(order.id));
      timers.set(
        order.id,
        window.setTimeout(() => {
          timers.delete(order.id);
          setFreshIds((s) => {
            const next = new Set(s);
            next.delete(order.id);
            return next;
          });
        }, HIGHLIGHT_MS),
      );

      if (suppressed.has(order.id)) return;
      toast(translate('adminOrders.alert.newOrder', { code: order.code, count: order.itemCount }), 'info');
      platform.vibrate([80, 60, 80]);
      const now = Date.now();
      if (!mutedRef.current && now - lastChimeRef.current > CHIME_GAP_MS) {
        lastChimeRef.current = now;
        playChime();
      }
    });
    return () => {
      unsubscribe();
      timers.forEach((t) => window.clearTimeout(t));
    };
  }, []);

  /** Bật / tắt âm báo — khi bật sẽ phát thử một tiếng */
  const toggleMuted = useCallback(() => {
    const next = !mutedRef.current;
    mutedRef.current = next;
    setMuted(next);
    writeMuted(next);
    if (!next) {
      void unlockAudio().then((ok) => {
        setAudioReady(ok);
        if (ok) playChime();
      });
    }
  }, []);

  /** Bật âm thanh (cần một lần chạm) và phát thử */
  const enableSound = useCallback(() => {
    void unlockAudio().then((ok) => {
      setAudioReady(ok);
      if (ok && !mutedRef.current) playChime();
    });
  }, []);

  return { freshIds, muted, audioReady, toggleMuted, enableSound };
}
