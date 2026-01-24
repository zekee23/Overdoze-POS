import { useCallback } from 'react';
import { EMPTY_VARIANT } from './constants';

export default function useVariants(setVariants) {
  const addVariant = useCallback(() => {
    setVariants(v => [...v, EMPTY_VARIANT()]);
  }, [setVariants]);

  const updateVariant = useCallback((key, field, value) => {
    setVariants(prev =>
      prev.map(v =>
        v.key === key ? { ...v, [field]: value } : v
      )
    );
  }, [setVariants]);

  const removeVariant = useCallback((key) => {
    setVariants(prev => prev.filter(v => v.key !== key));
  }, [setVariants]);

  return { addVariant, updateVariant, removeVariant };
}
