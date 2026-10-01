import { useMemo } from 'react';
import { APP_CONFIG } from '@/config/app';
import { rewardLine } from '@/services/order-logic';
import { useDataStore } from '@/store/data';
import { useSession } from '@/store/session';
import type { CartLine } from '@/types';
import { useMyOrders } from './data';

/**
 * Trạng thái thẻ tích điểm của khách đang đăng nhập.
 *  - stamps: số cốc đang tích (đã trừ các lần đổi)
 *  - progress: số cốc trong vòng hiện tại (0…N-1), toNext: còn bao nhiêu cốc nữa
 *  - rewardsAvailable: số cốc miễn phí dùng được NGAY (đã trừ đơn đổi thưởng đang chờ thanh toán)
 */
export function useLoyalty() {
  const user = useSession((s) => s.user);
  const account = useDataStore((s) => s.loyalty);
  const myOrders = useMyOrders();
  const { enabled, cupsPerReward: per } = APP_CONFIG.loyalty;
  return useMemo(() => {
    const member = enabled && !!user && !user.isGuest;
    const stamps = member ? Math.max(0, account?.stamps ?? 0) : 0; // có thể âm khi hoàn đơn đã dùng để đổi thưởng
    const pendingRedeems = myOrders.filter((o) => o.loyaltyRedeem && o.status === 'pending_payment');
    const earned = Math.floor(stamps / per);
    return {
      enabled,
      member,
      cupsPerReward: per,
      stamps,
      totalCups: account?.totalCups ?? 0,
      progress: stamps % per,
      toNext: per - (stamps % per),
      rewardsAvailable: Math.max(0, earned - pendingRedeems.length),
      pendingRedeemCodes: pendingRedeems.map((o) => o.code),
    };
  }, [enabled, user, account, myOrders, per]);
}

/** Món được miễn phí nếu đổi thưởng trong giỏ hiện tại (cốc nước đắt nhất), undefined nếu không có món nước */
export function useRewardLine(lines: CartLine[]) {
  return useMemo(() => rewardLine(lines), [lines]);
}
