import React from 'react';
import {IArticle} from 'superdesk-interfaces/Article';
import {IDesk} from 'superdesk-interfaces/Desk';
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
                    desk={this.props.desk}
                    onMultiSelect={this.props.onMultiSelect}
                    swimlane={this.props.swimlane}
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
