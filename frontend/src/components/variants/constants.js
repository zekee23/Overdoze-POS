export const SIZE_OPTIONS = [
  { label: 'Standard', value: 'Standard' },
  { label: '16oz', value: '16oz' },
  { label: '22oz', value: '22oz' }
];

export const EMPTY_VARIANT = () => ({
  key: crypto.randomUUID(),
  size_label: '',
  price: '',
  is_default: false
});
