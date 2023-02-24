import React from 'react';
import {IArticleSideWidget, IExtensionActivationResult} from 'superdesk-api';
import {gettext} from 'core/utils';
import {AuthoringWidgetHeading} from 'apps/dashboard/widget-heading';
import {AuthoringWidgetLayout} from 'apps/dashboard/widget-layout';
import {Spacer} from 'core/ui/components/Spacer';
import {Input, Select, Switch, Option, Heading, ContentDivider} from 'superdesk-ui-framework/react';
import {MetadataItem} from './metadata-item';
import {dataApi} from 'core/helpers/CrudManager';
import {ILanguage} from 'superdesk-interfaces/Language';

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
            byline,
            sign_off,
            version,
            created,
            used_updated,
            guid,
            _id,
            unique_name,
            type,
            language,
        } = this.props.article;

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
                    <Spacer v gap="16">
                        <Spacer h gap="64" justifyContent="space-between" noGrow>
                            <Heading
                                type="h6"
                                align="start"
                            >
                                {getNotForPublicationLabel()}
                            </Heading>
                            <Switch
                                label={getNotForPublicationLabel()}
                                onChange={() => {
                                    onArticleChange({
                                        ...this.props.article,
                                        flags: {...flags, marked_for_not_publication: !flags.marked_for_not_publication},
                                    });
                                }}
                                value={flags.marked_for_not_publication}
                            />
                        </Spacer>
                        <ContentDivider border type="dotted" margin="x-small" />
                        <Spacer h gap="64" justifyContent="space-between" noGrow>
                            <Heading
                                type="h6"
                                align="start"
                            >
                                {getLegalLabel()}
                            </Heading>
                            <Switch
                                label={getLegalLabel()}
                                onChange={() => {
                                    onArticleChange({
                                        ...this.props.article,
                                        flags: {...flags, marked_for_legal: !flags.marked_for_legal},
                                    });
                                }}
                                value={flags.marked_for_legal}
                            />
                        </Spacer>
                        <ContentDivider border type="dotted" margin="x-small" />
                        <Input
                            label="Usage terms"
                            inlineLabel
                            type="text"
                            value={usageterms}
                            onChange={(value) => {
                                onArticleChange({
                                    ...this.props.article,
                                    usageterms: value,
                                });
                            }}
                        />
                        <ContentDivider border type="dotted" margin="x-small" />
                        <Select
                            inlineLabel
                            label={'Language'}
                            value={language}
                            onChange={(val) => {
                                onArticleChange({
                                    ...this.props.article,
                                    language: val,
                                });
                            }}
                        >
                            {this.state.languages.map((lang) => <Option key={lang._id} value={lang.language} />)}
                        </Select>
                        <ContentDivider border type="dotted" margin="x-small" />
                        <MetadataItem
                            label="Pubstatus"
                            value={pubstatus}
                        />
                        <MetadataItem
                            label="State"
                            value={state}
                        />
                        <MetadataItem
                            label="Expiry"
                            value={expiry}
                        />
                        <MetadataItem
                            label="Urgency"
                            value={urgency}
                        />
                        <MetadataItem
                            label="Priority"
                            value={priority}
                        />
                        <MetadataItem
                            label="Word count"
                            value={word_count}
                        />
                        <MetadataItem
                            label="Source"
                            value={source}
                        />
                        <MetadataItem
                            label="Take key"
                            value={anpa_take_key}
                        />
                        <div
                            style={{
                                display: 'flex',
                                flexDirection: 'row',
                                justifyContent: 'space-between',
                            }}
                        >
                            Genre:
                            {
                                genre.map((genre) => (
                                    <div key={genre.qcode}>
                                        {genre.name}
                                    </div>
                                ))
                            }
                        </div>
                        <div
                            style={{
                                display: 'flex',
                                flexDirection: 'row',
                                justifyContent: 'space-between',
                            }}
                        >
                            <div>
                                Metadata:
                            </div>
                            <div
                                style={{
                                    display: 'flex',
                                    flexDirection: 'row',
                                    justifyContent: 'space-between',
                                }}
                            >
                                <div>{dateline.date}</div>
                                <div>{dateline.located.city}</div>
                            </div>
                        </div>
                        <MetadataItem
                            label="Byline"
                            value={byline}
                        />
                        <MetadataItem
                            label="Sign-off"
                            value={sign_off}
                        />
                        <MetadataItem
                            label="Version"
                            value={version}
                        />
                        <MetadataItem
                            label="Created"
                            value={created}
                        />
                        <MetadataItem
                            label="Last updated"
                            value={used_updated}
                        />
                        <MetadataItem
                            label="Original Id"
                            value={_id}
                        />
                        <MetadataItem
                            label="GUID"
                            value={guid}
                        />
                        <Input
                            label="Unique name"
                            inlineLabel
                            type="text"
                            value={unique_name}
                            onChange={(value) => {
                                onArticleChange({
                                    ...this.props.article,
                                    unique_name: value,
                                });
                            }}
                        />
                        <MetadataItem
                            label="Type"
                            value={type}
                        />
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
