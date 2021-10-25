import React from 'react';
import {appConfig} from 'appConfig';
import {DEFAULT_RELATED_ITEMS_LIST_CONFIG} from 'apps/search/constants';
import {renderArea} from 'apps/search/helpers';
import {IArticle, IDesk, ISuperdeskGlobalConfig} from 'superdesk-api';
import ng from 'core/services/ng';
import {isPublished} from 'apps/archive/utils';

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
            authoringWorkspace: ng.get('authoringWorkspace'),
        };
        this.onItemDoubleClick = this.onItemDoubleClick.bind(this);
    }

    onItemDoubleClick() {
        const {authoringWorkspace} = this.services;
        const {item} = this.props;

        if (isPublished(item)) {
            authoringWorkspace.view(item);
        } else {
            authoringWorkspace.edit(item);
        }
    }

    render() {
        const {listConfig} = this;
        const {item} = this.props;
        const deskId = item.task?.desk || null;
        let itemProps = {item, listConfig, desk: deskId == null ? undefined : this.services.desks.deskLookup[deskId]};

        const elemProps = {className: 'line line--no-margin'};

        return (
            <div className="mlist-view mlist-view--no-shadow" onDoubleClick={this.onItemDoubleClick}>
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
