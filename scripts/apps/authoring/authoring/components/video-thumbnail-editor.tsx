import React from 'react';
import {IArticle} from 'superdesk-api';
import {DropZone} from 'core/ui/components';
import ng from 'core/services/ng';
import {gettext} from 'core/utils';
import {getViewImage} from 'core/helpers/item';

interface IProps {
    item: IArticle;
    onChange: (item: IArticle, timeout?: number) => void;
}

const RENDITION_MAPPING = {
    'original': 'thumbnail',
    'viewImage': 'viewImage',
};

export class VideoThumbnailEditor extends React.Component<IProps> {
    handleFiles(files: Array<File>) {
        this.uploadFile(files[0]);
    }

    uploadFile(file: File) {
        const urls = ng.get('urls');
        const upload = ng.get('upload');

        urls.resource('upload')
            .then((uploadURL) =>
                upload.start({
                    method: 'POST',
                    url: uploadURL,
                    data: {media: file},
                }),
            )
            .then(
                (response) => {
                    const {item, onChange} = this.props;
                    const renditions: IArticle['renditions'] = Object.assign(item.renditions || {});

                    Object.keys(RENDITION_MAPPING).forEach((src) => {
                        const rendition = response.data.renditions[src];

                        if (rendition != null) {
                            renditions[RENDITION_MAPPING[src]] = rendition;
                        }
                    });

                    item.renditions = renditions;
                    onChange(item, 10);
                },
            );
    }

    removeThumbnail() {
        const {item, onChange} = this.props;
        const renditions = item.renditions || {};

        Object.values(RENDITION_MAPPING).forEach((rendition) => {
            if (renditions[rendition] != null) {
                renditions[rendition] = null;
            }
        });

        onChange(item, 10);
    }

    render() {
        const {item} = this.props;
        const thumbnail = getViewImage(item);
        const showFigure = thumbnail != null && thumbnail.mimetype.startsWith('image');

        return (
            <DropZone
                label=""
                className={showFigure ? '' : 'btn btn--hollow btn--small'}
                fileAccept="image/*"
                onFileSelect={(files) => this.handleFiles(files)}
                canDrop={(event) => {
                    return event.dataTransfer.items.length > 0 && event.dataTransfer.items[0].type.startsWith('image/');
                }}
                onDrop={(event) => {
                    event.preventDefault();
                    this.handleFiles(Array.from(event.dataTransfer.files));
                }}
            >
                {showFigure && (
                    <figure className="item-association item-association--preview" style={{height: 'auto'}}>
                        <a
                            className="item-association__remove-item"
                            onClick={(event) => {
                                event.stopPropagation();
                                this.removeThumbnail();
                            }}
                        >
                            <i className="icon-close-small" />
                        </a>
                        <img src={thumbnail.href} title={gettext('Click to replace thumbnail')} />
                        <figcaption>{gettext('Thumbnail')}</figcaption>
                    </figure>
                )}
                {!showFigure && (
                    <span>{gettext('Select thumbnail')}</span>
                )}
            </DropZone>
        );
    }
}
