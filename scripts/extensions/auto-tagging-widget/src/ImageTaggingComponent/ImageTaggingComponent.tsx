import * as React from 'react';
import {superdesk} from '../superdesk';
import {IArticle} from 'superdesk-api';
import {ITagUi} from '../types';
import {OrderedMap} from 'immutable';
import {IServerResponse, ITagBase, toServerFormat} from '../adapter';
import {ToggleBox, IconButton, Popover} from 'superdesk-ui-framework/react';
import {debounce} from 'lodash';

interface ITagInput {
    title: string;
    type: string;
    pubStatus: boolean;
    weight: number;
}

interface IImage {
    imageUrl: string;
    thumbnailUrl: string;
    id?: string;
    headline?: string;
    caption?: string;
    credit?: string;
    byline?: string;
    source?: string;
    dateCreated?: string;
    archivedTime?: string;
}

interface IImageServerResponse {
    result: Array<IImage>;
}

interface IProps {
    data: OrderedMap<string, ITagUi>;
    style?: React.CSSProperties;
    article: IArticle;
}

interface IState {
    isLoading: boolean;
    selectedImage: IImage | null;
    images: Array<IImage>;
}

const gridContainerStyle: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: '3fr 1fr',
    gridColumnGap: '4px',
    maxHeight: '320px',
    overflow: 'hidden',
};

const gridItemLeftStyle: React.CSSProperties = {
    width: '100%',
    height: '100%',
    maxHeight: 'inherit',
};

const gridItemRightStyle: React.CSSProperties = {
    width: '100%',
    height: '100%',
    maxHeight: 'inherit',
};

const imageContentStyle: React.CSSProperties = {
    width: '100%',
    maxHeight: 'inherit',
    overflowY: 'auto',
    display: 'grid',
    gridRowGap: '4px',
};

const imageStyle: React.CSSProperties = {
    width: '100%',
    height: 'auto',
    cursor: 'grab',
};

const imageWrapperStyle: React.CSSProperties = {
    cursor: 'pointer',
    maxHeight: '100%',
};

const selectedCardStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    overflow: 'hidden',
    boxShadow: '1px 3px 6px 0 rgba(0,0,0,0.2)',
    width: '100%',
    borderRadius: '4px',
};

const cardStyle: React.CSSProperties = {
    boxShadow: '1px 3px 6px 0 rgba(0,0,0,0.2)',
    width: '100%',
    borderRadius: '2px',
};

const prepareForDropping = (
    event: React.DragEvent<HTMLDivElement>,
    image: IImage | null,
) => {
    if (image == null) {
        return;
    }

    const additionalData: Partial<IArticle> = {};

    if ((image.caption?.length ?? 0) > 0) {
        additionalData.description_text = image.caption;
    }

    if ((image.headline?.length ?? 0) > 0) {
        additionalData.headline = image.headline;
    }

    if ((image.source?.length ?? 0) > 0) {
        additionalData.source = image.source;
    }

    if ((image.byline?.length ?? 0) > 0) {
        additionalData.byline = image.byline;
    }

    superdesk.ui.article.prepareExternalImageForDroppingToEditor(
        event.nativeEvent,
        {
            thumbnail: {
                href: image.thumbnailUrl,
                mimetype: 'image/jpeg',
            },
            viewImage: {
                href: image.imageUrl,
                mimetype: 'image/jpeg',
            },
            baseImage: {
                href: image.imageUrl,
                mimetype: 'image/jpeg',
            },
        },
        additionalData,
    );
};

const {httpRequestJsonLocal} = superdesk;
const {gettext} = superdesk.localization;

export class ImageTagging extends React.PureComponent<IProps, IState> {
    private abortController: AbortController;
    private debouncedFetch;
    constructor(props: IProps) {
        super(props);

        this.state = {
            isLoading: false,
            selectedImage: null,
            images: [],
        };
        this.abortController = new AbortController();
        this.debouncedFetch = debounce(() => {
            this.runFetchImages();
        }, 1500);
        this.runFetchImages = this.runFetchImages.bind(this);
        this.formatTags = this.formatTags.bind(this);
        this.handleClickImage = this.handleClickImage.bind(this);
    }

    componentDidMount() {
        if (!this.state.isLoading) {
            this.runFetchImages();
        }
    }

    componentWillUnmount() {
        this.abortController.abort();
        this.debouncedFetch.cancel();
    }

    componentDidUpdate(prevProps: IProps) {
        if (this.props.data !== prevProps.data) {
            this.debouncedFetch();
        }
    }

    runFetchImages() {
        const formattedTags: Array<ITagInput> = this.formatTags(
            toServerFormat(this.props.data, superdesk),
        );

        if (!formattedTags || formattedTags.length < 1) {
            this.setState({
                selectedImage: null,
                images: [],
            });
            return;
        }
        this.setState({isLoading: true}, () => {
            httpRequestJsonLocal<IImageServerResponse>({
                abortSignal: this.abortController.signal,
                method: 'POST',
                path: '/ai_image_suggestions/',
                payload: {
                    service: 'imatrics',
                    items: formattedTags,
                },
            })
                .then((res) => {
                    try {
                        this.setState({
                            selectedImage: res.result[0],
                            images: res.result ?? [],
                        });
                    } catch {
                        this.setState({
                            selectedImage: null,
                            images: [],
                        });
                    }
                })
                .catch((e: Error) => {
                    superdesk.ui.alert('Failed to fetch image suggestions. Please, try again!\r'
                    + JSON.stringify(e));
                })
                .finally(() => this.setState({isLoading: false}));
        });
    }

    formatTags = (concepts: IServerResponse) => {
        let res: Array<ITagInput> = [];

        for (const key in concepts) {
            if (key === 'subject') {
                concepts[key]?.forEach((concept: ITagBase) => {
                    res.push({
                        title: concept.name,
                        type: 'category',
                        pubStatus: true,
                        weight: 1,
                    });
                });
            } else if (
                key === 'organisation' ||
                key === 'person' ||
                key === 'event' ||
                key === 'place' ||
                key === 'object'
            ) {
                concepts[key]?.forEach((concept: ITagBase) => {
                    res.push({
                        title: concept.name,
                        type: key,
                        pubStatus: true,
                        weight: 1,
                    });
                });
            }
        }
        return res;
    }

    handleClickImage = (image: IImage) => {
        this.setState({selectedImage: image});
    }

    render() {
        const {style} = this.props;
        const {isLoading, selectedImage, images} = this.state;

        return (
            <ToggleBox
                className="toggle-box--circle"
                title={isLoading ? gettext('image suggestions (...)')
                    : gettext('image suggestions ({{n}})', {n: images.length})}
                initiallyOpen={true}
                badge={(
                    <IconButton
                        id="image-suggestions-info-btn"
                        icon="info-sign"
                        size="small"
                        ariaValue="info"
                    />
                )}
            >
                <Popover
                    title={gettext('Information')}
                    placement="bottom-end"
                    triggerSelector="#image-suggestions-info-btn"
                    zIndex={999}
                >
                    The image suggestions are based on the tags.
                    You can drag and drop the images onto the body HTML.
                </Popover>
                <div style={style}>
                    {isLoading ? (
                        <div
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                            }}
                        >
                            <div className="spinner-big" />
                        </div>
                    ) : images?.length > 0 ? (
                        <div style={gridContainerStyle}>
                            <div style={gridItemLeftStyle}>
                                <figure style={selectedCardStyle}>
                                    <div style={{maxHeight: '72%'}}>
                                        <img
                                            style={imageStyle}
                                            alt=""
                                            src={selectedImage?.imageUrl}
                                            onDragStart={(event) =>
                                                prepareForDropping(event, selectedImage)
                                            }
                                        />
                                    </div>
                                    <figcaption
                                        style={{
                                            padding: '4px',
                                            overflow: 'auto',
                                            color: '#000',
                                            backgroundColor:
                                                'rgba(255,255,255,0.75)',
                                            height: '100%',
                                        }}
                                    >
                                        {selectedImage?.caption}
                                    </figcaption>
                                </figure>
                            </div>
                            <div style={gridItemRightStyle}>
                                <div style={imageContentStyle}>
                                    {images.map(
                                        (image: IImage, i: number) => (
                                            <div key={i} style={cardStyle}>
                                                <div
                                                    style={
                                                        imageWrapperStyle
                                                    }
                                                >
                                                    <img
                                                        style={imageStyle}
                                                        key={i}
                                                        alt=""
                                                        src={image.imageUrl}
                                                        onClick={() => {
                                                            this.handleClickImage(image);
                                                        }}
                                                        onDragStart={(event) =>
                                                            prepareForDropping(event, image)
                                                        }
                                                    />
                                                </div>
                                            </div>
                                        ),
                                    )}
                                </div>
                            </div>
                        </div>
                    ) : null}
                </div>
            </ToggleBox>
        );
    }
}
