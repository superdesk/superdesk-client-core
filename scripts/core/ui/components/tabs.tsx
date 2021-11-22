import React from 'react';

export interface ITabListTab {
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

        return (
            <div>
                {tabs.map(({label}) => (
                    <button
                        key={label}
                        style={{border: `1px solid ${label === selected ? 'yellow' : 'transparent'}`}}
                        onClick={() => {
                            onChange(label);
                        }}
                    >
                        {label}
                    </button>
                ))}
            </div>
        );
    }
}
