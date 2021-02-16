import React from 'react';
import {IArticle, IUser} from 'superdesk-api';
import {gettext} from 'core/utils';
import {TimeElem} from 'apps/search/components/TimeElem';
import {dataApi} from 'core/helpers/CrudManager';

interface IProps {
    article: IArticle;
}

interface IState {
    user: IUser;
}

export class CreatedInfo extends React.PureComponent<IProps, IState> {
    constructor(props: IProps) {
        super(props);

        this.state = {
            user: null,
        };

        this._mounted = false;
    }
    componentDidMount() {
        dataApi.findOne<IUser>('users', this.props.article.original_creator).then((user) => {
            this.setState({user});
        });
    }
    render() {
        const {article} = this.props;
        const {user} = this.state;

        if (user == null) {
            return null; // loading
        }

        return (
            <dl>
                <dt>{gettext('Created')}</dt>
                {' '}
                <dd><TimeElem date={article.firstcreated} /></dd>
                {' '}
                <dt>{gettext('by')}</dt>
                {' '}
                <dt>{user.display_name}</dt>
            </dl>
        );
    }
}
