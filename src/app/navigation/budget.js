import {
    CalculatorIcon,
    CalendarIcon,
    CogIcon,
    CreditCardIcon
} from '@heroicons/react/24/outline';
import { NAV_TYPE_ITEM, NAV_TYPE_ROOT } from 'constants/app.constant';

const ROOT_BUDGET = '/budget'

const path = (root, item) => `${root}${item}`;

export const budget = {
    id: 'budget',
    type: NAV_TYPE_ROOT,
    path: '/budget',
    title: 'Budget',
    transKey: 'nav.budget.budget',
    Icon: CalculatorIcon,
    childs: [
        {
            id: 'budget.accounts',
            path: path(ROOT_BUDGET, '/accounts'),
            type: NAV_TYPE_ITEM,
            title: 'Accounts',
            transKey: 'nav.budget.accounts',
            Icon: CreditCardIcon,
        },
        {
            id: 'budget.overview',
            path: path(ROOT_BUDGET, '/overview'),
            type: NAV_TYPE_ITEM,
            title: 'Budget Overview',
            transKey: 'nav.budget.overview',
            Icon: CalculatorIcon,
        },
        {
            id: 'budget.transactions',
            path: path(ROOT_BUDGET, '/transactions'),
            type: NAV_TYPE_ITEM,
            title: 'Transactions',
            transKey: 'nav.budget.transactions',
            Icon: CreditCardIcon,
        },
        {
            id: 'budget.calendar',
            path: path(ROOT_BUDGET, '/calendar'),
            type: NAV_TYPE_ITEM,
            title: 'Calendar',
            transKey: 'nav.budget.calendar',
            Icon: CalendarIcon,
        },
        {
            id: 'budget.settings',
            path: path(ROOT_BUDGET, '/settings'),
            type: NAV_TYPE_ITEM,
            title: 'Budget Settings',
            transKey: 'nav.budget.settings',
            Icon: CogIcon,
        },
    ]
}
