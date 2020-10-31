import React from 'react';

import {noop} from 'lodash';
import {assertNever} from 'core/helpers/typescript-helpers';

import {IAuthoringField} from './types';

import {PlainTextPreview} from './field-types/plainText';
import {HtmlPreview} from './field-types/html';
import {SubjectsPreview} from './field-types/subjects';
import {VocabularyValuePreview} from './field-types/vocabularyValues';
import {UrlsPreview} from './field-types/urls';
import {MediaPreview} from './field-types/media';
import {ItemsListLimited} from 'core/itemList/items-list-limited';
import {EmbedPreview} from './field-types/embed';
import {AttachmentsPreview} from './field-types/attachments';
import {PreviewCustomField} from '../authoring/preview-custom-field';

interface IProps {
    field: IAuthoringField;
    language: string;
}

export class PreviewFieldType extends React.PureComponent<IProps> {
    render() {
        const {field, language} = this.props;

        return (
            <div>
                {(() => {
                    switch (field.type) {
                    case 'plain-text':
                        return (
                            <PlainTextPreview value={field.value} />
                        );
                    case 'html':
                        return (
                            <HtmlPreview value={field.value} />
                        );
                    case 'subjects':
                        return (
                            <SubjectsPreview subjects={field.value} />
                        );
                    case 'vocabulary-values':
                        return (
                            <VocabularyValuePreview
                                vocabularyId={field.value.vocabularyId}
                                qcodes={field.value.qcodes}
                                language={language}
                            />
                        );
                    case 'urls':
                        return (
                            <UrlsPreview urls={field.value} />
                        );
                    case 'media-gallery':
                        return (
                            <MediaPreview mediaItems={field.value} />
                        );
                    case 'related-articles':
                        return (
                            <ItemsListLimited
                                ids={field.value.map(({_id}) => _id)}
                                onItemClick={noop}
                            />
                        );
                    case 'embed':
                        return (
                            <EmbedPreview
                                embed={field.value.embed}
                                description={field.value.description}
                            />
                        );
                    case 'attachments':
                        return (
                            <AttachmentsPreview attachmentsIds={field.value} />
                        );
                    case 'custom':
                        return (
                            <PreviewCustomField
                                item={field.value.item}
                                field={field.value.field}
                            />
                        );
                    default:
                        assertNever(field);
                    }
                })()}
            </div>
        );
    }
}
