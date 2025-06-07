import React, { useRef } from 'react';
import { useDrag, useDrop } from 'react-dnd';

const DraggableCategory = ({
    category,
    index,
    children,
    onReorder,
}) => {
    const ref = useRef(null);

    const [{ handlerId }, drop] = useDrop({
        accept: 'category',
        collect(monitor) {
            return {
                handlerId: monitor.getHandlerId(),
            };
        },
        hover(item, monitor) {
            console.log('Category hover triggered', { dragIndex: item.index, hoverIndex: index });

            if (!ref.current) {
                console.log('No ref.current');
                return;
            }

            const dragIndex = item.index;
            const hoverIndex = index;

            if (dragIndex === hoverIndex) {
                return;
            }

            console.log('About to reorder categories', { dragIndex, hoverIndex });
            onReorder(dragIndex, hoverIndex);
            item.index = hoverIndex;
        },
    });

    const [{ isDragging }, drag] = useDrag({
        type: 'category',
        item: () => {
            console.log('Category drag started', { id: category.id, index });
            return { id: category.id, index };
        },
        collect: (monitor) => ({
            isDragging: monitor.isDragging(),
        }),
        end: (item, monitor) => {
            console.log('Category drag ended', { item, didDrop: monitor.didDrop() });
        },
    });

    const opacity = isDragging ? 0.4 : 1;

    // Connect both drag and drop to the same ref
    drag(drop(ref));

    console.log('Category render', {
        categoryName: category.name,
        index,
        isDragging,
        handlerId,
        refCurrent: !!ref.current
    });

    return (
        <div
            ref={ref}
            style={{
                opacity,
                cursor: isDragging ? 'grabbing' : 'grab',
                userSelect: 'none' // Prevent text selection
            }}
            data-handler-id={handlerId}
            onMouseDown={(e) => {
                console.log('Category mousedown', { target: e.target.tagName });
            }}
        >
            {children}
        </div>
    );
};

// Test component to verify react-dnd is working
const SimpleDragTest = () => {
    const [items, setItems] = React.useState(['Item 1', 'Item 2', 'Item 3']);

    const moveItem = (dragIndex, hoverIndex) => {
        console.log('Moving item', { dragIndex, hoverIndex });
        setItems(prev => {
            const newItems = [...prev];
            const draggedItem = newItems[dragIndex];
            newItems.splice(dragIndex, 1);
            newItems.splice(hoverIndex, 0, draggedItem);
            return newItems;
        });
    };

    return (
        <div className="p-4 border border-red-500 mb-4">
            <h3>Drag Test (should work if react-dnd is functioning)</h3>
            {items.map((item, index) => (
                <DraggableCategory
                    key={item}
                    category={{ id: item, name: item }}
                    index={index}
                    onReorder={moveItem}
                >
                    <div className="p-2 m-1 bg-blue-100 border">
                        {item} (drag me)
                    </div>
                </DraggableCategory>
            ))}
        </div>
    );
};

export { DraggableCategory, SimpleDragTest };