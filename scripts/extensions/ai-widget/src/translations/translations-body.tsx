import React from 'react';
import {ReactNode} from 'react';
import {convertToRaw, ContentState} from 'draft-js';
import {IArticle, OrderedMap} from 'superdesk-api';
import {
    IconButton,
    Container,
    ButtonGroup,
    Button,
    Loader,
    Heading,
    Spacer,
    Label,
    Icon,
} from 'superdesk-ui-framework/react';
import {superdesk} from '../superdesk';
import {IStateTranslationsTab, ITranslationLanguage} from '../ai-assistant';

interface IProps {
    article: IArticle;
    error: boolean;
    loading: boolean;
    translation: string;
    generateTranslation: () => void;
    fieldsData?: OrderedMap<string, unknown>;
    onFieldsDataChange?(fieldsData?: OrderedMap<string, unknown>): void;
    activeLanguageId: ITranslationLanguage;
    mode: IStateTranslationsTab['mode'];
}

interface IState {
    translatedFromLanguage: string | null;
}

export default class TranslationsBody extends React.Component<IProps, IState> {
    constructor(props: IProps) {
        super(props);

        this.state = {
            translatedFromLanguage: null,
        };
    }

    componentDidMount(): void {
        if (this.props.article.translated_from != null) {
            superdesk.dataApi.findOne<IArticle>(
                'archive',
                this.props.article.translated_from,
            ).then((article) => {
                this.setState({
                    translatedFromLanguage: article.language,
                });
            });
        }
    }

    render(): ReactNode {
        const {error, loading, translation, article, generateTranslation} = this.props;
        const {gettext} = superdesk.localization;

        if (error) {
            return (
                <Spacer v alignItems="center" gap="8" justifyContent="center" noWrap>
                    <Button
                        style="hollow"
                        onClick={generateTranslation}
                        text={gettext('Regenerate')}
                    />
                    <Heading type="h6" align="center">
                        {gettext('There was an error when trying to generate a translation.')}
                    </Heading>
                </Spacer>
            );
        }

        if (loading) {
            return <Loader overlay />;
        }

        if (translation == '') {
            return (
                <Spacer v alignItems="center" gap="8" justifyContent="center" noWrap>
                    <Heading type="h3" align="center">
                        {gettext('No Translations yet')}
                    </Heading>
                    <Heading type="h6" align="center">
                        {gettext('Choose the language and click the translate button at the bottom')}
                    </Heading>
                </Spacer>
            );
        }

        return (
            <Container gap="small" direction="column" className="sd-overflow--y-auto">
                <Spacer v gap="16" justifyContent="end" noGrow>
                    <Spacer h gap="4" justifyContent="end" alignItems="center" noWrap>
                        <Label
                            text={this.props.mode === 'other'
                                ? this.state.translatedFromLanguage
                                : this.props.article.language
                            }
                            size="small"
                        />
                        <Icon
                            name="arrow-right"
                            size="small"
                        />
                        <Label
                            text={this.props.activeLanguageId}
                            size="small"
                            type="primary"
                        />
                    </Spacer>
                    <div className="sd-text" dangerouslySetInnerHTML={{__html: translation}} />
                </Spacer>
                <ButtonGroup orientation="horizontal" align="center">
                    <IconButton
                        ariaValue={gettext('Copy')}
                        icon="copy"
                        onClick={() => {
                            navigator.clipboard.writeText(translation);
                        }}
                    />
                    {this.props.mode === 'current' && (
                        <Button
                            onClick={() => {
                                const {translate, get, patch} = superdesk.entities.article;

                                translate(
                                    article,
                                    this.props.activeLanguageId,
                                ).then((translatedItem) =>
                                    get(translatedItem._id).then((fullTranslatedItem) => {
                                        return patch(
                                            fullTranslatedItem,
                                            {body_html: translation, fields_meta: {}},
                                        ).then(() => {
                                            superdesk.ui.article.edit(fullTranslatedItem._id);
                                        });
                                    }),
                                );
                            }}
                            size="small"
                            text={gettext('Create article')}
                            style="hollow"
                        />
                    )}
                    <Button
                        onClick={() => {
                            if (superdesk.instance.authoringReactViewEnabled) {
                                const rawState = convertToRaw(ContentState.createFromText(translation));

                                this.props.onFieldsDataChange?.(
                                    this.props.fieldsData?.set(
                                        'body_html',
                                        superdesk.helpers.editor3ToOperationalFormat(
                                            {rawContentState: rawState},
                                            article.language,
                                        ),
                                    ));
                            } else {
                                superdesk.ui.article.applyFieldChangesToEditor(
                                    article._id,
                                    {key: 'body_html', value: translation},
                                );
                            }
                        }}
                        size="small"
                        text={gettext('Apply')}
                        style="hollow"
                    />
                </ButtonGroup>
            </Container>
        );
    }
}
