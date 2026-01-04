import React, { useState, memo } from 'react';
import { useIntersectionObserver } from '../hooks/useIntersectionObserver';

const LazyImage = memo(({ 
  src, 
  alt, 
  className = '', 
  placeholder = '/placeholder.png',
  onLoad,
  ...props 
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const { targetRef, hasIntersected } = useIntersectionObserver({
    threshold: 0.1,
    rootMargin: '50px'
  });

  const handleLoad = () => {
    setIsLoaded(true);
    onLoad?.();
  };

  const handleError = () => {
    setHasError(true);
  };

  return (
    <div ref={targetRef} className={`lazy-image-container ${className}`}>
      {hasIntersected && !hasError && (
        <img
          src={src}
          alt={alt}
          onLoad={handleLoad}
          onError={handleError}
          style={{
            opacity: isLoaded ? 1 : 0,
            transition: 'opacity 0.3s ease'
          }}
          {...props}
        />
      )}
      {(!hasIntersected || !isLoaded || hasError) && (
        <div 
          className="image-placeholder"
          style={{
            backgroundColor: '#f0f0f0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '100px'
          }}
        >
          {hasError ? '⚠️' : '⏳'}
        </div>
      )}
    </div>
  );
});

export default LazyImage;
