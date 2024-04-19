import {sdApi} from 'api';
import {httpRequestJsonLocal} from 'core/helpers/network';
import {getArticleLabel} from 'core/utils';
import React from 'react';
import {ReactNode} from 'react';
import {IArticle} from 'superdesk-api';
import {
    Spacer,
    IconButton,
    ContentDivider,
    Container,
    ButtonGroup,
    Button,
    Text,
} from 'superdesk-ui-framework/react';

interface IProps {
    onClose: () => void;
    article: IArticle;
}

interface IState {
    loading: boolean;
    headlines: Array<string>;
    error: boolean;
}

export default class HeadlinesTab extends React.Component<IProps, IState> {
    constructor(props: IProps) {
        super(props);

        this.state = {
            loading: true,
            headlines: [],
            error: false,
        }

        this.generateHeadlines = this.generateHeadlines.bind(this);
    }

    generateHeadlines(): void {
        httpRequestJsonLocal<{response: Array<string>}>({
            method: "POST",
            // FIXME: Add config options for each action, for a custom URL
            // Think about an extension solution where data is fetched on client repo
            // in a custom manner, parsed into a standard format expected here,
            // and used.
            path: "/belga/ai/toolkit/headlines",
            payload: {
                text: getArticleLabel(this.props.article),
                nrTitles: 3,
                maxCharacters: 200,
            }
        }).then((res) => {
            this.setState({
                loading: false,
                headlines: res.response,
            })
        }).catch(() => {
            this.setState({
                error: true,
            })
        })
    }

    componentDidMount(): void {
        this.generateHeadlines();
    }

    render(): ReactNode {
        if (this.state.error) {
            return (
                <div
                    onClick={() => {
                        this.generateHeadlines();
                    }}
                >
                    there was an error when trying to generate headlines, click here to try again
                </div>
            )
        }
        if (this.state.loading) {
            return <div>loading data</div>
        }

        return (
            <Spacer v gap="0" noWrap noGrow>
                {
                    this.state.headlines.map((headline, i) => (
                        <React.Fragment key={i}>
                            <Container gap="small" direction="column">
                                <Text size="small" weight="medium">
                                    {headline}
                                </Text>
                                <ButtonGroup>
                                    <Button
                                        size="small"
                                        text="Apply"
                                        onClick={() => {
                                            sdApi.article.patch(
                                                this.props.article,
                                                {
                                                    headline,
                                                },
                                                {patchDirectlyAndOverwriteAuthoringValues: true},
                                            );
                                        }}
                                        type="default"
                                        style="hollow"
                                    />
                                    <IconButton
                                        ariaValue="Copy"
                                        icon="copy"
                                        onClick={() => {
                                            navigator.clipboard.writeText(headline);
                                        }}
                                    />
                                </ButtonGroup>
                            </Container>

                            <ContentDivider type="dashed" margin="small" />
                        </React.Fragment>
                    ))
                }
            </Spacer>
        );
    }
}
