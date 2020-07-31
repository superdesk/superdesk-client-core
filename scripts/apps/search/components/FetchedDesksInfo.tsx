import React from 'react';
import PropTypes from 'prop-types';
import {DesksDropdown} from './index';
import {gettext} from 'core/utils';
import ng from 'core/services/ng';

export class FetchedDesksInfo extends React.Component<any, any> {
    static propTypes: any;
    static defaultProps: any;

    familyService: any;
    $location: any;
    desks: any;
    superdesk: any;

    constructor(props) {
        super(props);

        this.state = {desks: []};

        this.openDesk = this.openDesk.bind(this);

        this.familyService = ng.get('familyService');
        this.$location = ng.get('$location');
        this.desks = ng.get('desks');
        this.superdesk = ng.get('superdesk');
    }

    componentDidMount() {
        this.familyService.fetchDesks(this.props.item, false)
            .then((fetchedDesks) => {
                this.setState({desks: fetchedDesks});
            });
    }

    componentDidUpdate(prevProps, prevState) {
        if (prevProps.item !== this.props.item) {
            this.familyService.fetchDesks(this.props.item, false)
                .then((fetchedDesks) => {
                    this.setState({desks: fetchedDesks});
                });
        }
    }

    formatDeskName(name) {
        return name.substr(0, 10) + (name.length > 10 ? '...' : '');
    }

    openDesk(desk) {
        return function(event) {
            event.stopPropagation();
            if (desk.isUserDeskMember) {
                this.desks.setCurrentDeskId(desk.desk._id);
                this.$location.url('/workspace/monitoring');
                if (desk.count === 1) {
                    this.superdesk.intent('edit', 'item', desk.item);
                }
            }
        };
    }

    render() {
        const items = [];

        items.push(React.createElement('dt', {
            key: 'dt',
            style: {paddingRight: '5px'},
        }, gettext('fetched in')));

        if (this.state.desks.length) {
            const desk = this.state.desks[0];
            const name = this.formatDeskName(desk.desk.name);

            items.push(React.createElement('dd', {key: 'dd1'}, desk.isUserDeskMember ?
                React.createElement('a', {onClick: this.openDesk(desk)}, name) :
                React.createElement('span', {className: 'container'}, name),
            ));

            if (this.state.desks.length > 1) {
                items.push(React.createElement(DesksDropdown, {
                    key: 'dd2',
                    desks: this.state.desks,
                    openDesk: this.openDesk,
                }));
            }
        }

        return React.createElement('div', {},
            React.createElement('dl', {}, items),
        );
    }
}

FetchedDesksInfo.propTypes = {
    item: PropTypes.any,
};
