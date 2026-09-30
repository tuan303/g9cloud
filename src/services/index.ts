import { BACKEND } from '@/config/firebase';
import { FirestoreRepository } from '@/services/firestore-repository';
import { LocalRepository } from './local-repository';
import type { DataRepository } from './repository';

/**
 * Điểm chuyển đổi backend:
 *  - 'firebase' (mặc định): Cloud Firestore thời gian thực — dữ liệu dùng chung mọi thiết bị.
 *  - 'local': lưu trên trình duyệt — dùng cho bản xem thử / demo offline (VITE_BACKEND=local).
 */
export const repo: DataRepository = BACKEND === 'firebase' ? new FirestoreRepository() : new LocalRepository();

export type { DataRepository, RepoEvent, Viewer } from './repository';
export { RepoError } from './repository';
