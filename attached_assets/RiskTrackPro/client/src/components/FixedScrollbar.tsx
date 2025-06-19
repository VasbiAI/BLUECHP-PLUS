import React, { useEffect, useRef, useState } from 'react';

interface FixedScrollbarProps {
  targetSelector: string;
  className?: string;
}

/**
 * Creates a fixed scrollbar that controls the scroll position of a target element
 */
const FixedScrollbar: React.FC<FixedScrollbarProps> = ({ targetSelector, className = '' }) => {
  const scrollbarRef = useRef<HTMLDivElement>(null);
  const [targetWidth, setTargetWidth] = useState(0);
  const [targetScrollWidth, setTargetScrollWidth] = useState(0);
  
  useEffect(() => {
    const targetElement = document.querySelector(targetSelector) as HTMLElement;
    if (!targetElement) return;
    
    const updateDimensions = () => {
      setTargetWidth(targetElement.offsetWidth);
      setTargetScrollWidth(targetElement.scrollWidth);
    };
    
    // Handle scrolling
    const handleScroll = () => {
      if (scrollbarRef.current && targetElement) {
        // Sync the target's scroll position with the scrollbar's position
        targetElement.scrollLeft = scrollbarRef.current.scrollLeft;
      }
    };
    
    // Handle scrolling the target
    const handleTargetScroll = () => {
      if (scrollbarRef.current && targetElement) {
        // Sync the scrollbar's position with the target's scroll position
        scrollbarRef.current.scrollLeft = targetElement.scrollLeft;
      }
    };
    
    updateDimensions();
    
    scrollbarRef.current?.addEventListener('scroll', handleScroll);
    targetElement.addEventListener('scroll', handleTargetScroll);
    window.addEventListener('resize', updateDimensions);
    
    // Set up a mutation observer to detect changes in the table
    const observer = new MutationObserver(updateDimensions);
    observer.observe(targetElement, { childList: true, subtree: true });
    
    return () => {
      scrollbarRef.current?.removeEventListener('scroll', handleScroll);
      targetElement.removeEventListener('scroll', handleTargetScroll);
      window.removeEventListener('resize', updateDimensions);
      observer.disconnect();
    };
  }, [targetSelector]);
  
  // Only show the fixed scrollbar if there's actually overflow
  if (targetScrollWidth <= targetWidth) {
    return null;
  }
  
  return (
    <div className={`fixed bottom-14 left-0 right-0 z-50 bg-white border-t border-gray-200 shadow-md px-4 py-1 ${className}`}>
      <div 
        ref={scrollbarRef}
        className="overflow-x-auto" 
        style={{ 
          width: '100%',
          height: '8px',
          overflowY: 'hidden'
        }}
      >
        <div style={{ width: `${targetScrollWidth}px`, height: '1px' }}></div>
      </div>
    </div>
  );
};

export default FixedScrollbar;