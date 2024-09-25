import React from 'react';
import {Spacer} from 'core/ui/components/Spacer';
import {VideoComponent} from 'core/ui/components/video';
import {IArticle} from 'superdesk-api';
import {mediaDetailsPadding} from '../constants';
import {VideoThumbnailEditor} from 'apps/authoring/authoring/components/video-thumbnail-editor';
import {Button} from 'superdesk-ui-framework/react';
import {gettext} from 'core/utils';
import {editMetadata} from '../edit-metadata';

interface IProps {
    item: IArticle;
    onChange(item: IArticle): void;
    title: JSX.Element;
    removeButton: JSX.Element;
    metadata: JSX.Element;
    paginationBar: JSX.Element;
    titleInput: JSX.Element;
    descriptionInput: JSX.Element;
    readOnly: boolean;
    canRemoveItems: boolean;
    prepareForExternalEditing: (item: IArticle) => IArticle;
}

export class MediaCarouselVideo extends React.PureComponent<IProps> {
    render() {
        const {
            item,
            title,
            removeButton,
            metadata,
            paginationBar,
            titleInput,
            descriptionInput,
            canRemoveItems,
        } = this.props;

        return (
            <div>
                <div className="field--media--carousel">
                    <div style={{color: '#fff', padding: 10}}>
                        <Spacer v gap="16" justifyContent="space-between" noWrap style={{height: '100%'}}>
                            <Spacer h gap="16" justifyContent="space-between" noWrap>
                                {title}
                                {canRemoveItems ? removeButton : null}
                            </Spacer>

                            <div>
                                <VideoComponent item={item} width="100%" />
                            </div>

                            <Spacer v gap="16" noWrap>
                                {metadata}
                                {paginationBar}
                            </Spacer>
                        </Spacer>
                    </div>
                </div>

                <div style={{padding: mediaDetailsPadding}}>
                    <Spacer v gap="16" noWrap>
                        {
                            titleInput != null && (
                                <div style={{width: '100%'}}>{titleInput}</div>
                            )
                        }

                        {
                            descriptionInput != null && (
                                <div style={{width: '100%'}}>{descriptionInput}</div>
                            )
                        }

                        <Spacer h gap="16" justifyContent="space-between" noWrap>
                            <VideoThumbnailEditor
                                item={item}
                                onChange={(item) => {
                                    this.props.onChange(item);
                                }}
                            />

                            <Button
                                text={gettext('Edit metadata')}
                                style="hollow"
                                size="small"
                                onClick={() => {
                                    editMetadata(this.props.prepareForExternalEditing(this.props.item), 'view')
                                        .then((item) => {
                                            this.props.onChange(item);
                                        });
                                }}
                            />
                        </Spacer>
                    </Spacer>
                </div>
            </div>
        );
    }
}
