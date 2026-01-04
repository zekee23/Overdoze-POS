import { useCallback } from 'react';

export const useCartOperations = (products, sugarLevels, addons) => {
  const getCartItemKey = useCallback((item) => {
    const addonIds = (item.addons || []).map(a => a.add_id).sort().join(',');
    const sugarId = item.sugar?.sugarlevel_id || 'none';
    return `${item.product_id}-${item.variant.variant_id}-${sugarId}-${addonIds}`;
  }, []);

  const handleAddToCart = useCallback((newItem, setCart) => {
    setCart(prevCart => {
      const newItemKey = getCartItemKey(newItem);
      const existingIndex = prevCart.findIndex(item => getCartItemKey(item) === newItemKey);

      const product = products.find(p => p.product_id === newItem.product_id);
      const variant = product?.variants?.find(v => v.variant_id === newItem.variant.variant_id);

      const sugar = newItem.sugar
        ? {
            ...newItem.sugar,
            name: sugarLevels.find(s => s.id === newItem.sugar.sugarlevel_id)?.level_name
          }
        : null;

      const addonsWithNames = (newItem.addons ?? []).map(addon => ({
        ...addon,
        extras_name: addons.find(a => a.add_id === addon.add_id)?.extras_name
      }));

      if (existingIndex !== -1) {
        const updated = [...prevCart];
        const existing = updated[existingIndex];
        const newQty = existing.quantity + newItem.quantity;

        updated[existingIndex] = {
          ...existing,
          quantity: newQty,
          totalPrice:
            ((variant?.price || 0) +
              addonsWithNames.reduce((sum, a) => sum + a.price, 0)) * newQty
        };

        return updated;
      }

      return [
        ...prevCart,
        {
          ...newItem,
          product_name: product?.product_name || 'Unnamed Product',
          variant: {
            ...newItem.variant,
            size_label: variant?.size_label || ''
          },
          sugar,
          addons: addonsWithNames,
          timeAdded: new Date().toLocaleTimeString()
        }
      ];
    });
  }, [getCartItemKey, products, sugarLevels, addons]);

  const updateQty = useCallback((index, change, e, cart, setCart) => {
    e?.preventDefault();
    e?.stopPropagation();
    
    setCart(prev => {
      const updated = [...prev];
      const newQty = updated[index].quantity + change;

      if (newQty <= 0) return prev;

      updated[index] = {
        ...updated[index],
        quantity: newQty,
        totalPrice: (updated[index].variant.price + 
                    updated[index].addons.reduce((s, a) => s + a.price, 0)) * newQty
      };
      
      return updated;
    });
  }, []);

  return { handleAddToCart, updateQty, getCartItemKey };
};
