import React from 'react';
import {Button, ContentDivider, Heading, IconButton, Spacer} from 'superdesk-ui-framework/react';
import {superdesk} from '../superdesk';
import SummaryBody from './summary';
import {ICommonProps, IStateSummaryTab} from '../ai-assistant';
import {configuration} from '../configuration';

export default class SummaryWidget extends React.Component<ICommonProps<IStateSummaryTab>> {
    private abortController: AbortController;

    constructor(props: ICommonProps<IStateSummaryTab>) {
        super(props);

        this.abortController = new AbortController();
        this.generateSummary = this.generateSummary.bind(this);
    }

    generateSummary() {
        configuration.generateSummary?.(this.props.article, this.abortController.signal)
            .then((res) => {
                this.props.setTabState({
                    activeSection: 'summary',
                    error: false,
                    loading: false,
                    summary: res,
                });
            }).catch(() => {
                this.props.setTabState({
                    activeSection: 'summary',
                    error: true,
                    loading: false,
                    summary: '',
                });
            });
    }

    componentWillUnmount(): void {
        this.abortController.abort();
    }

    render() {
        const {gettext} = superdesk.localization;
        const {
            article,
            children,
            state: {error, loading, summary},
            setTabState,
        } = this.props;

        return children({
            header: (
                <>
                    <div className="p-1">
                        <Spacer
                            h
                            gap="64"
                            noGrow
                            justifyContent="start"
                            alignItems="center"
                        >
                            <IconButton
                                size="small"
                                icon="arrow-left"
                                onClick={() => {
                                    this.props.setSection(null);
                                }}
                                ariaValue={gettext('Close Summary')}
                            />
                            <Heading type="h4" align="center">
                                {gettext('Summary')}
                            </Heading>
                        </Spacer>
                    </div>
                    <ContentDivider type="solid" margin="none" />
                </>
            ),
            body: (
                <SummaryBody
                    article={article}
                    error={error}
                    generateSummary={() => {
                        setTabState({
                            ...this.props.state,
                            loading: true,
                            error: false,
                        }, () => this.generateSummary());
                    }}
                    summary={summary}
                    loading={loading}
                />
            ),
            footer: (
                <Button
                    onClick={() => {
                        setTabState({
                            ...this.props.state,
                            loading: true,
                            error: false,
                        }, () => this.generateSummary());
                    }}
                    text={gettext('Regenerate')}
                    style="hollow"
                />
            ),
        });
    }
}
