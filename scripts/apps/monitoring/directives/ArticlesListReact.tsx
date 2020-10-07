/* eslint-disable react/no-multi-comp */

import React from 'react';
import {openArticle} from 'core/get-superdesk-api-implementation';
import {ISuperdeskQuery} from 'core/query-formatting';
import {dataApi} from 'core/helpers/CrudManager';
import {IArticle, IDesk, IUser} from 'superdesk-api';
import {ArticlesListByQueryWithFilters} from 'core/ArticlesListByQueryWithFilters';

interface IProps {
    heading: string;
    query: ISuperdeskQuery;
    monitoringController: any;
}

interface IState {
    currentUser: IUser | 'loading';
}

export class ArticlesList extends React.PureComponent<IProps, IState> {
    render() {
        const {query} = this.props;

        return (
            <ArticlesListByQueryWithFilters
                heading={this.props.heading}
                query={query}
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
        );
    }
}
