import { useEffect, useRef, useState, type RefObject } from 'react';
import jsQR from 'jsqr';
import { Camera, CameraOff, LoaderCircle, Pause, RotateCcw, ScanLine, Smartphone } from 'lucide-react';
import barPhoto from '@/assets/photos/espresso-bar-sm.webp';
import { Button, Logo } from '@/components/ui';
import { cn } from '@/lib/cn';
import { platform } from '@/platform';
import { toast } from '@/store/ui';

export type ScanSource = 'camera' | 'native';

type Phase = 'idle' | 'starting' | 'live' | 'error';
type Issue = 'insecure' | 'unsupported' | 'denied' | 'notfound' | 'busy' | 'unknown';

const ISSUE_COPY: Record<Issue, { title: string; body: string; retry: boolean }> = {
  insecure: {
    title: 'Camera cần kết nối bảo mật',
    body: 'Trình duyệt chỉ mở camera trên trang https:// hoặc localhost. Bạn vẫn có thể nhập mã đơn bên dưới.',
    retry: false,
  },
  unsupported: {
    title: 'Trình duyệt chưa hỗ trợ camera',
    body: 'Hãy mở bằng Chrome hoặc Safari bản mới, hoặc nhập mã đơn bên dưới.',
    retry: false,
  },
  denied: {
    title: 'Chưa được phép dùng camera',
    body: 'Cho phép truy cập camera trong cài đặt trình duyệt rồi bấm “Thử lại”.',
    retry: true,
  },
  notfound: {
    title: 'Không tìm thấy camera',
    body: 'Thiết bị này chưa có camera phù hợp. Hãy nhập mã đơn bên dưới.',
    retry: true,
  },
  busy: {
    title: 'Camera đang bận',
    body: 'Một ứng dụng khác đang dùng camera. Đóng ứng dụng đó rồi thử lại.',
    retry: true,
  },
  unknown: {
    title: 'Không mở được camera',
    body: 'Vui lòng thử lại, hoặc nhập mã đơn bên dưới.',
    retry: true,
  },
};

/** ~5 khung hình/giây là đủ nhanh mà vẫn nhẹ máy */
const SCAN_INTERVAL_MS = 200;
/** Thu nhỏ khung hình trước khi giải mã */
const MAX_DECODE_WIDTH = 640;

function environmentIssue(): Issue | null {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') return 'unsupported';
  if (window.isSecureContext === false) return 'insecure';
  if (!navigator.mediaDevices?.getUserMedia) return 'unsupported';
  return null;
}

function classifyError(err: unknown): Issue {
  const name = err instanceof Error || err instanceof DOMException ? err.name : '';
  switch (name) {
    case 'NotAllowedError':
    case 'PermissionDeniedError':
    case 'SecurityError':
      return 'denied';
    case 'NotFoundError':
    case 'DevicesNotFoundError':
    case 'OverconstrainedError':
      return 'notfound';
    case 'NotReadableError':
    case 'TrackStartError':
    case 'AbortError':
      return 'busy';
    default:
      return 'unknown';
  }
}

const CORNERS = [
  'left-0 top-0 rounded-tl-[26px] border-l-[5px] border-t-[5px]',
  'right-0 top-0 rounded-tr-[26px] border-r-[5px] border-t-[5px]',
  'bottom-0 left-0 rounded-bl-[26px] border-b-[5px] border-l-[5px]',
  'bottom-0 right-0 rounded-br-[26px] border-b-[5px] border-r-[5px]',
];

/** Khung ngắm: góc vàng + vạch quét chạy lên xuống, vùng ngoài khung tối lại */
function Viewfinder({ lineRef }: { lineRef: RefObject<HTMLDivElement> }) {
  return (
    <div className="pointer-events-none absolute inset-0" aria-hidden>
      <div className="absolute left-1/2 top-[44%] aspect-square w-[62%] max-w-[300px] -translate-x-1/2 -translate-y-1/2 rounded-[26px] shadow-[0_0_0_9999px_rgba(28,22,14,0.5)]">
        {CORNERS.map((c) => (
          <span key={c} className={cn('absolute h-10 w-10 border-gold', c)} />
        ))}
        <div className="absolute inset-3 overflow-hidden rounded-2xl">
          <div ref={lineRef} className="absolute inset-0">
            <div className="h-0.5 w-full bg-gradient-to-r from-transparent via-gold-light to-transparent shadow-[0_0_16px_4px_rgba(217,174,99,0.55)]" />
          </div>
        </div>
      </div>
      <p className="absolute inset-x-0 top-4 px-4 text-center">
        <span className="inline-block rounded-full bg-espresso-900/60 px-3 py-1.5 text-xs font-medium text-cream/90 backdrop-blur">
          Đưa mã QR trên điện thoại khách vào khung
        </span>
      </p>
    </div>
  );
}

/**
 * Trình quét QR bằng camera trong trang (getUserMedia + jsQR).
 * Được điều khiển bởi `active`: khi đọc được mã sẽ tự dừng camera, gọi `onActiveChange(false)` rồi `onDetected`.
 * Trên Zalo Mini App (`platform.canNativeScan`) hiện thêm nút “Quét bằng Zalo”.
 */
export function QrScanner({
  active,
  onActiveChange,
  onDetected,
  busy,
  className,
}: {
  active: boolean;
  onActiveChange: (active: boolean) => void;
  onDetected: (text: string, source: ScanSource) => void;
  /** Đang tra cứu mã vừa quét */
  busy?: boolean;
  className?: string;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const lineRef = useRef<HTMLDivElement>(null);
  const [phase, setPhase] = useState<Phase>(active ? 'starting' : 'idle');
  const [issue, setIssue] = useState<Issue | null>(null);
  const [startedOnce, setStartedOnce] = useState(false);
  const [nativeBusy, setNativeBusy] = useState(false);
  const cbRef = useRef({ onActiveChange, onDetected });

  useEffect(() => {
    cbRef.current = { onActiveChange, onDetected };
  });

  // Bật / tắt camera theo `active`
  useEffect(() => {
    if (!active) {
      setPhase((p) => (p === 'error' ? p : 'idle'));
      return;
    }
    const envIssue = environmentIssue();
    if (envIssue) {
      setIssue(envIssue);
      setPhase('error');
      cbRef.current.onActiveChange(false);
      return;
    }

    let cancelled = false;
    let stream: MediaStream | null = null;
    let raf = 0;
    let lastScan = 0;
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d', { willReadFrequently: true });

    setIssue(null);
    setPhase('starting');
    setStartedOnce(true);

    const stop = () => {
      cancelAnimationFrame(raf);
      const s = stream;
      stream = null;
      s?.getTracks().forEach((t) => t.stop());
      // Chỉ gỡ luồng của chính phiên này (phiên cũ trả về muộn không được tắt video của phiên mới)
      const video = videoRef.current;
      if (video && s && video.srcObject === s) {
        video.pause();
        video.srcObject = null;
      }
    };

    const tick = (t: number) => {
      if (cancelled) return;
      raf = requestAnimationFrame(tick);
      if (t - lastScan < SCAN_INTERVAL_MS) return;
      lastScan = t;
      const video = videoRef.current;
      if (!ctx || !video || video.readyState < 2 || !video.videoWidth) return;
      const scale = Math.min(1, MAX_DECODE_WIDTH / video.videoWidth);
      const w = Math.round(video.videoWidth * scale);
      const h = Math.round(video.videoHeight * scale);
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
      }
      let text: string | undefined;
      try {
        ctx.drawImage(video, 0, 0, w, h);
        text = jsQR(ctx.getImageData(0, 0, w, h).data, w, h, { inversionAttempts: 'dontInvert' })?.data.trim();
      } catch {
        return;
      }
      if (!text) return;
      // Đọc được mã → dừng camera, chờ nhân viên quét tiếp
      cancelled = true;
      stop();
      platform.vibrate(30);
      cbRef.current.onActiveChange(false);
      cbRef.current.onDetected(text, 'camera');
    };

    void (async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
          audio: false,
        });
        const video = videoRef.current;
        if (cancelled || !video) {
          stop();
          return;
        }
        video.srcObject = stream;
        await video.play();
        if (cancelled) return;
        setPhase('live');
        raf = requestAnimationFrame(tick);
      } catch (err) {
        if (cancelled) return;
        stop();
        setIssue(classifyError(err));
        setPhase('error');
        cbRef.current.onActiveChange(false);
      }
    })();

    // Tạm dừng khi ẩn tab / tắt màn hình để không giữ camera
    const onVisibility = () => {
      if (document.visibilityState === 'hidden') cbRef.current.onActiveChange(false);
    };
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      cancelled = true;
      stop();
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [active]);

  // Vạch quét chạy lên xuống (Web Animations API — không cần thêm CSS toàn cục)
  useEffect(() => {
    const el = lineRef.current;
    if (phase !== 'live' || !el || typeof el.animate !== 'function') return;
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;
    const anim = el.animate([{ transform: 'translateY(0%)' }, { transform: 'translateY(100%)' }], {
      duration: 1800,
      iterations: Infinity,
      direction: 'alternate',
      easing: 'ease-in-out',
    });
    return () => anim.cancel();
  }, [phase]);

  const scanNative = async () => {
    if (nativeBusy) return;
    onActiveChange(false);
    setNativeBusy(true);
    try {
      const text = (await platform.scanQRCode())?.trim();
      if (text) cbRef.current.onDetected(text, 'native');
    } catch {
      toast('Không mở được trình quét của Zalo', 'error');
    } finally {
      setNativeBusy(false);
    }
  };

  const copy = phase === 'error' && issue ? ISSUE_COPY[issue] : null;
  const loadingText =
    phase === 'starting'
      ? 'Đang mở camera…'
      : nativeBusy
        ? 'Đang mở trình quét Zalo…'
        : busy && phase !== 'error'
          ? 'Đang tìm đơn…'
          : null;

  const nativeButton = platform.canNativeScan && (
    <Button variant="leaf" size="lg" leftIcon={<Smartphone className="h-5 w-5" />} onClick={() => void scanNative()} loading={nativeBusy}>
      Quét bằng Zalo
    </Button>
  );

  return (
    <div
      className={cn(
        'relative isolate w-full overflow-hidden rounded-[28px] bg-espresso-900 text-cream shadow-lift ring-1 ring-espresso-700',
        'aspect-square max-h-[68vh] sm:aspect-[4/3] md:aspect-[4/5] lg:aspect-square',
        className,
      )}
    >
      <video
        ref={videoRef}
        playsInline
        muted
        aria-hidden
        className={cn('absolute inset-0 h-full w-full object-cover transition-opacity duration-300', phase === 'live' ? 'opacity-100' : 'opacity-0')}
      />

      {phase === 'live' ? (
        <>
          <Viewfinder lineRef={lineRef} />
          <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-3 bg-gradient-to-t from-espresso-900/90 via-espresso-900/50 to-transparent px-4 pb-4 pt-12">
            <span className="flex items-center gap-2 text-sm font-medium text-cream/90" role="status">
              <span className="relative flex h-2.5 w-2.5" aria-hidden>
                <span className="absolute inset-0 animate-ping rounded-full bg-leaf-light/70" />
                <span className="relative h-2.5 w-2.5 rounded-full bg-leaf-light" />
              </span>
              Đang quét…
            </span>
            <Button variant="light" leftIcon={<Pause className="h-4 w-4" />} onClick={() => onActiveChange(false)}>
              Tạm dừng
            </Button>
          </div>
        </>
      ) : (
        <div className="absolute inset-0">
          <img src={barPhoto} alt="" aria-hidden className="h-full w-full scale-105 object-cover opacity-70 blur-[1.5px]" />
          <div className="absolute inset-0 bg-gradient-to-t from-espresso-900 via-espresso-900/85 to-espresso-900/45" />
          {/* `!h-5`: Logo mặc định có h-8 nên cần ưu tiên để thu nhỏ */}
          <Logo className="absolute left-5 top-5 !h-5 text-cream/85" />

          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 px-6 pt-8 text-center" aria-live="polite">
            {loadingText ? (
              <>
                <LoaderCircle className="h-9 w-9 animate-spin text-gold" aria-hidden />
                <p className="text-sm font-medium text-cream/90">{loadingText}</p>
              </>
            ) : copy ? (
              <>
                <span className="flex h-14 w-14 items-center justify-center rounded-full bg-rattan/90 text-white ring-4 ring-rattan/25" aria-hidden>
                  <CameraOff className="h-6 w-6" />
                </span>
                <div>
                  <p className="font-display text-lg font-bold text-cream">{copy.title}</p>
                  <p className="mx-auto mt-1 max-w-xs text-[13px] leading-snug text-cream/75">{copy.body}</p>
                </div>
                <div className="flex flex-wrap justify-center gap-2">
                  {nativeButton}
                  {copy.retry && (
                    <Button variant="light" leftIcon={<RotateCcw className="h-4 w-4" />} onClick={() => onActiveChange(true)}>
                      Thử lại
                    </Button>
                  )}
                </div>
              </>
            ) : (
              <>
                <span className="flex h-14 w-14 items-center justify-center rounded-full bg-gold/15 text-gold ring-1 ring-gold/40" aria-hidden>
                  <ScanLine className="h-7 w-7" />
                </span>
                <div>
                  <p className="font-display text-lg font-bold text-cream">{startedOnce ? 'Đã tạm dừng quét' : 'Sẵn sàng quét mã'}</p>
                  <p className="mx-auto mt-1 max-w-xs text-[13px] leading-snug text-cream/75">
                    Hướng camera vào mã QR trên điện thoại của khách.
                  </p>
                </div>
                <div className="flex flex-wrap justify-center gap-2">
                  {nativeButton}
                  <Button
                    variant={platform.canNativeScan ? 'light' : 'gold'}
                    size="lg"
                    leftIcon={<Camera className="h-5 w-5" />}
                    onClick={() => onActiveChange(true)}
                  >
                    {platform.canNativeScan ? 'Dùng camera' : startedOnce ? 'Quét tiếp' : 'Bật camera'}
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
