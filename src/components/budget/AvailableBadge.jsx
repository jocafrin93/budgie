
const AvailableBadge = ({ amount, isSubItem, onClick, category }) => {
    const formatCurrency = (amount) => {
        const numAmount = typeof amount === 'number' ? amount : parseFloat(amount) || 0;
        return `$${numAmount.toFixed(2)}`;
    };

    const isOverspent = amount < 0;
    const hasAmount = Math.abs(amount) > 0;

    // Determine badge styling based on amount and context
    const getBadgeStyles = () => {
        if (isOverspent) {
            return {
                bg: 'bg-error/20 hover',
                text: 'text-error',
                border: 'border-error',
                cursor: hasAmount ? 'cursor-pointer' : 'cursor-default'
            };
        } else if (hasAmount) {
            return {
                bg: isSubItem ? 'bg-success/20 hover' : 'bg-success/20 hover',
                text: isSubItem ? 'text-success' : 'text-success',
                border: 'border-success',
                cursor: 'cursor-pointer'
            };
        } else {
            return {
                bg: 'bg-base-200',
                text: 'text-base-content/60',
                border: 'border-base-300',
                cursor: 'cursor-default'
            };
        }
    };

    const styles = getBadgeStyles();
    const isClickable = hasAmount && onClick;

    const handleClick = (e) => {
        e.stopPropagation();
        if (isClickable) {
            onClick(category);
        }
    };

    return (
        <button
            onClick={handleClick}
            disabled={!isClickable}
            className={`
                inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border
                transition-all duration-200 transform
                ${styles.bg} ${styles.text} ${styles.border} ${styles.cursor}
                ${isClickable ? 'hover:scale-105 hover:shadow-sm active:scale-95' : ''}
                ${!isClickable ? 'opacity-75' : ''}
                focus:outline-none focus:border-primary
            `}
            title={isClickable ? `Click to move money ${isOverspent ? 'to' : 'from'} ${category?.name || 'this category'}` : undefined}
        >
            <span className="flex items-center gap-1">
                {isOverspent && <span className="text-xs">⚠️</span>}
                {hasAmount && !isOverspent && <span className="text-xs">💰</span>}
                {formatCurrency(amount)}
                {isClickable && (
                    <span className="ml-1 text-xs opacity-60">
                        {isOverspent ? '📥' : '📤'}
                    </span>
                )}
            </span>
        </button>
    );
};

export default AvailableBadge;
