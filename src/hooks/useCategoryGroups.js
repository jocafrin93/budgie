// src/hooks/useCategoryGroups.js
import { useCallback, useEffect, useMemo } from 'react';
import { useSimpleStorage } from './useSimpleStorage';

// Default category groups that will be created for new users
const DEFAULT_GROUPS = [
    {
        id: 'monthly-bills',
        name: 'Monthly Bills',
        description: 'Fixed monthly expenses like rent, utilities, and insurance',
        color: '#EF4444', // red-500
        sortOrder: 0,
        isCollapsed: false,
        createdAt: new Date().toISOString()
    },
    {
        id: 'everyday-expenses',
        name: 'Everyday Expenses',
        description: 'Variable expenses like groceries, gas, and dining',
        color: '#F59E0B', // amber-500
        sortOrder: 1,
        isCollapsed: false,
        createdAt: new Date().toISOString()
    },
    {
        id: 'savings-goals',
        name: 'Savings Goals',
        description: 'Emergency fund, vacation, and other savings targets',
        color: '#10B981', // emerald-500
        sortOrder: 2,
        isCollapsed: false,
        createdAt: new Date().toISOString()
    },
    {
        id: 'debt-payments',
        name: 'Debt Payments',
        description: 'Credit cards, loans, and other debt obligations',
        color: '#8B5CF6', // violet-500
        sortOrder: 3,
        isCollapsed: false,
        createdAt: new Date().toISOString()
    },
    {
        id: 'fun-money',
        name: 'Fun Money',
        description: 'Entertainment, hobbies, and discretionary spending',
        color: '#06B6D4', // cyan-500
        sortOrder: 4,
        isCollapsed: false,
        createdAt: new Date().toISOString()
    },
    {
        id: 'miscellaneous',
        name: 'Miscellaneous',
        description: 'Uncategorized items and other expenses',
        color: '#6B7280', // gray-500
        sortOrder: 5,
        isCollapsed: false,
        createdAt: new Date().toISOString()
    }
];

/**
 * Custom hook for managing category groups
 * @returns {Object} Group management state and functions
 */
export const useCategoryGroups = () => {
    const [groups, setGroups] = useSimpleStorage('budgetCalc_categoryGroups', []);
    const [groupCollapsedState, setGroupCollapsedState] = useSimpleStorage('budgetCalc_groupCollapsedState', {});

    // Initialize default groups if none exist
    useEffect(() => {
        if (groups.length === 0) {
            console.log('🏷️ GROUPS - Initializing default category groups');
            setGroups(DEFAULT_GROUPS);
        }
    }, [groups.length, setGroups]);

    // Memoized groups with collapsed state
    const groupsWithState = useMemo(() => {
        return groups.map(group => ({
            ...group,
            isCollapsed: groupCollapsedState[group.id] || false
        }));
    }, [groups, groupCollapsedState]);

    // Add a new group
    const addGroup = useCallback((groupData) => {
        const newGroup = {
            id: groupData.id || `group-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            name: groupData.name,
            description: groupData.description || '',
            color: groupData.color || '#6B7280',
            sortOrder: groupData.sortOrder ?? Math.max(...groups.map(g => g.sortOrder), -1) + 1,
            isCollapsed: false,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        setGroups(prev => [...prev, newGroup]);
        console.log('🏷️ GROUPS - Added new group:', newGroup);
        return newGroup.id;
    }, [groups, setGroups]);

    // Update an existing group
    const updateGroup = useCallback((groupId, updates) => {
        setGroups(prev => prev.map(group =>
            group.id === groupId
                ? { ...group, ...updates, updatedAt: new Date().toISOString() }
                : group
        ));
        console.log('🏷️ GROUPS - Updated group:', groupId, updates);
    }, [setGroups]);

    // Delete a group
    const deleteGroup = useCallback((groupId) => {
        // Don't allow deleting the miscellaneous group
        if (groupId === 'miscellaneous') {
            console.warn('🏷️ GROUPS - Cannot delete miscellaneous group');
            return false;
        }

        setGroups(prev => prev.filter(group => group.id !== groupId));

        // Clean up collapsed state
        setGroupCollapsedState(prev => {
            const newState = { ...prev };
            delete newState[groupId];
            return newState;
        });

        console.log('🏷️ GROUPS - Deleted group:', groupId);
        return true;
    }, [setGroups, setGroupCollapsedState]);

    // Reorder groups
    const reorderGroups = useCallback((reorderedGroups) => {
        const groupsWithNewOrder = reorderedGroups.map((group, index) => ({
            ...group,
            sortOrder: index,
            updatedAt: new Date().toISOString()
        }));

        setGroups(groupsWithNewOrder);
        console.log('🏷️ GROUPS - Reordered groups:', groupsWithNewOrder.map(g => ({ id: g.id, name: g.name, sortOrder: g.sortOrder })));
    }, [setGroups]);

    // Toggle group collapsed state
    const toggleGroupCollapsed = useCallback((groupId) => {
        setGroupCollapsedState(prev => ({
            ...prev,
            [groupId]: !prev[groupId]
        }));
        console.log('🏷️ GROUPS - Toggled collapse for group:', groupId);
    }, [setGroupCollapsedState]);

    // Get group by ID
    const getGroupById = useCallback((groupId) => {
        return groupsWithState.find(group => group.id === groupId);
    }, [groupsWithState]);

    // Get groups sorted by sortOrder
    const getSortedGroups = useCallback(() => {
        return [...groupsWithState].sort((a, b) => a.sortOrder - b.sortOrder);
    }, [groupsWithState]);

    // Get default group for new categories (miscellaneous)
    const getDefaultGroup = useCallback(() => {
        return groupsWithState.find(group => group.id === 'miscellaneous') || groupsWithState[0];
    }, [groupsWithState]);

    // Bulk collapse/expand all groups
    const toggleAllGroups = useCallback((collapsed) => {
        const newState = {};
        groups.forEach(group => {
            newState[group.id] = collapsed;
        });
        setGroupCollapsedState(newState);
        console.log('🏷️ GROUPS - Bulk toggled all groups:', collapsed ? 'collapsed' : 'expanded');
    }, [groups, setGroupCollapsedState]);

    return {
        // State
        groups: groupsWithState,
        rawGroups: groups,

        // Actions
        addGroup,
        updateGroup,
        deleteGroup,
        reorderGroups,
        toggleGroupCollapsed,
        toggleAllGroups,

        // Utilities
        getGroupById,
        getSortedGroups,
        getDefaultGroup,

        // Constants
        DEFAULT_GROUPS
    };
};
