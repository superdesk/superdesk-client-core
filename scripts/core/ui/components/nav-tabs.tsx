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
    tab: ITab;
}

export class NavTabs extends React.Component<ITabsProps, ITabsState> {
    static propTypes: any;
    static defaultProps: any;

    constructor(props) {
        super(props);
        this.state = {tab: props.active != null ? props.tabs[props.active] : props.tabs[0]};

        this.selectTab = this.selectTab.bind(this);
        this.selectTabByIndex = this.selectTabByIndex.bind(this);
    }

    selectTabByIndex(index: number) {
        this.setState({tab: this.props.tabs[index]});
    }

    selectTab(event: React.MouseEvent, tab: ITab) {
        event.stopPropagation();
        this.setState({tab: tab});
    }

    render() {
        const tabs = this.props.tabs.map((tab) => {
            const className = classNames('nav-tabs__tab', {
                'nav-tabs__tab--active': this.state.tab === tab,
            });

            return (
                <li key={tab.label} className={className}>
                    <button onClick={(event) => this.selectTab(event, tab)}
                        className="nav-tabs__link">{tab.label}</button>
                </li>
            );
        });

        return (
            <div>
                <ul className="nav-tabs nav-tabs--small">{tabs}</ul>
                <div>{this.state.tab.render()}</div>
            </div>
        );
    }
}
