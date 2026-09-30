import type { PlatformAdapter } from './types';
import { webPlatform } from './web';

/**
 * Chọn adapter theo môi trường chạy.
 * Bản hiện tại: web. Khi đóng gói Zalo Mini App, xem docs/ZALO_MINI_APP.md để bật adapter Zalo.
 */
export const platform: PlatformAdapter = webPlatform;

export type { PlatformAdapter, PlatformProfile } from './types';
export type { KVStorage } from './storage';
