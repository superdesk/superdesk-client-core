import React from 'react';
import {IArticleActionInteractive} from './interfaces';
import {TabList} from 'core/ui/components/tabs';
import {gettext} from 'core/utils';
import {assertNever} from 'core/helpers/typescript-helpers';

export function getTabLabel(id: IArticleActionInteractive): string {
    if (id === 'send_to') {
        return gettext('Send to');
    } else if (id === 'fetch_to') {
        return gettext('Fetch to');
    } else if (id === 'duplicate_to') {
        return gettext('Duplicate to');
    } else if (id === 'unspike') {
        return gettext('Unspike');
    } else if (id === 'publish') {
        return gettext('Publish');
    } else if (id === 'correct') {
        /**
         * Display as "Publish".
         * It's implemented as separate tab so it's easier
         * to decouple implementation into a separate component.
         */
        return gettext('Publish');
    } else {
        assertNever(id);
    }
}

interface IActionTabsProps {
    tabs: Array<IArticleActionInteractive>;
    activeTab: IArticleActionInteractive;
    onChange(tab: IArticleActionInteractive): void;
}

/**
 * Reusable tabs component for interactive article actions.
 * Can be used in both the standalone panel header and the widget header.
 */
export const ActionTabs: React.FC<IActionTabsProps> = ({tabs, activeTab, onChange}) => {
    return (
        <TabList
            tabs={tabs.map((id) => ({id, label: getTabLabel(id)}))}
            selectedTabId={activeTab}
            onChange={onChange}
            data-test-id="tabs"
        />
    );
};
