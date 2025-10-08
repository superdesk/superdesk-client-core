import React from 'react';
import {IArticle, IUser} from 'superdesk-api';
import {gettext} from 'core/utils';
import {TimeElem} from 'apps/search/components/TimeElem';
import {dataApi} from 'core/helpers/CrudManager';

interface IProps {
    entity: IArticle;
}

interface IState {
    user: IUser;
}

export class CreatedInfo extends React.PureComponent<IProps, IState> {
    private _mounted: boolean;

    constructor(props: IProps) {
        super(props);

        this.state = {
            user: null,
        };

        this._mounted = false;
    }
    componentDidMount() {
        this._mounted = true;

        dataApi.findOne<IUser>('users', this.props.entity.original_creator).then((user) => {
            if (this._mounted) {
                this.setState({user});
            }
        });
    }
    componentWillUnmount() {
        this._mounted = false;
    }
    render() {
        const {entity} = this.props;
        const {user} = this.state;

        if (user == null) {
            return null; // loading
        }

        return (
            <dl>
                <dt>{gettext('Created')}</dt>
                {' '}
                <dd><TimeElem date={entity.firstcreated} /></dd>
                {' '}
                <dt>{gettext('by')}</dt>
                {' '}
                <dt>{user.display_name}</dt>
            </dl>
        );
    }
}
