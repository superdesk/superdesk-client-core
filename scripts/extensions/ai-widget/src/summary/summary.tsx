/* eslint-disable react/no-multi-comp */
import React from 'react';
import {ReactNode} from 'react';
import {IArticle} from 'superdesk-api';
import {
    IconButton,
    Container,
    ButtonGroup,
    Button,
    Text,
    Loader,
    Heading,
    Spacer,
} from 'superdesk-ui-framework/react';
import {superdesk} from '../superdesk';
import {configuration} from '../configuration';
import {OrderedMap} from 'immutable';
import {convertToRaw, ContentState} from 'draft-js';

interface IProps {
    article: IArticle;
    error: boolean;
    loading: boolean;
    summary: string;
    generateSummary: () => void;
    fieldsData?: OrderedMap<string, unknown>;
    onFieldsDataChange?(fieldsData?: OrderedMap<string, unknown>): void;
}

export default class SummaryBody extends React.Component<IProps> {
    componentDidMount(): void {
        if (this.props.summary == null || this.props.summary == '') {
            this.props.generateSummary();
        }
    }

    render(): ReactNode {
        const {error, loading, summary, article, generateSummary} = this.props;
        const {gettext} = superdesk.localization;

        if (error) {
            return (
                <Spacer v alignItems="center" gap="8" justifyContent="center" noWrap>
                    <Button
                        style="hollow"
                        onClick={generateSummary}
                        text={gettext('Regenerate')}
                    />
                    <Heading type="h6" align="center">
                        {gettext('There was an error when trying to generate a summary.')}
                    </Heading>
                </Spacer>
            );
        }

        if (loading) {
            return <Loader overlay />;
        }

        return (
            <Container gap="small" direction="column">
                <Text size="small" weight="medium">
                    {summary}
                </Text>
                <ButtonGroup orientation="horizontal" align="center">
                    <Button
                        size="small"
                        text={gettext('Apply')}
                        onClick={() => {
                            if (superdesk.instance.authoringReactViewEnabled) {
                                const rawState = convertToRaw(ContentState.createFromText(summary));

                                this.props.onFieldsDataChange?.(
                                    this.props.fieldsData?.set(
                                        'abstract',
                                        superdesk.helpers.editor3ToOperationalFormat(
                                            {rawContentState: rawState},
                                            article.language,
                                        ),
                                    ));
                            } else {
                                superdesk.ui.article.applyFieldChangesToEditor(
                                    article._id,
                                    {key: 'abstract', value: summary},
                                );
                            }

                            configuration.onAnswerApplied?.(article, 'summary', 0);
                        }}
                        type="default"
                        style="hollow"
                    />
                    <IconButton
                        ariaValue={gettext('Copy')}
                        icon="copy"
                        onClick={() => {
                            navigator.clipboard.writeText(summary);
                        }}
                    />
                    <Button
                        onClick={() => {
                            const currentDeskId = superdesk.entities.desk.getActiveDeskId();
                            const taskData: IArticle['task'] = (() => {
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
                                body_html: summary,
                                task: taskData,
                            }, article.profile);
                        }}
                        size="small"
                        text={gettext('Create article')}
                        style="hollow"
                    />
                </ButtonGroup>
            </Container>
        );
    }
}
