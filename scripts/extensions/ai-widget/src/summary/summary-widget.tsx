import React from 'react';
import {Button, ContentDivider, Heading, IconButton, Spacer} from 'superdesk-ui-framework/react';
import {superdesk} from '../superdesk';
import {IArticle} from 'superdesk-api';
import SummaryBody from './summary';

interface IProps {
    closeActiveSection: () => void;
    article: IArticle;
    error: boolean;
    loading: boolean;
    summary: string;
    generateSummary: () => void;
    regenerateSummary: () => void;
}

export default function getSummaryWidget({
    closeActiveSection,
    article,
    error,
    loading,
    regenerateSummary,
    summary,
    generateSummary,
}: IProps) {
    const {gettext} = superdesk.localization;

    return {
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
                            onClick={closeActiveSection}
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
                generateSummary={generateSummary}
                summary={summary}
                loading={loading}
            />
        ),
        footer: (
            <Button
                onClick={regenerateSummary}
                text={gettext('Regenerate')}
                style="hollow"
            />
        )
    }
}
