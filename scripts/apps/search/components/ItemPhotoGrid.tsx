import React from 'react';
import {IArticle, IDesk} from 'superdesk-api';
import {PhotoDeskPreview} from './PhotoDeskPreview';
import {PhotoDeskInfo} from './PhotoDeskInfo';
import {PhotoDeskFooter} from './PhotoDeskFooter';

interface IProps {
    item: IArticle;
    desk: IDesk;
    swimlane: any;
    onMultiSelect: () => any;
    getActionsMenu: () => any;
}

export class ItemPhotoGrid extends React.Component<IProps, never> {
    render() {
        const {item} = this.props;

        return (
            <div className="sd-wrap-helper">
                <PhotoDeskPreview
                    item={item}
                    onMultiSelect={this.props.onMultiSelect}
                />
                <PhotoDeskInfo
                    item={item}
                />
                <PhotoDeskFooter
                    item={item}
                    getActionsMenu={this.props.getActionsMenu}
                />
                <div className="sd-grid-item__state-border" />
            </div>
        );
    }
}
