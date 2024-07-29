import React from 'react';
import {IArticle, IVocabulary} from 'superdesk-api';
import {getLabelNameResolver} from 'apps/workspace/helpers/getLabelForFieldId';
import {PreviewFieldType} from './previewFieldByType';
import {gettext} from 'core/utils';
import {formatDate, dispatchCustomEvent} from 'core/get-superdesk-api-implementation';
import {MediaMetadataView} from '../media/MediaMetadataView';
import {appConfig} from 'appConfig';
import {getSortedFields} from './utils';
import {sdApi} from 'api';

interface IProps {
    item: IArticle;
    editor: any;
    fields: any;
    hideMedia: boolean;
}

interface IState {
    loading: boolean;
    customFieldVocabularies: Array<IVocabulary>;
}

export class FullPreview extends React.Component<IProps, IState> {
    getLabel: (fieldId: string) => string;

    constructor(props: IProps) {
        super(props);

        this.state = {
            loading: true,
            customFieldVocabularies: [],
        };
    }

    componentDidMount() {
        dispatchCustomEvent('articlePreviewStart', this.props.item);

        getLabelNameResolver().then((getLabel) => {
            const customFieldVocabularies = sdApi.vocabularies.getCustomFieldVocabularies();

            this.getLabel = getLabel;

            this.setState({
                customFieldVocabularies,
                loading: false,
            });
        });
    }

    componentWillUnmount() {
        dispatchCustomEvent('articlePreviewEnd', this.props.item);
    }

    componentDidUpdate(prevProps: IProps) {
        if (prevProps.item._id !== this.props.item._id) {
            dispatchCustomEvent('articlePreviewEnd', prevProps.item);
            dispatchCustomEvent('articlePreviewStart', this.props.item);
        }
    }

    render() {
        if (this.state.loading) {
            return null;
        }

        const {hideMedia, editor, item} = this.props;

        const rowSpacingVertical = 4;

        return (
            <div className="preview-content">
                <div>
                    <div className="css-table">
                        <div className="tr">
                            <div className="td" style={{paddingBlockEnd: rowSpacingVertical}}>
                                <span className="form-label">{gettext('Last modified')}</span>
                            </div>

                            <div
                                className="td"
                                style={{paddingInlineStart: 30, paddingBlockEnd: rowSpacingVertical}}
                            >
                                {formatDate(new Date(item.versioncreated))}
                            </div>
                        </div>

                        {
                            getSortedFields('header', editor, item, hideMedia, this.state.customFieldVocabularies)
                                .map((field) => {
                                    return (
                                        <div key={field.id} className="tr">
                                            <div className="td" style={{paddingBlockEnd: rowSpacingVertical}}>
                                                <span className="form-label">{this.getLabel(field.id)}</span>
                                            </div>

                                            <div
                                                className="td"
                                                style={{paddingInlineStart: 30, paddingBlockEnd: rowSpacingVertical}}
                                            >
                                                <PreviewFieldType field={field} language={item.language} />
                                            </div>
                                        </div>
                                    );
                                })
                        }
                    </div>

                    <br />

                    {
                        item.type === 'picture' && hideMedia !== true && item.renditions?.baseImage?.href != null
                            ? (
                                <div>
                                    <img src={item.renditions.baseImage.href} />

                                    <MediaMetadataView
                                        item={item}
                                        className="media-container__metadata media-container__metadata--image"
                                    />
                                </div>
                            )
                            : null
                    }

                    <br />

                    {
                        getSortedFields('content', editor, item, hideMedia, this.state.customFieldVocabularies)
                            .map((field) => {
                                return (
                                    <div key={field.id}>
                                        {
                                            appConfig?.authoring?.preview?.hideContentLabels === true ? <br /> : (
                                                <h3 style={{marginBlockStart: 20, marginBlockEnd: 10}}>
                                                    {this.getLabel(field.id)}
                                                </h3>
                                            )
                                        }
                                        <div>
                                            <PreviewFieldType field={field} language={item.language} />
                                        </div>
                                    </div>
                                );
                            })
                    }

                    <br />

                </div>
            </div>
        );
    }
}
