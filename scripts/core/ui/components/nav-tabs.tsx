import React from 'react';
import classNames from 'classnames';

interface ITab {
    label: string;
    render(): JSX.Element;
}

interface ITabsProps {
    tabs: Array<ITab>;
    active: number;
}

interface ITabsState {
    active: number;
}

export class NavTabs extends React.Component<ITabsProps, ITabsState> {
    static propTypes: any;
    static defaultProps: any;

    constructor(props) {
        super(props);
        this.state = {active: props.active || 0};

        this.selectTab = this.selectTab.bind(this);
    }

    selectTab(index: number) {
        this.setState({active: index});
    }

    render() {
        const tabs = this.props.tabs.map((tab, i) => {
            const className = classNames('nav-tabs__tab', {
                'nav-tabs__tab--active': this.state.active === i,
            });

            return (
                <li key={tab.label} className={className}>
                    <button onClick={(event) => this.selectTab(i)}
                        className="nav-tabs__link">{tab.label}</button>
                </li>
            );
        });

        return (
            <div>
                <ul className="nav-tabs nav-tabs--small">{tabs}</ul>
                <div>{this.props.tabs[this.state.active].render()}</div>
            </div>
        );
    }
}
