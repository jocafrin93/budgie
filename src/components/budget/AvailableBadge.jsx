
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
                bg: 'bg-red-100 hover:bg-red-200',
                text: 'text-red-800',
                border: 'border-red-300',
                cursor: hasAmount ? 'cursor-pointer' : 'cursor-default'
            };
        } else if (hasAmount) {
            return {
                bg: isSubItem ? 'bg-green-100 hover:bg-green-200' : 'bg-green-100 hover:bg-green-200',
                text: isSubItem ? 'text-green-700' : 'text-green-800',
                border: 'border-green-300',
                cursor: 'cursor-pointer'
            };
        } else {
            return {
                bg: 'bg-gray-100',
                text: 'text-gray-600',
                border: 'border-gray-300',
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
                focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1
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
