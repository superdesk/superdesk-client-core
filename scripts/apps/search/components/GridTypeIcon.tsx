import React from 'react';
import {TypeIcon} from './index';
import classNames from 'classnames';
import {IArticle} from 'superdesk-api';

interface IProps {
    item: IArticle;
    photoGrid?: any;
    swimlane?: any;
}

export const GridTypeIcon: React.FunctionComponent<IProps> = (props) => {
    const className = props.photoGrid ? classNames('sd-grid-item__type-icn', {swimlane: props.swimlane}) : undefined;

    return (
        <span className={className}>
            <TypeIcon type={props.item.type} contentProfileId={props.item.profile} />
        </span>
    );
};
