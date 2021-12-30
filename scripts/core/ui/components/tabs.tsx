import React from 'react';
import {Tabs, TabLabel} from 'superdesk-ui-framework/react';

export interface ITabListTab {
    id: string;
    label: string;
}

interface IProps {
    size?: 'normal' | 'large' | 'small';
    theme?: 'light' | 'dark';
    tabs: Array<ITabListTab>;
    selected: string; // label of a selected tab
    onChange(tab: string): void;
}

export class TabList extends React.PureComponent<IProps> {
    render() {
        const {tabs, selected, onChange} = this.props;
        const selectedTab = tabs.find(({label}) => label === selected);

        // TODO: `Tabs` component doesn't accept selected value yet
        const selectedIndex = selectedTab == null ? 0 : tabs.indexOf(selectedTab);

        return (
            <Tabs
                onClick={(index) => {
                    onChange(tabs[index].id);
                }}
            >
                {
                    tabs.map(({label}, index) => (
                        <TabLabel
                            key={index}
                            label={label}
                            indexValue={index}
                        />
                    ))
                }
            </Tabs>
        );
    }
}