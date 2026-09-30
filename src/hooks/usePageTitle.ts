import { useEffect } from 'react';
import { platform } from '@/platform';

export function usePageTitle(title: string) {
  useEffect(() => {
    platform.setTitle(title);
  }, [title]);
}
