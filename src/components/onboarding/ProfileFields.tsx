import type { ChangeEvent } from 'react';
import { IdCard, Mail, Phone, UserRound } from 'lucide-react';
import { Input } from '@/components/ui';
import { useT } from '@/i18n';
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
  const { t } = useT();
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
          label={t('onboarding.fields.emailLabel')}
          required={rules.email === 'required'}
          readOnly={rules.email === 'readonly'}
          type="email"
          inputMode="email"
          autoComplete="email"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          placeholder={schoolEmailPlaceholder()}
          hint={rules.email === 'readonly' ? t('onboarding.fields.emailReadonlyHint') : schoolDomainHint()}
          icon={<Mail className={iconCls} />}
          className="read-only:bg-bronze-50 read-only:text-stone read-only:focus:ring-bronze-300"
        />
      )}

      <Input
        {...bind('name')}
        label={t('onboarding.fields.nameLabel')}
        required={rules.name === 'required'}
        autoComplete="name"
        autoCapitalize="words"
        maxLength={60}
        placeholder={t('onboarding.fields.namePlaceholder')}
        hint={rules.name === 'optional' ? t('common.optional') : undefined}
        icon={<UserRound className={iconCls} />}
      />

      <Input
        {...bind('phone')}
        label={t('onboarding.fields.phoneLabel')}
        required={rules.phone === 'required'}
        type="tel"
        inputMode="tel"
        autoComplete="tel"
        maxLength={16}
        placeholder="0912 345 678"
        hint={phoneHint ?? (rules.phone === 'optional' ? t('common.optional') : t('onboarding.fields.phoneHint'))}
        icon={<Phone className={iconCls} />}
      />

      {rules.studentId !== 'hidden' && (
        <Input
          {...bind('studentId')}
          label={t('onboarding.fields.studentIdLabel')}
          autoComplete="off"
          autoCapitalize="characters"
          autoCorrect="off"
          spellCheck={false}
          maxLength={20}
          placeholder={t('onboarding.fields.studentIdPlaceholder')}
          hint={t('common.optional')}
          icon={<IdCard className={iconCls} />}
        />
      )}
    </div>
  );
}
