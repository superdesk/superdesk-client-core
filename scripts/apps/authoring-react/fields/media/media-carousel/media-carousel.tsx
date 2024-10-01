import React from 'react';
import {IconButton, Input} from 'superdesk-ui-framework/react';
import {IArticle} from 'superdesk-api';
import {gettext} from 'core/utils';
import {Spacer, SpacerBlock} from 'core/ui/components/Spacer';
import {getNoValueLabel} from '../constants';
import {MediaMetadata} from '../media-metadata';
import {noop} from 'lodash';
import {MediaCarouselImage} from './image';
import {MediaCarouselAudio} from './audio';
import {MediaCarouselVideo} from './video';
import {filterObject} from 'core/helpers/utils';

interface IProps {
    mediaItems: Array<IArticle>;
    onChange?(mediaItems: Array<IArticle>): void;
    showPictureCrops: boolean;
    readOnly: boolean;
    maxItemsAllowed: number;
    showTitleInput: boolean;
    showDescriptionInput: boolean;
    canRemoveItems: boolean;
    prepareForExternalEditing: (item: IArticle) => IArticle;
}

interface IState {
    currentPage: number;
}

export class MediaCarousel extends React.PureComponent<IProps, IState> {
    constructor(props: IProps) {
        super(props);

        this.state = {
            currentPage: 0,
        };

        this.next = this.next.bind(this);
        this.prev = this.prev.bind(this);
        this.handleChange = this.handleChange.bind(this);
        this.isFirstItem = this.isFirstItem.bind(this);
        this.isLastItem = this.isLastItem.bind(this);
        this.goToPage = this.goToPage.bind(this);
    }

    public goToPage(index: number) {
        this.setState({currentPage: index});
    }

    /**
     * If last page is shown and item gets removed,
     * `currentPage` has to be updated to refer to the last page.
     * Otherwise it would refer to a page that no longer exists.
     */
    static getDerivedStateFromProps(props: IProps, state: IState): Partial<IState> | null {
        if (state.currentPage > props.mediaItems.length - 1) {
            return {
                currentPage: props.mediaItems.length - 1,
            };
        } else {
            return null; // keep existing state
        }
    }

    private handleChange(val: IArticle) {
        this.props.onChange(
            this.props.mediaItems.map(
                (_item, i) => i === this.state.currentPage
                    ? val
                    : _item,
            ),
        );
    }

    private isFirstItem(): boolean {
        return this.state.currentPage === 0;
    }

    private isLastItem(): boolean {
        const {currentPage} = this.state;
        const pagesTotal = this.props.mediaItems.length;

        return currentPage === pagesTotal - 1;
    }


    public next(): void {
        if (this.isLastItem()) {
            this.setState({currentPage: 0});
        } else {
            this.setState({currentPage: this.state.currentPage + 1});
        }
    }

    public prev(): void {
        if (this.isFirstItem()) {
            this.setState({currentPage: this.props.mediaItems.length - 1});
        } else {
            this.setState({currentPage: this.state.currentPage - 1});
        }
    }

    render() {
        const {currentPage} = this.state;
        const {
            mediaItems,
            maxItemsAllowed,
            readOnly,
            showPictureCrops,
            showTitleInput,
            showDescriptionInput,
            canRemoveItems,
        } = this.props;
        const onChange = this.props.onChange ?? noop;

        const pagesTotal = mediaItems.length;
        const item = mediaItems[currentPage];

        const noValueLabel = getNoValueLabel();

        const title = (
            <Spacer v gap="8" noWrap>
                <div>
                    <span className="field--media--metadata-label">
                        {gettext('Title:')}
                    </span>
                    <SpacerBlock h gap="8" />
                    <span>{item.headline ?? noValueLabel}</span>
                </div>

                {
                    readOnly && ( // when read-only, description input won't be visible
                        <div>
                            <span className="field--media--metadata-label">
                                {gettext('Description:')}
                            </span>
                            <SpacerBlock h gap="8" />
                            <span>{item.description_text ?? noValueLabel}</span>
                        </div>
                    )
                }
            </Spacer>
        );

        const removeButton = (
            !readOnly && (
                <div>
                    <IconButton
                        ariaValue={gettext('Remove')}
                        icon="remove-sign"
                        onClick={() => {
                            onChange(
                                mediaItems.filter(
                                    (_, i) => i !== currentPage,
                                ),
                            );
                        }}
                    />
                </div>
            )
        );

        const metadata = (
            <MediaMetadata item={item} />
        );

        const paginationBar = maxItemsAllowed < 2 ? null : (
            <Spacer h gap="16" justifyContent="space-between" noWrap>
                <div>
                    <IconButton
                        ariaValue={gettext('Previous')}
                        icon="arrow-left"
                        onClick={this.prev}
                    />
                </div>

                <div>
                    <span style={{opacity: 0.5}}>
                        {(currentPage + 1)} / {pagesTotal}
                    </span>
                </div>

                <div>
                    <IconButton
                        ariaValue={gettext('Next')}
                        icon="arrow-right"
                        onClick={this.next}
                    />
                </div>
            </Spacer>
        );

        const titleInput = !readOnly && showTitleInput
            ? (
                <Input
                    type="text"
                    label={gettext('Title')}
                    value={item.headline ?? ''}
                    onChange={(val) => {
                        onChange(
                            mediaItems.map(
                                (_item, i) => i === currentPage
                                    ? {..._item, headline: val}
                                    : _item,
                            ),
                        );
                    }}
                />
            )
            : null;

        const descriptionInput = !readOnly && showDescriptionInput
            ? (
                <Input
                    type="text"
                    label={gettext('Description')}
                    value={item.description_text ?? ''}
                    onChange={(val) => {
                        onChange(
                            mediaItems.map(
                                (_item, i) => i === currentPage
                                    ? {..._item, description_text: val}
                                    : _item,
                            ),
                        );
                    }}
                />
            )
            : null;

        return (
            <div className="field--media">
                <div
                    tabIndex={0}
                    className="sd-focusable"
                    onKeyUp={(event) => {
                        if (event.key === 'ArrowRight') {
                            this.next();
                        } else if (event.key === 'ArrowLeft') {
                            this.prev();
                        }
                    }}
                >
                    {(() => {
                        if (item.type === 'picture') {
                            return (
                                <MediaCarouselImage
                                    item={item}
                                    onChange={this.handleChange}
                                    title={title}
                                    removeButton={removeButton}
                                    metadata={metadata}
                                    paginationBar={paginationBar}
                                    titleInput={titleInput}
                                    descriptionInput={descriptionInput}
                                    showCrops={showPictureCrops}
                                    readOnly={readOnly}
                                    canRemoveItems={canRemoveItems}
                                    prepareForExternalEditing={this.props.prepareForExternalEditing}
                                />
                            );
                        } else if (item.type === 'video') {
                            return (
                                <MediaCarouselVideo
                                    item={item}
                                    onChange={this.handleChange}
                                    title={title}
                                    removeButton={removeButton}
                                    metadata={metadata}
                                    paginationBar={paginationBar}
                                    titleInput={titleInput}
                                    descriptionInput={descriptionInput}
                                    readOnly={readOnly}
                                    canRemoveItems={canRemoveItems}
                                    prepareForExternalEditing={this.props.prepareForExternalEditing}
                                />
                            );
                        } else if (item.type === 'audio') {
                            return (
                                <MediaCarouselAudio
                                    item={item}
                                    onChange={this.handleChange}
                                    title={title}
                                    removeButton={removeButton}
                                    metadata={metadata}
                                    paginationBar={paginationBar}
                                    titleInput={titleInput}
                                    descriptionInput={descriptionInput}
                                    readOnly={readOnly}
                                    canRemoveItems={canRemoveItems}
                                    prepareForExternalEditing={this.props.prepareForExternalEditing}
                                />
                            );
                        }
                    })()}
                </div>
            </div>
        );
    }
}
