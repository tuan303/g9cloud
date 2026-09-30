import type { ChangeEvent } from 'react';
import { IdCard, Mail, Phone, UserRound } from 'lucide-react';
import { Input } from '@/components/ui';
import {
  schoolDomainHint,
  schoolEmailPlaceholder,
  type ProfileField,
  type ProfileFormState,
  type ProfileRules,
} from './profile-form';

const iconCls = 'h-[18px] w-[18px]';

/**
 * Các ô hồ sơ: Email trường · Họ và tên · Số điện thoại · Mã HS/NV.
 * Hiện/ẩn và bắt buộc theo `rules`. Dùng chung cho màn hình chào và bảng chỉnh sửa.
 */
export function ProfileFields({
  form,
  rules,
  phoneHint,
}: {
  form: ProfileFormState;
  rules: ProfileRules;
  /** Gợi ý dưới ô SĐT (khi chưa có lỗi) */
  phoneHint?: string;
}) {
  const { values, errors, setField, blurField } = form;
  const bind = (field: ProfileField) => ({
    value: values[field],
    error: errors[field],
    onChange: (e: ChangeEvent<HTMLInputElement>) => setField(field, e.target.value),
    onBlur: () => blurField(field, rules),
  });

  return (
    <div className="space-y-4">
      {rules.email !== 'hidden' && (
        <Input
          {...bind('email')}
          label="Email trường"
          required={rules.email === 'required'}
          readOnly={rules.email === 'readonly'}
          type="email"
          inputMode="email"
          autoComplete="email"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          placeholder={schoolEmailPlaceholder}
          hint={rules.email === 'readonly' ? 'Email dùng để đăng nhập nên không đổi được' : schoolDomainHint}
          icon={<Mail className={iconCls} />}
          className="read-only:bg-bronze-50 read-only:text-stone read-only:focus:ring-bronze-300"
        />
      )}

      <Input
        {...bind('name')}
        label="Họ và tên"
        required={rules.name === 'required'}
        autoComplete="name"
        autoCapitalize="words"
        maxLength={60}
        placeholder="VD: Nguyễn Minh An"
        hint={rules.name === 'optional' ? 'Không bắt buộc' : undefined}
        icon={<UserRound className={iconCls} />}
      />

      <Input
        {...bind('phone')}
        label="Số điện thoại"
        required={rules.phone === 'required'}
        type="tel"
        inputMode="tel"
        autoComplete="tel"
        maxLength={16}
        placeholder="0912 345 678"
        hint={phoneHint ?? (rules.phone === 'optional' ? 'Không bắt buộc' : 'Để quán gọi bạn khi món sẵn sàng')}
        icon={<Phone className={iconCls} />}
      />

      {rules.studentId !== 'hidden' && (
        <Input
          {...bind('studentId')}
          label="Mã học sinh / nhân viên"
          autoComplete="off"
          autoCapitalize="characters"
          autoCorrect="off"
          spellCheck={false}
          maxLength={20}
          placeholder="VD: HS2025-0123"
          hint="Không bắt buộc"
          icon={<IdCard className={iconCls} />}
        />
      )}
    </div>
  );
}
