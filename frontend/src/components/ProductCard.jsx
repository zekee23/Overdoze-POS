import { memo, useMemo, useCallback } from 'react';
import { useIntersectionObserver } from '../hooks/useIntersectionObserver';

const ProductCard = memo(({ product, onClick }) => {
  const { targetRef, hasIntersected } = useIntersectionObserver({
    threshold: 0.1,
    rootMargin: '50px'
  });
  
  const categoryStyle = useMemo(() => ({
    emoji: product.emoji || '🍽️',
    color: product.accentColor || '#e0a74a'
  }), [product.emoji, product.accentColor]);

  const defaultPrice = useMemo(() => {
    if (!product.variants || product.variants.length === 0) return 0;
    return product.variants.find(v => v.is_default)?.price || product.variants[0].price;
  }, [product.variants]);

  const handleClick = useCallback(() => {
    onClick(product);
  }, [product, onClick]);

  return (
    <div 
      ref={targetRef}
      className="product-card"
      onClick={handleClick}
      style={{
        '--card-color': categoryStyle.color,
        '--card-hover': `${categoryStyle.color}15`,
        '--card-border': `${categoryStyle.color}30`,
      }}
    >
      {hasIntersected && (
        <>
          <div className="category-indicator" style={{ backgroundColor: categoryStyle.color }}>
            <span className="category-emoji">{categoryStyle.emoji}</span>
          </div>
          
          <div className="product-content">
            <div className="product-header">
              <h3 className="product-name">{product.product_name}</h3>
              <div className="category-badge" style={{ 
                backgroundColor: `${categoryStyle.color}20`, 
                color: categoryStyle.color 
              }}>
                {product.category_name || 'Uncategorized'}
              </div>
            </div>
            
            {product.variants && product.variants.length > 0 && (
              <div className="price-info">
                <span className="price">
                  ₱{defaultPrice}
                </span>
                {product.variants.length > 1 && (
                  <span className="variant-count">{product.variants.length} sizes</span>
                )}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
});

export default ProductCard;
