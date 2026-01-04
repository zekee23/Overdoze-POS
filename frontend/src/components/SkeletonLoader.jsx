import React from 'react';
import './SkeletonLoader.css';

const SkeletonLoader = ({ type = 'card' }) => {
  if (type === 'card') {
    return (
      <div className="skeleton-card">
        <div className="skeleton-header">
          <div className="skeleton-badge"></div>
        </div>
        <div className="skeleton-content">
          <div className="skeleton-title"></div>
          <div className="skeleton-subtitle"></div>
          <div className="skeleton-price"></div>
        </div>
      </div>
    );
  }

  if (type === 'grid') {
    return (
      <div className="skeleton-grid">
        {Array.from({ length: 8 }).map((_, index) => (
          <SkeletonLoader key={index} type="card" />
        ))}
      </div>
    );
  }

  return <div className="skeleton"></div>;
};

export default SkeletonLoader;
