import React from 'react';
import {IconButton} from 'superdesk-ui-framework/react';
import ng from 'core/services/ng';
import {Spacer} from 'core/ui/components/Spacer';
import {gettext} from 'core/utils';
import {IArticle} from 'superdesk-api';
import {ImageCrops} from './image-crops';
import {mediaDetailsPadding} from '../constants';

interface IProps {
    item: IArticle;
    onChange(item: IArticle): void;
    title: JSX.Element;
    removeButton: JSX.Element;
    metadata: JSX.Element;
    paginationBar: JSX.Element;
    descriptionInput: JSX.Element;
    titleInput: JSX.Element;
    showCrops?: boolean;
    readOnly: boolean;
}

export class MediaCarouselImage extends React.PureComponent<IProps> {
    constructor(props: IProps) {
        super(props);

        this.edit = this.edit.bind(this);
    }

    edit(mode: 'view' | 'image-edit' | 'crop') {
        const cropOptions = {
            isNew: false,
            editable: true,
            isAssociated: true,
            defaultTab: mode,
            showMetadata: true,
        };

        ng.get('renditions')
            .crop(this.props.item, cropOptions, {immutable: true})
            .then((res) => {
                this.props.onChange(res);
            });
    }

    render() {
        const {
            item,
            title,
            removeButton,
            metadata,
            paginationBar,
            titleInput,
            descriptionInput,
            showCrops,
            readOnly,
        } = this.props;

        return (
            <div>
                <div className="field--media--carousel">
                    <div style={{display: 'flex', width: '100%', justifyContent: 'center'}}>
                        <img src={item.renditions.viewImage.href} style={{maxHeight: '50vh'}} />
                    </div>

                    <div className="field--media--carousel-overlay">
                        <Spacer v gap="8" justifyContent="space-between" noWrap style={{height: '100%'}}>
                            <Spacer h gap="16" justifyContent="space-between" noWrap>
                                {title}
                                {removeButton}
                            </Spacer>

                            {
                                !readOnly && (
                                    <div style={{display: 'flex', width: '100%', justifyContent: 'center'}}>
                                        <Spacer h gap="8" noGrow>
                                            <IconButton
                                                ariaValue={gettext('Edit metadata')}
                                                icon="pencil"
                                                style="outlineWhite"
                                                size="x-large"
                                                onClick={() => {
                                                    this.edit('view');
                                                }}
                                            />

                                            <IconButton
                                                ariaValue={gettext('Edit image')}
                                                icon="switches"
                                                style="outlineWhite"
                                                size="x-large"
                                                onClick={() => {
                                                    this.edit('image-edit');
                                                }}
                                            />

                                            <IconButton
                                                ariaValue={gettext('Edit crops')}
                                                icon="crop"
                                                style="outlineWhite"
                                                size="x-large"
                                                onClick={() => {
                                                    this.edit('crop');
                                                }}
                                            />
                                        </Spacer>
                                    </div>
                                )
                            }

                            <Spacer v gap="16" noWrap>
                                {metadata}
                                {paginationBar}
                            </Spacer>
                        </Spacer>
                    </div>
                </div>

                {
                    (descriptionInput != null || titleInput != null || showCrops === true) && (
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

                                {
                                    showCrops === true && (
                                        <ImageCrops
                                            renditions={item.renditions ?? {}}
                                            wrapper={({children}) => <div style={{width: '100%'}}>{children}</div>}
                                        />
                                    )
                                }
                            </Spacer>
                        </div>
                    )
                }
            </div>
        );
    }
}
