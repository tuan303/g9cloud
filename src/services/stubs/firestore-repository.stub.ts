// Stub dùng cho bản build một file (VITE_BACKEND=local) — không nhúng Firebase SDK.
import type { DataRepository } from '../repository';

export class FirestoreRepository {
  constructor() {
    throw new Error('Firebase không có trong bản build này (VITE_BACKEND=local)');
  }
}

export type _Unused = DataRepository;
