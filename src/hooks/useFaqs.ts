import { useMemo } from 'react';
import { usePublicSettings } from '@/lib/publicSettings';
import { resolveFaqItems } from '@/lib/faq';

export function useFaqs() {
  const query = usePublicSettings(['faq_items']);
  const items = useMemo(() => resolveFaqItems(query.data?.faq_items), [query.data?.faq_items]);
  return { ...query, items };
}
