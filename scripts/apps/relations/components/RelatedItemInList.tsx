import React from 'react';
import {appConfig} from 'appConfig';
import {DEFAULT_RELATED_ITEMS_LIST_CONFIG} from 'apps/search/constants';
import {renderArea} from 'apps/search/helpers';
import {IArticle, IDesk, ISuperdeskGlobalConfig} from 'superdesk-api';
import {dataApi} from 'core/helpers/CrudManager';

interface IProps {
    item: IArticle;
}

interface IState {
    desk: IDesk;
}

export class RelatedItemInListComponent extends React.PureComponent<IProps, IState> {
    listConfig: ISuperdeskGlobalConfig['list']['relatedItems'];

    constructor(props: IProps) {
        super(props);

        this.listConfig = appConfig.list?.relatedItems || DEFAULT_RELATED_ITEMS_LIST_CONFIG;

        this.state = {
            desk: null,
        };
    }

    render() {
        const {item} = this.props;
        const {desk} = this.state;

        if (!desk) {
            dataApi.findOne<IDesk>('desks', item.task.desk).then((_desk) => {
                this.setState({desk: _desk});
            });
        }

        const {listConfig} = this;
        const itemProps = {item, desk, listConfig};
        const elemProps = {className: 'line line--no-margin'};

        return (
            <div className="mlist-view mlist-view--no-shadow">
                <div className="media-box media-box--no-padding">
                    <div className="item-info">
                        {renderArea('firstLine', itemProps, elemProps)}
                        {renderArea('secondLine', itemProps, elemProps)}
                    </div>
                </div>
            </div>
        );
    }
}
