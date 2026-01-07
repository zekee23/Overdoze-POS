import { memo, useMemo, useCallback } from 'react';
import { FixedSizeList as List } from 'react-window';
import { useIntersectionObserver } from '../hooks/useIntersectionObserver';

const VirtualizedListItem = memo(({ index, style, data }) => {
  const { items, renderItem, itemHeight } = data;
  const item = items[index];
  
  return (
    <div style={style}>
      {renderItem(item, index)}
    </div>
  );
});

const VirtualizedList = memo(({ 
  items, 
  renderItem, 
  itemHeight = 100, 
  height = 400,
  className = '',
  overscanCount = 5
}) => {
  const { targetRef, hasIntersected } = useIntersectionObserver({
    threshold: 0.1,
    rootMargin: '200px'
  });

  const itemData = useMemo(() => ({
    items,
    renderItem,
    itemHeight
  }), [items, renderItem, itemHeight]);

  if (!hasIntersected) {
    return (
      <div 
        ref={targetRef} 
        className={`virtualized-list-placeholder ${className}`}
        style={{ height: `${Math.min(items.length * itemHeight, height)}px` }}
      >
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          height: '100%',
          color: '#666'
        }}>
          Loading items...
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className={`virtualized-list-empty ${className}`} style={{ height }}>
        No items to display
      </div>
    );
  }

  return (
    <div ref={targetRef} className={`virtualized-list ${className}`}>
      <List
        height={height}
        itemCount={items.length}
        itemSize={itemHeight}
        itemData={itemData}
        overscanCount={overscanCount}
      >
        {VirtualizedListItem}
      </List>
    </div>
  );
});

export default VirtualizedList;
