import {
    BanknotesIcon,
    CalendarIcon,
    ChartBarIcon,
    CogIcon,
    CreditCardIcon,
    HomeIcon
} from '@heroicons/react/24/outline';
import SettingIcon from 'assets/dualicons/setting.svg?react';
import { NAV_TYPE_ITEM } from 'constants/app.constant';

// Flattened navigation structure
export const navigation = [
    {
        id: 'home',
        path: '/dashboards/home',
        type: NAV_TYPE_ITEM,
        title: 'Home',
        transKey: 'nav.dashboards.home',
        Icon: HomeIcon,
    },
    {
        id: 'accounts',
        path: '/budget/accounts',
        type: NAV_TYPE_ITEM,
        title: 'Accounts',
        transKey: 'nav.budget.accounts',
        Icon: CreditCardIcon,
    },
    {
        id: 'overview',
        path: '/budget/overview',
        type: NAV_TYPE_ITEM,
        title: 'Budget Overview',
        transKey: 'nav.budget.overview',
        Icon: ChartBarIcon,
    },
    {
        id: 'transactions',
        path: '/budget/transactions',
        type: NAV_TYPE_ITEM,
        title: 'Transactions',
        transKey: 'nav.budget.transactions',
        Icon: BanknotesIcon,
    },
    {
        id: 'calendar',
        path: '/budget/calendar',
        type: NAV_TYPE_ITEM,
        title: 'Calendar',
        transKey: 'nav.budget.calendar',
        Icon: CalendarIcon,
    },
    {
        id: 'budget-settings',
        path: '/budget/settings',
        type: NAV_TYPE_ITEM,
        title: 'Budget Settings',
        transKey: 'nav.budget.settings',
        Icon: CogIcon,
    },
    {
        id: 'settings',
        path: '/settings/appearance',
        type: NAV_TYPE_ITEM,
        title: 'Settings',
        transKey: 'nav.settings.settings',
        Icon: SettingIcon,
    },
]

export { baseNavigation } from './baseNavigation';

