import React from 'react';
import {IArticleSideWidget, IExtensionActivationResult} from 'superdesk-api';
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

// Can't call `gettext` in the top level
const getLabel = () => gettext('Metadata');

const getNotForPublicationLabel = () => gettext('Not for publication');
const getLegalLabel = () => gettext('Legal');

type IProps = React.ComponentProps<
    IExtensionActivationResult['contributions']['authoringSideWidgets'][0]['component']
>;

interface IState {
    languages: Array<ILanguage>;
}

class MetadataWidget extends React.PureComponent<IProps, IState> {
    constructor(props: IProps) {
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
            state,
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
            archive_description,
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
            description_text,
        } = article;

        const {onArticleChange} = this.props;

        return (
            <AuthoringWidgetLayout
                header={(
                    <AuthoringWidgetHeading
                        widgetName={getLabel()}
                        editMode={false}
                    />
                )}
                body={(
                    <Spacer v gap="16" noWrap>
                        <Spacer h gap="64" justifyContent="space-between" noWrap>
                            <Heading type="h6" align="start">
                                {getNotForPublicationLabel()}
                            </Heading>
                            <Switch
                                label={getNotForPublicationLabel()}
                                onChange={() => {
                                    onArticleChange({
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
                                {getLegalLabel()}
                            </Heading>
                            <Switch
                                label={getLegalLabel()}
                                onChange={() => {
                                    onArticleChange({
                                        ...article,
                                        flags: {...flags, marked_for_legal: !flags.marked_for_legal},
                                    });
                                }}
                                value={flags.marked_for_legal}
                            />
                        </Spacer>

                        <ContentDivider border type="dotted" margin="x-small" />

                        <Input
                            label={gettext('USAGE TERMS')}
                            inlineLabel
                            type="text"
                            value={usageterms}
                            onChange={(value) => {
                                onArticleChange({
                                    ...article,
                                    usageterms: value,
                                });
                            }}
                        />

                        <ContentDivider border type="dotted" margin="x-small" />

                        <Select
                            inlineLabel
                            label={gettext('LANGUAGE')}
                            value={language}
                            onChange={(val) => {
                                onArticleChange({
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
                                label={gettext('Copyright')}
                                value={copyrightnotice}
                            />
                        )}

                        {(creditline?.length ?? 0) > 0 && (
                            <MetadataItem
                                label={gettext('Copyright')}
                                value={creditline}
                            />
                        )}

                        {
                            <>
                                <Spacer h gap="64" justifyContent="space-between" noWrap>
                                    <Heading type="h6">
                                        {gettext('STATE')}
                                    </Heading>
                                    <Spacer h gap="4" justifyContent="start" noWrap style={{flexWrap: 'wrap'}} >
                                        <Label text={state} style="hollow" type="warning" size="small" />
                                        {flags.marked_archived_only && (
                                            <Label
                                                text={gettext('Archived')}
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
                                        {flags.marked_for_not_publication && (
                                            <Label
                                                text={gettext('Not for publication')}
                                                style="hollow"
                                                type="alert"
                                            />
                                        )}
                                        {flags.marked_for_sms && (
                                            <Label
                                                text={gettext('SMS')}
                                                style="hollow"
                                                type="alert"
                                            />
                                        )}
                                    </Spacer>
                                </Spacer>
                                <ContentDivider border type="dotted" margin="x-small" />
                            </>
                        }

                        {ingest_provider != null && (
                            <MetadataItem
                                label={gettext('Ingest provider')}
                                value={ingest_provider}
                            />
                        )}

                        {
                            (ingest_provider_sequence?.length ?? 0) > 0 && (
                                <MetadataItem
                                    label={gettext('Ingest provider sequence')}
                                    value={ingest_provider_sequence}
                                />
                            )
                        }

                        {expiry && <MetadataItem label={gettext('Expiry')} value={expiry} />}

                        {(slugline?.length ?? 0) > 0 && <MetadataItem label={gettext('Slugline')} value={slugline} />}

                        {(urgency?.length ?? 0) > 0 && <MetadataItem label={gettext('Urgency')} value={urgency} />}

                        {priority && <MetadataItem label={gettext('Priority')} value={priority} />}

                        {word_count > 0 && <MetadataItem label={gettext('Word count')} value={word_count} />}

                        {keywords && <MetadataItem label={gettext('Keywords')} value={keywords} />}

                        {(source?.length ?? 0) > 0 && <MetadataItem label={gettext('Source')} value={source} />}

                        <MetadataItem label={gettext('Take key')} value={anpa_take_key} />

                        {
                            signal && (
                                <MetadataItem
                                    label={gettext('Signal')}
                                    value={<div>{(signal.map((val) => <>{val.name ?? val.qcode}</>))}</div>}
                                />
                            )
                        }

                        {
                            anpa_category.name != null && (
                                <MetadataItem
                                    label={gettext('Category')}
                                    value={anpa_category.name}
                                />
                            )
                        }

                        {
                            vocabularies
                                .getAll()
                                .filter((cv) => article[cv.schema_field] != null)
                                .toArray()
                                .map((filtered) => (
                                    <MetadataItem
                                        key={filtered._id}
                                        label={filtered.display_name}
                                        value={vocabularies.getLocaleName(article[filtered.schema_field], article)}
                                    />
                                ))
                        }

                        {
                            (genre.length ?? 0) > 0 && (
                                <Spacer h gap="4" justifyContent="space-between">
                                    <Heading type="h6" align="start">
                                        {gettext('GENRE')}
                                    </Heading>
                                    {
                                        genre.map((val) => (
                                            <React.Fragment key={val.qcode}>
                                                {val.name}
                                            </React.Fragment>
                                        ))
                                    }
                                </Spacer>
                            )
                        }

                        {
                            (place.length ?? 0) > 0 && (
                                <Spacer h gap="4" justifyContent="space-between">
                                    <Heading type="h6" align="start">
                                        {gettext('PLACE')}
                                    </Heading>
                                    {
                                        place.map((val) => (
                                            <React.Fragment key={val.qcode}>
                                                {val.name}
                                            </React.Fragment>
                                        ))
                                    }
                                </Spacer>
                            )
                        }

                        {(ednote?.length ?? 0) > 0 && <MetadataItem label={gettext('Editorial note')} value={ednote} />}

                        <ContentDivider border type="dotted" margin="x-small" />

                        <Spacer v gap="4" justifyContent="space-between">
                            <Heading type="h6" align="start">
                                {gettext('DATELINE')}
                            </Heading>
                            <Spacer h gap="4" justifyContent="space-between" noWrap>
                                <DateTime dateTime={dateline.date} /> /
                                <span>{dateline.located.city}</span>
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

                        <MetadataItem label={gettext('GUID')} value={guid} />

                        <Input
                            label={gettext('Unique name')}
                            inlineLabel
                            type="text"
                            value={unique_name}
                            onChange={(value) => {
                                onArticleChange({
                                    ...article,
                                    unique_name: value,
                                });
                            }}
                        />

                        <ContentDivider border type="dotted" margin="x-small" />

                        <MetadataItem label={gettext('Type')} value={type} />

                        {
                            renditions?.original != null && (
                                <MetadataItem
                                    label={gettext('Type')}
                                    value={`${renditions.original.width} x ${renditions.original.height}`}
                                />
                            )
                        }

                        {
                            (archive_description?.length ?? 0) > 0 && archive_description !== description_text && (
                                <MetadataItem
                                    label={gettext('Description')}
                                    value={archive_description}
                                />
                            )
                        }
                    </Spacer>
                )}
            />
        );
    }
}

export function getMetadataWidget() {
    const metadataWidget: IArticleSideWidget = {
        _id: 'metadata-widget',
        label: getLabel(),
        order: 1,
        icon: 'info',
        component: MetadataWidget,
    };

    return metadataWidget;
}
