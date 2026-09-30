import { useCallback, useState } from 'react';
import { APP_CONFIG } from '@/config/app';
import { isValidEmail, isValidVnPhone, normalizePhone } from '@/lib/format';
import type { AuthProvider, CustomerInfo } from '@/types';

export interface ProfileValues {
  email: string;
  name: string;
  phone: string;
  studentId: string;
}
export type ProfileField = keyof ProfileValues;
export type ProfileErrors = Partial<Record<ProfileField, string>>;

/** Quy tắc từng ô: bắt buộc / tuỳ chọn / chỉ đọc / ẩn */
export interface ProfileRules {
  email: 'required' | 'readonly' | 'hidden';
  name: 'required' | 'optional';
  phone: 'required' | 'optional';
  studentId: 'optional' | 'hidden';
}

/** Dữ liệu đã chuẩn hoá, sẵn sàng lưu vào phiên */
export interface ProfileData {
  name: string;
  email?: string;
  phone?: string;
  studentId?: string;
}

export const EMPTY_PROFILE: ProfileValues = { email: '', name: '', phone: '', studentId: '' };

const FIELDS: ProfileField[] = ['email', 'name', 'phone', 'studentId'];

/** Quy tắc theo cách đăng nhập ở màn hình chào */
export const LOGIN_RULES: Record<AuthProvider, ProfileRules> = {
  // SSO Microsoft 365: email lấy từ tài khoản trường (không sửa), tên điền sẵn
  microsoft: { email: 'readonly', name: 'required', phone: 'required', studentId: 'optional' },
  school_email: { email: 'required', name: 'required', phone: 'required', studentId: 'optional' },
  zalo: { email: 'hidden', name: 'required', phone: 'required', studentId: 'optional' },
  // Khách: tên + SĐT tuỳ chọn ở đây, sẽ được hỏi lại lúc thanh toán
  guest: { email: 'hidden', name: 'optional', phone: 'optional', studentId: 'hidden' },
};

/** Quy tắc khi chỉnh sửa hồ sơ ở trang Tài khoản */
export function editRulesFor(user: CustomerInfo): ProfileRules {
  return {
    email: user.email ? 'readonly' : 'hidden',
    name: user.isGuest ? 'optional' : 'required',
    phone: user.isGuest ? 'optional' : 'required',
    studentId: 'optional',
  };
}

// ───────────── Tên miền email trường ─────────────

const DOMAINS = APP_CONFIG.auth.schoolEmailDomains
  .map((d) => d.trim().toLowerCase().replace(/^@/, ''))
  .filter(Boolean);
const DOMAIN_LIST = DOMAINS.map((d) => `@${d}`).join(', ');

export const schoolDomainHint = DOMAINS.length ? `Chỉ nhận email trường (${DOMAIN_LIST})` : undefined;
export const schoolEmailPlaceholder = `ten.ban@${DOMAINS[0] ?? 'truong.edu.vn'}`;

export function matchesSchoolDomain(email: string): boolean {
  if (!DOMAINS.length) return true;
  const domain = email.slice(email.lastIndexOf('@') + 1).toLowerCase();
  // Nhận cả tên miền con, VD hs.truong.edu.vn
  return DOMAINS.some((d) => domain === d || domain.endsWith(`.${d}`));
}

// ───────────── Kiểm tra từng ô ─────────────

export function validateField(field: ProfileField, raw: string, rules: ProfileRules): string | undefined {
  const v = raw.trim();
  switch (field) {
    case 'email':
      if (rules.email !== 'required') return undefined;
      if (!v) return 'Vui lòng nhập email trường';
      if (!isValidEmail(v)) return 'Email chưa đúng định dạng';
      if (!matchesSchoolDomain(v)) return `Vui lòng dùng email trường (${DOMAIN_LIST})`;
      return undefined;
    case 'name':
      if (!v) return rules.name === 'required' ? 'Vui lòng nhập họ và tên' : undefined;
      if (v.length < 2) return 'Tên cần ít nhất 2 ký tự';
      if (v.length > 60) return 'Tên tối đa 60 ký tự';
      return undefined;
    case 'phone':
      if (!v) return rules.phone === 'required' ? 'Vui lòng nhập số điện thoại' : undefined;
      if (!isValidVnPhone(v)) return 'Số điện thoại chưa đúng, VD: 0912 345 678';
      return undefined;
    case 'studentId':
      if (rules.studentId === 'hidden' || !v) return undefined;
      if (v.length > 20) return 'Mã tối đa 20 ký tự';
      if (!/^[A-Za-z0-9._-]+$/.test(v)) return 'Mã chỉ gồm chữ không dấu, số, dấu chấm hoặc gạch';
      return undefined;
  }
}

/** Chuẩn hoá: gọn khoảng trắng, email chữ thường, SĐT dạng 0xxxxxxxxx, mã in hoa */
export function toProfileData(values: ProfileValues, rules: ProfileRules): ProfileData {
  const name = values.name.trim().replace(/\s+/g, ' ');
  const email = rules.email !== 'hidden' && values.email.trim() ? values.email.trim().toLowerCase() : undefined;
  const phone = values.phone.trim() ? normalizePhone(values.phone.trim()) : undefined;
  const studentId = rules.studentId !== 'hidden' && values.studentId.trim() ? values.studentId.trim().toUpperCase() : undefined;
  return { name, email, phone, studentId };
}

/**
 * Trạng thái form hồ sơ. Lỗi chỉ hiện khi rời ô (nếu đã nhập) hoặc khi gửi form,
 * và được xoá ngay khi người dùng sửa lại ô đó — không “la mắng” khi đang gõ.
 */
export function useProfileForm(initial: ProfileValues) {
  const [values, setValues] = useState<ProfileValues>(initial);
  const [errors, setErrors] = useState<ProfileErrors>({});

  const setField = useCallback((field: ProfileField, value: string) => {
    setValues((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => (prev[field] ? { ...prev, [field]: undefined } : prev));
  }, []);

  const blurField = useCallback(
    (field: ProfileField, rules: ProfileRules) => {
      const value = values[field];
      if (!value.trim()) return;
      setErrors((prev) => ({ ...prev, [field]: validateField(field, value, rules) }));
    },
    [values],
  );

  const validate = useCallback(
    (rules: ProfileRules): boolean => {
      const next: ProfileErrors = {};
      for (const f of FIELDS) {
        const e = validateField(f, values[f], rules);
        if (e) next[f] = e;
      }
      setErrors(next);
      return Object.keys(next).length === 0;
    },
    [values],
  );

  const resetErrors = useCallback(() => setErrors({}), []);

  return { values, errors, setValues, setField, blurField, validate, resetErrors };
}

export type ProfileFormState = ReturnType<typeof useProfileForm>;
