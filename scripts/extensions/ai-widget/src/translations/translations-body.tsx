import React from 'react';
import {ReactNode} from 'react';
import {convertToRaw, ContentState} from 'draft-js';
import {IArticle, OrderedMap} from 'superdesk-api';
import {
    IconButton,
    Container,
    ButtonGroup,
    Button,
    Text,
    Loader,
    Heading,
    Spacer,
    Label,
    Icon,
} from 'superdesk-ui-framework/react';
import {superdesk} from '../superdesk';
import {ITranslationLanguage} from '../ai-assistant';

interface IProps {
    article: IArticle;
    error: boolean;
    loading: boolean;
    translation: string;
    generateTranslation: () => void;
    fieldsData?: OrderedMap<string, unknown>;
    onFieldsDataChange?(fieldsData?: OrderedMap<string, unknown>): void;
    activeLanguageId: ITranslationLanguage;
    programmaticallyOpened: boolean;
}

interface IState {
    translatedFromLanguage: string;
}

export default class TranslationsBody extends React.Component<IProps, IState> {
    constructor(props: IProps) {
        super(props);

        this.state = {
            translatedFromLanguage: '',
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
                            text={this.props.programmaticallyOpened
                                ? this.state.translatedFromLanguage
                                : this.props.article.language}
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
                    <Text size="small">
                        {translation}
                    </Text>
                </Spacer>
                <ButtonGroup orientation="horizontal" align="center">
                    <IconButton
                        ariaValue={gettext('Copy')}
                        icon="copy"
                        onClick={() => {
                            navigator.clipboard.writeText(translation);
                        }}
                    />
                    {this.props.programmaticallyOpened === false && (
                        <Button
                            onClick={() => {
                                const currentDeskId = superdesk.entities.desk.getActiveDeskId();
                                const taskData = (() => {
                                    if (currentDeskId != null) {
                                        const currentDesk = superdesk.entities.desk.getDeskById(currentDeskId);

                                        return {
                                            user: article.task.user,
                                            desk: currentDesk._id,
                                            stage: currentDesk.working_stage,
                                        };
                                    }

                                    return {user: article.task.user};
                                })();

                                superdesk.entities.article.createNewWithData({
                                    body_html: translation,
                                    task: taskData,
                                    language: this.props.activeLanguageId,
                                }, article.profile);
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
                                            this.props.article.language,
                                        ),
                                    ));
                            } else {
                                superdesk.entities.article.patch(
                                    article,
                                    {body_html: translation},
                                    {patchDirectlyAndOverwriteAuthoringValues: true},
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
