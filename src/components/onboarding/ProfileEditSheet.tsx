import { useId, useRef, type FormEvent } from 'react';
import { Check } from 'lucide-react';
import { BottomSheet, Button } from '@/components/ui';
import { useT } from '@/i18n';
import { useSession } from '@/store/session';
import { toast } from '@/store/ui';
import type { CustomerInfo } from '@/types';
import { GUEST_NAME, focusFirstInvalid, formatPhoneDisplay } from './helpers';
import { editRulesFor, toProfileData, useProfileForm } from './profile-form';
import { ProfileFields } from './ProfileFields';

function ProfileEditForm({ id, user, onSaved }: { id: string; user: CustomerInfo; onSaved: () => void }) {
  const { t } = useT();
  const updateProfile = useSession((s) => s.updateProfile);
  const formRef = useRef<HTMLFormElement>(null);
  const rules = editRulesFor(user);
  const form = useProfileForm({
    email: user.email ?? '',
    name: user.isGuest && user.name === GUEST_NAME ? '' : user.name,
    phone: user.phone ? formatPhoneDisplay(user.phone) : '',
    studentId: user.studentId ?? '',
  });

  const submit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!form.validate(rules)) {
      focusFirstInvalid(formRef.current);
      return;
    }
    const data = toProfileData(form.values, rules);
    updateProfile({ name: data.name || GUEST_NAME, phone: data.phone, studentId: data.studentId });
    toast(t('onboarding.edit.saved'), 'success');
    onSaved();
  };

  return (
    <form id={id} ref={formRef} noValidate onSubmit={submit} className="pt-1">
      <ProfileFields
        form={form}
        rules={rules}
        phoneHint={user.isGuest ? t('onboarding.edit.guestPhoneHint') : undefined}
      />
    </form>
  );
}

/** Bảng trượt sửa tên / SĐT / mã HS-NV. Form được tạo mới mỗi lần mở (không giữ nháp cũ). */
export function ProfileEditSheet({ open, onClose, user }: { open: boolean; onClose: () => void; user: CustomerInfo }) {
  const { t } = useT();
  const formId = useId();
  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      title={t('onboarding.edit.title')}
      footer={
        <Button type="submit" form={formId} size="lg" block leftIcon={<Check className="h-5 w-5" />}>
          {t('onboarding.edit.save')}
        </Button>
      }
    >
      <ProfileEditForm id={formId} user={user} onSaved={onClose} />
    </BottomSheet>
  );
}
