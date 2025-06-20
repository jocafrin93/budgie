/**
 * SummaryCard component
 * A generic, configurable card for displaying summary information
 */
import React from 'react';

const SummaryCard = ({
  title,
  value,
  description,
  icon,
  color = 'text-theme-primary',
  progress,
  progressColor,
  children,
  onClick,
  className = '',
}) => {
  // Determine value color class
  const valueColorClass = 
    color === 'green' ? 'text-theme-green' :
    color === 'red' ? 'text-theme-red' :
    color === 'blue' ? 'text-theme-blue' :
    color === 'yellow' ? 'text-theme-yellow' :
    color; // Use custom color class if provided

  // Determine progress color class
  const progressColorClass = 
    progressColor === 'green' ? 'bg-green-500' :
    progressColor === 'red' ? 'bg-red-500' :
    progressColor === 'yellow' ? 'bg-yellow-500' :
    progressColor === 'blue' ? 'bg-blue-500' :
    progressColor === 'gradient' ? 'bg-gradient-to-r from-yellow-400 to-orange-500' :
    progressColor || 'bg-green-500'; // Default to green

  return (
    <div 
      className={`bg-theme-primary rounded-lg p-4 shadow-lg ${onClick ? 'cursor-pointer hover:shadow-xl transition-shadow' : ''} ${className}`}
      onClick={onClick}
    >
      {/* Card Title */}
      <h3 className="text-sm font-medium text-theme-tertiary mb-1">{title}</h3>
      
      {/* Main Content */}
      <div className="flex items-center justify-between">
        <div>
          {/* Main Value */}
          <p className={`text-2xl font-bold ${valueColorClass}`}>
            {value}
          </p>
          
          {/* Description */}
          {description && (
            <p className="text-xs text-theme-secondary">
              {description}
            </p>
          )}
        </div>
        
        {/* Icon */}
        {icon && (
          <div className="text-2xl">
            {icon}
          </div>
        )}
      </div>
      
      {/* Progress Bar */}
      {typeof progress === 'number' && (
        <div className="w-full bg-theme-tertiary rounded-full h-2 mt-2">
          <div
            className={`h-2 rounded-full transition-all duration-300 ${progressColorClass}`}
            style={{ width: `${Math.min(100, progress)}%` }}
          />
        </div>
      )}
      
      {/* Additional Content */}
      {children}
    </div>
  );
};

export default SummaryCard;