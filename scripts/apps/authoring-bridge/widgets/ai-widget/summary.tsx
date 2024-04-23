/* eslint-disable react/no-multi-comp */
import {sdApi} from 'api';
import {gettext} from 'core/utils';
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

interface IProps {
    article: IArticle;
    error: boolean;
    loading: boolean;
    summary: string;
    generateSummary: () => void;
}

export default class SummaryTab extends React.Component<IProps> {
    componentDidMount(): void {
        /**
         * Don't send another request if the widget
         * hasn't been closed and there's previous data available.
         */
        if (this.props.summary === '') {
            this.props.generateSummary();
        }
    }

    render(): ReactNode {
        const {error, loading, summary, article, generateSummary} = this.props;

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
                    <IconButton
                        ariaValue={gettext('Copy')}
                        icon="copy"
                        onClick={() => {
                            navigator.clipboard.writeText(summary);
                        }}
                    />
                    <Button
                        onClick={() => {
                            const currentDesk = sdApi.desks.getCurrentDesk();

                            sdApi.article.createNewWithData({
                                body_html: summary,
                                task: {
                                    user: this.props.article.task.user,
                                    desk: currentDesk._id,
                                    stage: currentDesk.working_stage,
                                },
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
