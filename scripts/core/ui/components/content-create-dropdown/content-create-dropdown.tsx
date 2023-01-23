/* eslint-disable react/no-multi-comp */

import React from 'react';
import {IArticle} from 'superdesk-api';
import {Button} from 'superdesk-ui-framework/react';
import ng from 'core/services/ng';
import {getSuperdeskType, gettext} from 'core/utils';
import {showPopup} from '../popupNew';
import {InitialView} from './initial-view';
import {DropZone3} from '../drop-zone-3';

const defaultButton = ({onClick}: IPropsAddContentCustomButton) => (
    <Button
        type="primary"
        icon="plus-large"
        text={gettext('new item')}
        size="small"
        shape="round"
        iconOnly={true}
        onClick={onClick}
    />
);

export interface IPropsAddContentCustomButton {
    onClick: (event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => void;
}

interface IProps {
    customButton?: React.ComponentType<{}>;
    onCreate?(items: Array<IArticle>): void;

    /**
     * If an item is created, but closed without changes, it gets removed
     * it doesn't work well when creating item and adding as related immediately
     * user might want to go back and update the item later.
     * To avoid the item getting removed it is initialized with a higher version
     */
    initializeAsUpdated?: boolean;
}

export class ContentCreateDropdown extends React.PureComponent<IProps> {
    private lastPopup;

    render() {
        const DropdownButton = this.props.customButton ?? defaultButton;

        return (
            <DropZone3
                canDrop={(event) => getSuperdeskType(event) === 'Files'}
                onDrop={(event) => {
                    const superdeskType = getSuperdeskType(event);

                    if (superdeskType === 'Files') {
                        let uploadData = {
                            files: event.dataTransfer.files,
                            uniqueUpload: false,
                            maxUploads: undefined, // accepts undefined
                            allowPicture: true,
                            allowVideo: true,
                            allowAudio: true,
                            deskSelectionAllowed: true,
                        };

                        ng.get('superdesk').intent('upload', 'media', uploadData);
                    }
                }}
                multiple={true}
            >
                <DropdownButton
                    onClick={(event) => {
                        if (this.lastPopup != null) {
                            this.lastPopup.close();
                            this.lastPopup = null;
                            return;
                        } else {
                        this.lastPopup = showPopup(
                            event.target as HTMLElement,
                            'bottom-end',
                            ({closePopup}) => (
                                <InitialView
                                    closePopup={closePopup}
                                    initializeAsUpdated={this.props.initializeAsUpdated === true}
                                    onCreate={this.props.onCreate}
                                />
                            ),
                            1050,
                            undefined,
                            () => {
                                this.lastPopup = null;
                            },
                        );
                    }
                    }}
                />
            </DropZone3>
        );
    }
}
