import React from 'react';
import classNames from 'classnames';

interface ITab {
    label: string;
    render(): JSX.Element;
}

interface IProps {
    tabs: Array<ITab>;
    active: number;
}

interface IState {
    tab: ITab;
}

export class NavTabs extends React.Component<IProps, IState> {
    static propTypes: any;
    static defaultProps: any;

    constructor(props) {
        super(props);
        this.state = {tab: props.active != null ? props.tabs[props.active] : props.tabs[0]};
    }

    selectTab(tab) {
        return (event) => {
            event.stopPropagation();
            this.setState({tab: tab});
        };
    }

    render() {
        const tabs = this.props.tabs.map((tab) => {
            const className = classNames('nav-tabs__tab', {
                'nav-tabs__tab--active': this.state.tab === tab,
            });

            return (
                <li key={tab.label} className={className}>
                    <button onClick={this.selectTab(tab)}
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
