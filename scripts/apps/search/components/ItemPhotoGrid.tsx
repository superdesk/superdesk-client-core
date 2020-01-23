import React from 'react';
import {IArticle, IDesk} from 'superdesk-api';
import {PhotoDeskPreview} from './PhotoDeskPreview';
import {PhotoDeskInfo} from './PhotoDeskInfo';
import {PhotoDeskFooter} from './PhotoDeskFooter';

interface IProps {
    item: IArticle;
    desk: IDesk;
    ingestProvider: any;
    svc: any;
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
                    svc={this.props.svc}
                />
                <PhotoDeskInfo
                    item={item}
                    ingestProvider={this.props.ingestProvider}
                    svc={this.props.svc}
                />
                <PhotoDeskFooter
                    item={item}
                    svc={this.props.svc}
                    getActionsMenu={this.props.getActionsMenu}
                />
                <div className="sd-grid-item__state-border" />
            </div>
        );
    }
}
