import React from 'react';
import {IArticle, IVocabulary} from 'superdesk-api';
import {getLabelNameResolver} from 'apps/workspace/helpers/getLabelForFieldId';
import {ARTICLE_HEADER_FIELDS, ARTICLE_COMMON_FIELDS} from 'apps/workspace/content/controllers/ContentProfileFields';
import {dataApi} from 'core/helpers/CrudManager';
import {PreviewFieldType} from './previewFieldByType';
import {IAuthoringField} from './types';
import {getAuthoringField} from './getAuthoringField';
import {authoringFieldHasValue} from './authoringFieldHasValue';
import {isMediaField} from './isMediaField';
import {gettext} from 'core/utils';
import {formatDate} from 'core/get-superdesk-api-implementation';
import {MediaMetadataView} from '../media/MediaMetadataView';

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
        Promise.all([
            dataApi.query<IVocabulary>(
                'vocabularies',
                1,
                {field: 'display_name', direction: 'ascending'},
                {
                    $or: [
                        {field_type: {$exists: true, $ne: null}},
                        {custom_field_type: {$exists: true, $ne: null}},
                    ],
                },
            ),
            getLabelNameResolver(),
        ]).then(([res, getLabel]) => {
            this.getLabel = getLabel;

            this.setState({
                customFieldVocabularies: res._items,
                loading: false,
            });
        });
    }

    render() {
        if (this.state.loading) {
            return null;
        }

        const {hideMedia, editor, item} = this.props;

        const getSortedFields = (section: 'header' | 'content'): Array<IAuthoringField> => {
            return Object.keys(editor)
                .filter(
                    (key) => {
                        const isHeader = editor[key].section === 'header'
                            || ARTICLE_HEADER_FIELDS.has(key as keyof IArticle)
                            || ARTICLE_COMMON_FIELDS.has(key as keyof IArticle);

                        const inSection = editor[key].section != null
                            ? editor[key].section === section
                            : section === 'header' ? isHeader : !isHeader;

                        return inSection && editor[key]?.hideOnPrint !== true;
                    },
                )
                .sort((key1, key2) => editor[key1].order - editor[key2].order)
                .map((key) => getAuthoringField(key, item, this.state.customFieldVocabularies))
                .filter(
                    (field) =>
                        field?.value != null
                        && authoringFieldHasValue(field)
                        && (hideMedia ? isMediaField(field) !== true : true),
                );
        };

        const rowSpacingVertical = 4;

        return (
            <div className="preview-content">
                <div>
                    <div className="css-table">
                        <div className="tr">
                            <div className="td" style={{paddingBottom: rowSpacingVertical}}>
                                <span className="form-label">{gettext('Last modified')}</span>
                            </div>

                            <div
                                className="td"
                                style={{paddingLeft: 30, paddingBottom: rowSpacingVertical}}
                            >
                                {formatDate(new Date(item.versioncreated))}
                            </div>
                        </div>

                        {
                            getSortedFields('header')
                                .map((field) => {
                                    return (
                                        <div key={field.id} className="tr">
                                            <div className="td" style={{paddingBottom: rowSpacingVertical}}>
                                                <span className="form-label">{this.getLabel(field.id)}</span>
                                            </div>

                                            <div
                                                className="td"
                                                style={{paddingLeft: 30, paddingBottom: rowSpacingVertical}}
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
                        getSortedFields('content')
                            .map((field) => {
                                return (
                                    <div key={field.id}>
                                        <h3 style={{marginTop: 20, marginBottom: 10}}>{this.getLabel(field.id)}</h3>
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
