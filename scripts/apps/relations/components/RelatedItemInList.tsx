import React from 'react';
import {appConfig} from 'appConfig';
import {DEFAULT_RELATED_ITEMS_LIST_CONFIG} from 'apps/search/constants';
import {renderArea} from 'apps/search/helpers';
import {IArticle, IDesk, ISuperdeskGlobalConfig} from 'superdesk-api';
import ng from 'core/services/ng';

interface IProps {
    item: IArticle;
}

export class RelatedItemInListComponent extends React.PureComponent<IProps, {}> {
    listConfig: ISuperdeskGlobalConfig['list']['relatedItems'];
    services: {[serviceId: string]: any};

    constructor(props: IProps) {
        super(props);

        this.listConfig = appConfig.list?.relatedItems || DEFAULT_RELATED_ITEMS_LIST_CONFIG;
        this.services = {
            desks: ng.get('desks'),
        };
    }

    render() {
        const {listConfig} = this;
        const {item} = this.props;
        const deskId = item.task?.desk || null;
        let itemProps: any = {item, listConfig};

        if (deskId !== null) {
            itemProps = {...itemProps, desk: this.services.desks.deskLookup[deskId]};
        }

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
