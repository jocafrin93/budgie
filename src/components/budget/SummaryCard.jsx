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
    // Determine value color class using DaisyUI semantic colors
    const valueColorClass =
        color === 'green' ? 'text-success' :
            color === 'red' ? 'text-error' :
                color === 'info' ? 'text-info' :
                    color === 'yellow' ? 'text-warning' :
                        color === 'neutral' ? 'text-base-content' :
                            color; // Use custom color class if provided

    // Determine progress color class using DaisyUI semantic colors
    const progressColorClass =
        progressColor === 'green' ? 'bg-success' :
            progressColor === 'red' ? 'bg-error' :
                progressColor === 'yellow' ? 'bg-warning' :
                    progressColor === 'info' ? 'bg-info' :
                        progressColor === 'gradient' ? 'bg-warning' :
                            progressColor || 'bg-success'; // Default to success

    return (
        <Card
            className={`p-4 ${onClick ? 'cursor-pointer hover:shadow-lg transition-shadow' : ''} ${className}`}
            onClick={onClick}
        >
            {/* Card Title */}
            <h3 className="text-sm font-medium text-base-content/70 mb-1">{title}</h3>

            {/* Main Content */}
            <div className="flex items-center justify-between">
                <div>
                    {/* Main Value */}
                    <p className={`text-2xl font-bold ${valueColorClass}`}>
                        {value}
                    </p>

                    {/* Description */}
                    {description && (
                        <p className="text-xs text-base-content/60">
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
                <div className="w-full bg-base-300 rounded-full h-2 mt-2">
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
