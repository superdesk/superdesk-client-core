import React from 'react';
import PropTypes from 'prop-types';
import {DesksDropdown} from './index';

export class FetchedDesksInfo extends React.Component<any, any> {
    static propTypes: any;
    static defaultProps: any;


    constructor(props) {
        super(props);

        this.state = {desks: []};

        this.openDesk = this.openDesk.bind(this);
    }

    componentDidMount() {
        const {familyService} = this.props.svc;

        familyService.fetchDesks(this.props.item, false)
            .then((fetchedDesks) => {
                this.setState({desks: fetchedDesks});
            });
    }

    componentDidUpdate(prevProps, prevState) {
        const {familyService} = this.props.svc;

        if (prevProps.item !== this.props.item) {
            familyService.fetchDesks(this.props.item, false)
                .then((fetchedDesks) => {
                    this.setState({desks: fetchedDesks});
                });
        }
    }

    formatDeskName(name) {
        return name.substr(0, 10) + (name.length > 10 ? '...' : '');
    }

    openDesk(desk) {
        const {$location, desks, superdesk} = this.props.svc;

        return function(event) {
            event.stopPropagation();
            if (desk.isUserDeskMember) {
                desks.setCurrentDeskId(desk.desk._id);
                $location.url('/workspace/monitoring');
                if (desk.count === 1) {
                    superdesk.intent('edit', 'item', desk.item);
                }
            }
        };
    }

    render() {
        const {gettext} = this.props.svc;

        var items = [];

        items.push(React.createElement('dt', {
            key: 'dt',
            style: {paddingRight: '5px'},
        }, gettext('fetched in')));

        if (this.state.desks.length) {
            var desk = this.state.desks[0];
            var name = this.formatDeskName(desk.desk.name);

            items.push(React.createElement('dd', {key: 'dd1'}, desk.isUserDeskMember ?
                React.createElement('a', {onClick: this.openDesk(desk)}, name) :
                React.createElement('span', {className: 'container'}, name)
            ));

            if (this.state.desks.length > 1) {
                items.push(React.createElement(DesksDropdown, {
                    key: 'dd2',
                    desks: this.state.desks,
                    openDesk: this.openDesk,
                    svc: this.props.svc,
                }));
            }
        }

        return React.createElement('div', {},
            React.createElement('dl', {}, items)
        );
    }
}

FetchedDesksInfo.propTypes = {
    svc: PropTypes.object,
    item: PropTypes.any,
};
