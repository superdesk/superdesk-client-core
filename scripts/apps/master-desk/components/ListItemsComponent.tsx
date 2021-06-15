import React from 'react';

import {IStage} from 'superdesk-api';

import {gettext} from 'core/utils';
import {ItemUrgency, TypeIcon} from 'apps/search/components';
import {TimeElem} from 'apps/search/components/TimeElem';

interface IProps {
    items: Array<IStage>;
    total: number;
}

export class ListItemsComponent extends React.Component<IProps, {}> {
    render() {
        return (
            this.props.total > 0 ?
                this.props.items.map((item: any, key) => (
                    <li className="content-item" key={key}>
                        <div className="content-item__type">
                            <TypeIcon
                                type={item.type}
                                highlight={item.highlight}
                            />
                        </div>
                        <div className="content-item__urgency-field">
                            <ItemUrgency
                                urgency={item.urgency}
                                language={item.language}
                            />
                        </div>
                        <div className="content-item__text">
                            <span className="keywords">{item.slugline}</span>
                            <span id="title" className="headline">
                                {item.headline}
                            </span>
                        </div>
                        <div className="content-item__date">
                            <TimeElem date={item.versioncreated} />
                        </div>
                    </li>
                )) : (
                    <li className="sd-padding--1 sd-text__center">
                        {gettext('There are currently no items')}
                    </li>
                )
        );
    }
}
