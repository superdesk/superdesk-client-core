/* eslint-disable react/no-multi-comp */

import React from 'react';
import {openArticle} from 'core/get-superdesk-api-implementation';
import {ISuperdeskQuery} from 'core/query-formatting';
import {dataApi} from 'core/helpers/CrudManager';
import ng from 'core/services/ng';
import {IArticle, IDesk, IUser} from 'superdesk-api';
import {ArticlesListByQueryWithFilters} from 'core/ArticlesListByQueryWithFilters';

interface IProps {
    heading: string;
    getQuery(userId: string, deskId: string): ISuperdeskQuery;
    activeDeskId: IDesk['_id'];
    monitoringController: any;
}

interface IState {
    currentUser: IUser | 'loading';
}

export class ArticlesList extends React.PureComponent<IProps, IState> {
    constructor(props: IProps) {
        super(props);

        this.state = {
            currentUser: 'loading',
        };
    }
    componentDidMount() {
        ng.get('session').getIdentity().then((user: IUser) => {
            this.setState({currentUser: user});
        });
    }
    render() {
        const {currentUser} = this.state;

        if (currentUser === 'loading') {
            return null;
        }

        const {activeDeskId, getQuery} = this.props;

        return (
            <div>
                <ArticlesListByQueryWithFilters
                    heading={this.props.heading}
                    query={getQuery(currentUser._id, activeDeskId)}
                    onItemClick={(item) => {
                        // item does not have all the fields because of projections used for list items
                        dataApi.findOne<IArticle>('search', item._id).then((itemWithAllFields) => {
                            this.props.monitoringController.preview(itemWithAllFields, true);
                        });
                    }}
                    onItemDoubleClick={(item) => {
                        openArticle(item._id, 'edit');
                    }}
                />
            </div>
        );
    }
}
