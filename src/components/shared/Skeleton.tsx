import React from 'react';

interface SkeletonProps {
  className?: string;
  variant?: 'rect' | 'circle' | 'text';
  width?: string | number;
  height?: string | number;
}

export const Skeleton: React.FC<SkeletonProps> = ({ 
  className = "", 
  variant = 'rect',
  width,
  height
}) => {
  const baseStyles = "skeleton";
  const variantStyles = {
    rect: "rounded-lg",
    circle: "rounded-full",
    text: "rounded-md h-4 w-full"
  };

  const style: React.CSSProperties = {
    width: width,
    height: height
  };

  return (
    <div 
      className={`${baseStyles} ${variantStyles[variant]} ${className}`}
      style={style}
    />
  );
};
