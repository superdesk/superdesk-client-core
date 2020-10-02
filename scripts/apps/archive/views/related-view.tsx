import React from 'react';
import {IArticle, IRestApiResponse} from 'superdesk-api';
import {ItemsListLimited} from 'core/itemList/items-list-limited';
import {openArticle} from 'core/get-superdesk-api-implementation';

interface IProps {
    relatedItems: IRestApiResponse<IArticle>;
}

export class RelatedView extends React.PureComponent<IProps> {
    render() {
        const ids = this.props.relatedItems._items.map(({_id}) => _id);

        return (
            <div data-test-id="related-items-view">
                <ItemsListLimited
                    ids={ids}
                    onItemClick={(item) => {
                        openArticle(item._id, 'edit');
                    }}
                />
            </div>
        );
    }
}
