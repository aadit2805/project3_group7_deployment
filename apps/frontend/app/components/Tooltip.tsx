'use client';

import React, { useState, useRef, useEffect } from 'react';

interface TooltipProps {
  text: string;
  children: React.ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right';
  className?: string;
  ariaLabel?: string;
}

const Tooltip: React.FC<TooltipProps> = ({
  text,
  children,
  position = 'top',
  className = '',
  ariaLabel,
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 });
  const tooltipRef = useRef<HTMLDivElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isVisible && tooltipRef.current && wrapperRef.current) {
      const wrapperRect = wrapperRef.current.getBoundingClientRect();
      const tooltipRect = tooltipRef.current.getBoundingClientRect();
      const scrollY = window.scrollY;
      const scrollX = window.scrollX;

      let top = 0;
      let left = 0;

      switch (position) {
        case 'top':
          top = wrapperRect.top + scrollY - tooltipRect.height - 8;
          left = wrapperRect.left + scrollX + wrapperRect.width / 2 - tooltipRect.width / 2;
          break;
        case 'bottom':
          top = wrapperRect.bottom + scrollY + 8;
          left = wrapperRect.left + scrollX + wrapperRect.width / 2 - tooltipRect.width / 2;
          break;
        case 'left':
          top = wrapperRect.top + scrollY + wrapperRect.height / 2 - tooltipRect.height / 2;
          left = wrapperRect.left + scrollX - tooltipRect.width - 8;
          break;
        case 'right':
          top = wrapperRect.top + scrollY + wrapperRect.height / 2 - tooltipRect.height / 2;
          left = wrapperRect.right + scrollX + 8;
          break;
      }

      // Keep tooltip within viewport
      const padding = 8;
      if (top < scrollY + padding) {
        top = scrollY + padding;
      }
      if (left < scrollX + padding) {
        left = scrollX + padding;
      }
      if (left + tooltipRect.width > scrollX + window.innerWidth - padding) {
        left = scrollX + window.innerWidth - tooltipRect.width - padding;
      }
      if (top + tooltipRect.height > scrollY + window.innerHeight - padding) {
        top = scrollY + window.innerHeight - tooltipRect.height - padding;
      }

      setTooltipPosition({ top, left });
    }
  }, [isVisible, position]);

  const showTooltip = () => setIsVisible(true);
  const hideTooltip = () => setIsVisible(false);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      hideTooltip();
    }
  };

  // Add aria-label to child if it's a button/link and doesn't have one
  const childWithProps = React.Children.map(children, (child) => {
    if (React.isValidElement(child)) {
      const props: any = {
        onMouseEnter: showTooltip,
        onMouseLeave: hideTooltip,
        onFocus: showTooltip,
        onBlur: hideTooltip,
        onKeyDown: handleKeyDown,
        'aria-label': ariaLabel || (typeof child.props['aria-label'] === 'undefined' ? text : undefined),
      };
      return React.cloneElement(child, props);
    }
    return child;
  });

  return (
    <div ref={wrapperRef} className={`relative inline-block ${className}`}>
      {childWithProps}
      {isVisible && text && (
        <div
          ref={tooltipRef}
          role="tooltip"
          className={`fixed z-50 px-3 py-2 text-sm text-white bg-gray-900 rounded-md shadow-lg pointer-events-none whitespace-nowrap ${
            isVisible ? 'opacity-100' : 'opacity-0'
          }`}
          style={{
            top: `${tooltipPosition.top}px`,
            left: `${tooltipPosition.left}px`,
          }}
          id={`tooltip-${text.replace(/\s+/g, '-').toLowerCase()}`}
        >
          {text}
          {/* Tooltip arrow */}
          <div
            className={`absolute w-2 h-2 bg-gray-900 transform rotate-45 ${
              position === 'top'
                ? 'bottom-[-4px] left-1/2 -translate-x-1/2'
                : position === 'bottom'
                ? 'top-[-4px] left-1/2 -translate-x-1/2'
                : position === 'left'
                ? 'right-[-4px] top-1/2 -translate-y-1/2'
                : 'left-[-4px] top-1/2 -translate-y-1/2'
            }`}
          />
        </div>
      )}
    </div>
  );
};

export default Tooltip;
