import React from 'react';
import {Button, ContentDivider, Heading, IconButton, Spacer} from 'superdesk-ui-framework/react';
import {superdesk} from '../superdesk';
import HeadlinesBody from './headlines';
import {configuration} from '../configuration';
import {ICommonProps, IStateHeadlinesTab} from '../ai-assistant';

export class HeadlinesWidget extends React.Component<ICommonProps<IStateHeadlinesTab>> {
    abortController: AbortController;

    constructor(props: ICommonProps<IStateHeadlinesTab>) {
        super(props);

        this.abortController = new AbortController();
        this.generateHeadlines = this.generateHeadlines.bind(this);
    }

    generateHeadlines() {
        configuration.generateHeadlines?.(
            this.props.article,
            this.abortController.signal,
        )
            .then((res) => {
                this.props.setTabState({
                    activeSection: 'headlines',
                    error: false,
                    loading: false,
                    headlines: res,
                });
            }).catch(() => {
                this.props.setTabState({
                    activeSection: 'headlines',
                    error: true,
                    loading: false,
                    headlines: [],
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
            state: {error, loading, headlines},
            fieldsData,
            onFieldsDataChange,
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
                                ariaValue={gettext('Close Headlines')}
                            />
                            <Heading type="h4" align="center">
                                {gettext('Headlines')}
                            </Heading>
                        </Spacer>
                    </div>
                    <ContentDivider type="solid" margin="none" />
                </>
            ),
            body: (
                <HeadlinesBody
                    article={article}
                    error={error}
                    fieldsData={fieldsData}
                    onFieldsDataChange={onFieldsDataChange}
                    generateHeadlines={this.generateHeadlines}
                    headlines={headlines}
                    loading={loading}
                />
            ),
            footer: (
                <Button
                    onClick={() => {
                        this.props.setTabState({
                            ...this.props.state,
                            loading: true,
                        }, () => this.generateHeadlines());
                    }}
                    text={gettext('Regenerate')}
                    style="hollow"
                />
            )
        })
    }
}
