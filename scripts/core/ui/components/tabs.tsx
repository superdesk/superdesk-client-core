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
    selectedTabId: string;
    onChange(tab: string): void;
    'data-test-id'?: string;
}

export class TabList extends React.PureComponent<IProps> {
    render() {
        const {tabs, selectedTabId: selected, onChange} = this.props;
        const selectedTab = tabs.find(({id}) => id === selected);

        return (
            <Tabs
                initiallySelectedIndex={tabs.indexOf(selectedTab)}
                onClick={(index) => {
                    onChange(tabs[index].id);
                }}
                data-test-id={this.props['data-test-id']}
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
