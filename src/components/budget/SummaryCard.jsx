/**
 * SummaryCard component
 * A generic, configurable card for displaying summary information
 * Modernized for the new design system
 */
import { Card } from 'components/ui/Card';

const SummaryCard = ({
    title,
    value,
    description,
    icon,
    color = 'neutral',
    progress,
    progressColor,
    children,
    onClick,
    className = '',
}) => {
    // Determine value color class using new design system
    const valueColorClass =
        color === 'green' ? 'text-success' :
            color === 'red' ? 'text-error' :
                color === 'blue' ? 'text-info' :
                    color === 'yellow' ? 'text-warning' :
                        color === 'neutral' ? 'text-gray-900 dark:text-dark-50' :
                            color; // Use custom color class if provided

    // Determine progress color class using new design system
    const progressColorClass =
        progressColor === 'green' ? 'bg-success' :
            progressColor === 'red' ? 'bg-error' :
                progressColor === 'yellow' ? 'bg-warning' :
                    progressColor === 'blue' ? 'bg-info' :
                        progressColor === 'gradient' ? 'bg-gradient-to-r from-warning-light to-error-light' :
                            progressColor || 'bg-success'; // Default to success

    return (
        <Card
            className={`p-4 ${onClick ? 'cursor-pointer hover:shadow-lg transition-shadow' : ''} ${className}`}
            onClick={onClick}
        >
            {/* Card Title */}
            <h3 className="text-sm font-medium text-gray-600 dark:text-dark-300 mb-1">{title}</h3>

            {/* Main Content */}
            <div className="flex items-center justify-between">
                <div>
                    {/* Main Value */}
                    <p className={`text-2xl font-bold ${valueColorClass}`}>
                        {value}
                    </p>

                    {/* Description */}
                    {description && (
                        <p className="text-xs text-gray-500 dark:text-dark-400">
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
                <div className="w-full bg-gray-200 dark:bg-dark-600 rounded-full h-2 mt-2">
                    <div
                        className={`h-2 rounded-full transition-all duration-300 ${progressColorClass}`}
                        style={{ width: `${Math.min(100, progress)}%` }}
                    />
                </div>
            )}

            {/* Additional Content */}
            {children}
        </Card>
    );
};

export default SummaryCard;
