import React, { memo, useMemo } from 'react';
import ProductCard from './ProductCard';
import { getCategoryStyle } from '../constants/categoryStyles';

const VirtualProductGrid = memo(({ products, onProductClick, categories }) => {

  const displayProducts = useMemo(() => {
    return products || [];
  }, [products]);

  if (!products || products.length === 0) {
    return <div className="no-products">No products found</div>;
  }

  return (
    <div className="products-grid">
      {displayProducts.map((product) => {
        const categoryStyle = getCategoryStyle(product.category_id);
        return (
          <ProductCard
            key={product.product_id}
            product={{
              ...product,
              category_name: categories.find(c => c.category_id === product.category_id)?.category_name || 'Uncategorized',
              accentColor: categoryStyle.color,
              emoji: categoryStyle.image
            }}
            onClick={onProductClick}
          />
        );
      })}
    </div>
  );
});

export default VirtualProductGrid;
