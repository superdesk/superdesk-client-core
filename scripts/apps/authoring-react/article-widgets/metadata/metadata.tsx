import React, {Fragment} from 'react';
import {IArticleSideWidget, IArticleSideWidgetComponentType} from 'superdesk-api';
import {gettext} from 'core/utils';
import {AuthoringWidgetHeading} from 'apps/dashboard/widget-heading';
import {AuthoringWidgetLayout} from 'apps/dashboard/widget-layout';
import {Spacer} from 'core/ui/components/Spacer';
import {Input, Select, Switch, Option, Heading, ContentDivider, Label} from 'superdesk-ui-framework/react';
import {MetadataItem} from './metadata-item';
import {dataApi} from 'core/helpers/CrudManager';
import {ILanguage} from 'superdesk-interfaces/Language';
import {DateTime} from 'core/ui/components/DateTime';
import {vocabularies} from 'api/vocabularies';
import Datetime from 'core/datetime/datetime';
import {sdApi} from 'api';
import {StateComponent} from 'apps/search/components/fields/state';
import {AnnotationsPreview} from './AnnotationsPreview';

// Can't call `gettext` in the top level
const getLabel = () => gettext('Metadata');
const METADATA_WIDGET_ID = 'metadata-widget';

interface IState {
    languages: Array<ILanguage>;
}

class MetadataWidget extends React.PureComponent<IArticleSideWidgetComponentType, IState> {
    constructor(props: IArticleSideWidgetComponentType) {
        super(props);

        this.state = {
            languages: [],
        };
    }

    componentDidMount(): void {
        dataApi.query<ILanguage>(
            'languages',
            1,
            {field: 'language', direction: 'ascending'},
            {},
        ).then(({_items}) => {
            this.setState({
                languages: _items,
            });
        });
    }

    render() {
        const {article} = this.props;
        const {
            flags,
            usageterms,
            pubstatus,
            expiry,
            urgency,
            priority,
            word_count,
            source,
            anpa_take_key,
            genre,
            dateline,
            slugline,
            byline,
            sign_off,
            guid,
            unique_name,
            type,
            language,
            copyrightholder,
            copyrightnotice,
            creditline,
            original_source,
            ingest_provider_sequence,
            ingest_provider,
            keywords,
            signal,
            anpa_category,
            place,
            ednote,
            _current_version,
            firstcreated,
            versioncreated,
            renditions,
            original_id,
            originalCreator,
            versioncreator,
            rewritten_by,
        } = article;
        const {onItemChange} = this.props;
        const allVocabularies = sdApi.vocabularies.getAll();
        const hasGenre = allVocabularies.map((v) => v.schema_field).includes('genre') === false;
        const hasPlace = allVocabularies.map((v) => v.schema_field).includes('place') === false;

        return (
            <AuthoringWidgetLayout
                header={(
                    <AuthoringWidgetHeading
                        widgetId={METADATA_WIDGET_ID}
                        widgetName={getLabel()}
                        editMode={false}
                    />
                )}
                body={(
                    <Spacer v gap="16" noWrap>
                        <Spacer h gap="64" justifyContent="space-between" noWrap>
                            <Heading type="h6" align="start">
                                {gettext('Not For Publication')}
                            </Heading>
                            <Switch
                                label={{content: ''}} // TODO: Implement accessibility
                                onChange={() => {
                                    onItemChange({
                                        ...article,
                                        flags: {
                                            ...flags,
                                            marked_for_not_publication: !flags.marked_for_not_publication,
                                        },
                                    });
                                }}
                                value={flags.marked_for_not_publication}
                            />
                        </Spacer>

                        <ContentDivider border type="dotted" margin="none" />

                        <Spacer h gap="64" justifyContent="space-between" noWrap>
                            <Heading type="h6" align="start">
                                {gettext('Legal')}
                            </Heading>
                            <Switch
                                label={{content: ''}} // TODO: Implement accessibility
                                onChange={() => {
                                    onItemChange({
                                        ...article,
                                        flags: {...flags, marked_for_legal: !flags.marked_for_legal},
                                    });
                                }}
                                value={flags.marked_for_legal}
                            />
                        </Spacer>

                        <ContentDivider border type="dotted" margin="x-small" />

                        <Input
                            label={gettext('Usage terms').toUpperCase()}
                            inlineLabel
                            type="text"
                            value={usageterms ?? ''}
                            onChange={(value) => {
                                onItemChange({
                                    ...article,
                                    usageterms: value,
                                });
                            }}
                        />

                        <ContentDivider border type="dotted" margin="x-small" />

                        <Select
                            inlineLabel
                            label={gettext('Language').toUpperCase()}
                            value={language}
                            onChange={(val) => {
                                onItemChange({
                                    ...article,
                                    language: val,
                                });
                            }}
                        >
                            {
                                this.state.languages.map((lang) =>
                                    <Option value={lang.language} key={lang._id}>{lang.label}</Option>,
                                )
                            }
                        </Select>

                        <ContentDivider border type="dotted" margin="x-small" />

                        {(pubstatus?.length ?? 0) > 0 && (
                            <MetadataItem
                                label={gettext('Pubstatus')}
                                value={pubstatus}
                            />
                        )}

                        {(original_source?.length ?? 0) > 0 && (
                            <MetadataItem
                                label={gettext('Original source')}
                                value={original_source}
                            />
                        )}

                        {(copyrightholder?.length ?? 0) > 0 && (
                            <MetadataItem
                                label={gettext('Copyright')}
                                value={copyrightholder}
                            />
                        )}

                        {(copyrightnotice?.length ?? 0) > 0 && (
                            <MetadataItem
                                label={gettext('Copyright notice')}
                                value={copyrightnotice}
                            />
                        )}

                        {(creditline?.length ?? 0) > 0 && (
                            <MetadataItem
                                label={gettext('Credit')}
                                value={creditline}
                            />
                        )}

                        {<>
                            <Spacer h gap="64" justifyContent="space-between" noWrap>
                                <Heading type="h6">
                                    {gettext('State').toUpperCase()}
                                </Heading>
                                <Spacer h gap="4" justifyContent="start" noWrap style={{flexWrap: 'wrap'}} >
                                    <StateComponent item={article} />
                                    {article.embargo && (
                                        <Label
                                            style="hollow"
                                            type="alert"
                                            text={gettext('embargo')}
                                        />
                                    )}
                                    {flags.marked_for_not_publication && (
                                        <Label
                                            text={gettext('Not For Publication')}
                                            style="hollow"
                                            type="alert"
                                        />
                                    )}
                                    {flags.marked_for_legal && (
                                        <Label
                                            text={gettext('Legal')}
                                            style="hollow"
                                            type="alert"
                                        />
                                    )}
                                    {flags.marked_for_sms && (
                                        <Label
                                            text={gettext('Sms')}
                                            style="hollow"
                                            type="alert"
                                        />
                                    )}
                                    {(rewritten_by?.length ?? 0) > 0 && (
                                        <Label
                                            text={gettext('Updated')}
                                            style="hollow"
                                            type="alert"
                                        />
                                    )}
                                </Spacer>
                            </Spacer>
                            <ContentDivider border type="dotted" margin="x-small" />
                        </>}

                        {ingest_provider != null && (
                            <MetadataItem
                                label={gettext('Ingest Provider')}
                                value={ingest_provider}
                            />
                        )}

                        {(ingest_provider_sequence?.length ?? 0) > 0 && (
                            <MetadataItem
                                label={gettext('Ingest sequence')}
                                value={ingest_provider_sequence}
                            />
                        )}

                        {expiry && (
                            <MetadataItem
                                label={gettext('Expiry')}
                                value={<DateTime dateTime={expiry} />}
                            />
                        )}

                        {(slugline?.length ?? 0) > 0 && <MetadataItem label={gettext('Slugline')} value={slugline} />}

                        {(urgency?.length ?? 0) > 0 && <MetadataItem label={gettext('Urgency')} value={urgency} />}

                        {priority && <MetadataItem label={gettext('Priority')} value={priority} />}

                        {word_count > 0 && <MetadataItem label={gettext('Word Count')} value={word_count} />}

                        {keywords && (
                            <MetadataItem
                                label={gettext('Word Count')}
                                value={sdApi.vocabularies.vocabularyItemsToString(keywords)}
                            />
                        )}

                        {(source?.length ?? 0) > 0 && <MetadataItem label={gettext('Source')} value={source} />}

                        <MetadataItem label={gettext('Take key')} value={anpa_take_key} />

                        {signal && (
                            <MetadataItem
                                label={gettext('Signal')}
                                value={(
                                    <div>
                                        {(signal.map(({name, qcode}) => (
                                            <Fragment key={name}>{name ?? qcode}</Fragment>
                                        )))}
                                    </div>
                                )}
                            />
                        )}

                        {anpa_category?.name != null && (
                            <MetadataItem
                                label={gettext('Category')}
                                value={sdApi.vocabularies.vocabularyItemsToString(anpa_category, 'name')}
                            />
                        )}

                        {allVocabularies.filter((cv) => article[cv.schema_field] != null).toArray()
                            .map((vocabulary) => (
                                <MetadataItem
                                    key={vocabulary._id}
                                    label={vocabulary.display_name}
                                    value={vocabularies.getVocabularyItemLabel(
                                        article[vocabulary.schema_field],
                                        article,
                                    )}
                                />
                            ))
                        }

                        {(genre?.length ?? 0) > 0 && hasGenre && (
                            <MetadataItem
                                label={gettext('Genre')}
                                value={sdApi.vocabularies.vocabularyItemsToString(genre, 'name')}
                            />
                        )}

                        {(place?.length ?? 0) > 0 && hasPlace && (
                            <MetadataItem
                                label={gettext('Place')}
                                value={sdApi.vocabularies.vocabularyItemsToString(place, 'name')}
                            />
                        )}

                        {(ednote?.length ?? 0) > 0 && <MetadataItem label={gettext('Editorial note')} value={ednote} />}

                        <Spacer v gap="4" justifyContent="space-between">
                            <Heading type="h6" align="start">
                                {gettext('Dateline').toUpperCase()}
                            </Heading>
                            <Spacer h gap="4" justifyContent="space-between" noWrap>
                                <DateTime dateTime={dateline?.date} /> /
                                <span>{dateline?.located.city}</span>
                            </Spacer>
                        </Spacer>

                        <ContentDivider border type="dotted" margin="x-small" />

                        <MetadataItem label={gettext('Byline')} value={byline} />

                        <MetadataItem label={gettext('Sign-off')} value={sign_off} />

                        {_current_version && <MetadataItem label={gettext('Version')} value={_current_version} />}

                        {firstcreated && (
                            <MetadataItem
                                label={gettext('Created')}
                                value={(
                                    <DateTime
                                        dateTime={firstcreated}
                                    />
                                )}
                            />
                        )}

                        {versioncreated && (
                            <MetadataItem
                                label={gettext('Last updated')}
                                value={<DateTime dateTime={versioncreated} />}
                            />
                        )}

                        <MetadataItem label={gettext('Original Id')} value={original_id} />

                        {(originalCreator?.length ?? 0) > 0 && (
                            <MetadataItem
                                label={gettext('Original creator')}
                                value={originalCreator}
                            />
                        )}

                        {(versioncreator?.length ?? 0) > 0 && (
                            <MetadataItem
                                label={gettext('Version creator')}
                                value={versioncreator}
                            />
                        )}

                        <MetadataItem label={gettext('Guid').toUpperCase()} value={guid} />

                        <Input
                            label={gettext('Unique name').toUpperCase()}
                            inlineLabel
                            type="text"
                            value={unique_name}
                            onChange={(value) => {
                                onItemChange({
                                    ...article,
                                    unique_name: value,
                                });
                            }}
                        />

                        <ContentDivider border type="dotted" margin="x-small" />

                        <MetadataItem label={gettext('Type')} value={type} />

                        {renditions?.original != null && (
                            <MetadataItem
                                label={gettext('Type')}
                                value={`${renditions.original.width} x ${renditions.original.height}`}
                            />
                        )}

                        {article.type === 'picture' && article.archive_description !== article.description_text && (
                            <AnnotationsPreview article={article} />
                        )}
                    </Spacer>
                )}
            />
        );
    }
}

export function getMetadataWidget() {
    const metadataWidget: IArticleSideWidget = {
        _id: METADATA_WIDGET_ID,
        label: getLabel(),
        order: 1,
        icon: 'info',
        component: MetadataWidget,
    };

    return metadataWidget;
}
