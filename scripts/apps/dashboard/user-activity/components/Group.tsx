import React from 'react';

import ng from 'core/services/ng';
import {gettext} from 'core/utils';
import {IGroup, IGroupData} from './UserActivityWidget';
import {IArticle} from 'superdesk-api';
import {WidgetItemList} from 'apps/search/components';

interface IProps {
    group: IGroup;
    data: IGroupData;
    toggleCollapseExpand(group: IGroup): void;
}

export class GroupComponent extends React.Component<IProps> {
    services: {
        authoringWorkspace: any;
        superdesk: any;
    };

    constructor(props: IProps) {
        super(props);

        this.services = {
            authoringWorkspace: ng.get('authoringWorkspace'),
            superdesk: ng.get('superdesk'),
        };
    }

    render() {
        const {group, data, toggleCollapseExpand} = this.props;
        const loadedItemsCount = data.itemIds.length;

        return (
            <div className="stage">
                <div className="stage-header">
                    <button
                        className={`stage-header__toggle ${group.collapsed ? 'closed' : ''}`}
                        onClick={() => toggleCollapseExpand(group)}
                    >
                        <i className="icon-chevron-down-thin" />
                    </button>
                    <span className="stage-header__name">
                        {group.label}
                    </span>
                    <div className="stage-header__line" />
                    <span className="label-total stage-header__number">
                        {loadedItemsCount < data.total ? `${data.itemIds.length} / ${data.total}` : data.total}
                    </span>
                </div>
                {group.collapsed === true ? null : (
                    <div className="stage-content">
                        <WidgetItemList
                            customUIMessages={{
                                empty: gettext('No results for this user'),
                            }}
                            canEdit={true}
                            select={(item: IArticle) => {
                                this.services.superdesk.intent(
                                    'preview',
                                    'item',
                                    item,
                                );
                            }}
                            edit={(item: IArticle) => {
                                this.services.authoringWorkspace.edit(item);
                            }}
                            itemIds={data.itemIds}
                            itemsById={data.itemsById}
                            loading={false}
                        />
                    </div>
                )}
            </div>
        );
    }
}
