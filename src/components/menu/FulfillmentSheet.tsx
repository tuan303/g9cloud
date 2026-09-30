import { useState } from 'react';
import { Clock, MapPin } from 'lucide-react';
import { APP_CONFIG } from '@/config/app';
import { BottomSheet, Button } from '@/components/ui';
import { FulfillmentPicker } from '@/components/customer/FulfillmentPicker';
import { formatPrice } from '@/lib/format';
import { useSession } from '@/store/session';
import { toast } from '@/store/ui';
import type { FulfillmentType } from '@/types';
import { useStableCallback } from './menu-utils';

/** Bảng chọn hình thức nhận món (đổi nhanh từ trang Thực đơn). Chỉ lưu khi bấm "Xác nhận". */
export function FulfillmentSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  // Không render khi đóng → bản nháp luôn khởi tạo lại từ phiên khi mở
  if (!open) return null;
  return <FulfillmentSheetBody onClose={onClose} />;
}

function FulfillmentSheetBody({ onClose: onCloseProp }: { onClose: () => void }) {
  const onClose = useStableCallback(onCloseProp);
  const savedFulfillment = useSession((s) => s.fulfillment);
  const savedAddress = useSession((s) => s.deliveryAddress);
  const setFulfillment = useSession((s) => s.setFulfillment);

  const [value, setValue] = useState<FulfillmentType>(savedFulfillment);
  const [address, setAddress] = useState(savedAddress);
  const [error, setError] = useState<string>();

  const { shop, fulfillment } = APP_CONFIG;

  const save = () => {
    if (value === 'delivery') {
      const addr = address.trim();
      if (!addr) {
        setError('Bạn nhập giúp nơi giao (lớp hoặc phòng ban) nhé');
        return;
      }
      setFulfillment('delivery', addr);
      toast(`Quán sẽ giao đến ${addr}`, 'success');
    } else {
      setFulfillment('pickup');
      toast('Bạn sẽ nhận món tại quầy', 'success');
    }
    onClose();
  };

  return (
    <BottomSheet
      open
      onClose={onClose}
      title="Hình thức nhận món"
      footer={
        <Button block size="lg" onClick={save}>
          Xác nhận
        </Button>
      }
    >
      <p className="mb-4 text-sm text-stone">Bạn muốn ghé quầy lấy món hay để quán mang đến tận nơi?</p>
      <FulfillmentPicker
        value={value}
        onChange={(v) => {
          setValue(v);
          setError(undefined);
        }}
        address={address}
        onAddressChange={(v) => {
          setAddress(v);
          if (error) setError(undefined);
        }}
        addressError={error}
      />
      {value === 'delivery' && fulfillment.delivery.minOrder > 0 && (
        <p className="mt-3 px-1 text-xs text-stone">Giao tận nơi cho đơn từ {formatPrice(fulfillment.delivery.minOrder)}.</p>
      )}
      {value === 'pickup' && (
        <div className="mt-4 space-y-2 rounded-2xl bg-white p-4 text-sm text-bronze-800 ring-1 ring-bronze-200/60">
          <p className="flex items-center gap-2.5">
            <MapPin className="h-4 w-4 shrink-0 text-bronze-500" aria-hidden />
            Quầy {shop.name} · {shop.location}
          </p>
          <p className="flex items-center gap-2.5">
            <Clock className="h-4 w-4 shrink-0 text-bronze-500" aria-hidden />
            {shop.openingHours}
          </p>
        </div>
      )}
    </BottomSheet>
  );
}
