import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';

export class NavTabs extends React.Component {
    constructor(props) {
        super(props);
        this.state = {tab: props.active ? props.tabs[props.active] : props.tabs[0]};
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
                <div className="nav-tabs__content">{this.state.tab.render()}</div>
            </div>
        );
    }
}

NavTabs.propTypes = {
    tabs: PropTypes.array.isRequired,
    active: PropTypes.number,
};
