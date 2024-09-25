import React from 'react';
import {Spacer} from 'core/ui/components/Spacer';
import {IArticle} from 'superdesk-api';
import {mediaDetailsPadding} from '../constants';
import {Button} from 'superdesk-ui-framework/react';
import {gettext} from 'core/utils';
import {editMetadata} from '../edit-metadata';
import {filterObject} from 'core/helpers/utils';

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

export class MediaCarouselAudio extends React.PureComponent<IProps> {
    render() {
        const {
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
                        <Spacer v gap="32" justifyContent="space-between" noWrap style={{height: '100%'}}>
                            <Spacer h gap="16" justifyContent="space-between" noWrap>
                                {title}
                                {canRemoveItems ? removeButton : null}
                            </Spacer>

                            <div style={{display: 'flex', width: '100%', justifyContent: 'center'}}>
                                <audio controls>
                                    {
                                        Object.values(
                                            filterObject(this.props.item.renditions, (value) => value != null),
                                        )
                                            .map(({href}) => (
                                                <source key={href} src={href} />
                                            ))
                                    }
                                </audio>
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
                            <span />

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
