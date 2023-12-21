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
        return (event) => {
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

        if (!this.state.desks?.length) {
            return null;
        }

        const desk = this.state.desks[0];
        const name = this.formatDeskName(desk.desk.name);

        return (
            <div>
                <dl>
                    <dt style={{paddingInlineEnd: '5px'}}>{gettext('fetched in')}</dt>
                    <dd>
                        {
                            desk.isUserDeskMember
                                ? <button className="link" onClick={this.openDesk(desk)}>{name}</button>
                                : <span className="container">{name}</span>
                        }
                    </dd>
                    {this.state.desks.length > 1 && (
                        <DesksDropdown desks={this.state.desks} openDesk={this.openDesk} />
                    )}
                </dl>
            </div>
        );
    }
}

FetchedDesksInfo.propTypes = {
    item: PropTypes.any,
};
