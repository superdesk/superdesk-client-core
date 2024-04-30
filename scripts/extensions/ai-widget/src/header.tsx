import React from 'react';
import HeadlinesTab from './headlines';
import SummaryTab from './summary';
import {IArticle, IArticleSideWidgetComponentType} from 'superdesk-api';
import {IAiAssistantSection} from './ai-assistant';
import DefaultAiAssistantPanel from './main-panel';

interface IProps {
    activeSection: IAiAssistantSection;
    setSection: (id: IAiAssistantSection) => void;
    article: IArticle;
    error: boolean;
    fieldsData: IArticleSideWidgetComponentType['fieldsData'];
    onFieldsDataChange: IArticleSideWidgetComponentType['onFieldsDataChange'];
    generateHeadlines: () => void;
    generateSummary: () => void;
    headlines: Array<string>;
    summary: string;
    loadingHeadlines: boolean;
    loadingSummary: boolean;
}

export default function AiAssistantHeader({
    activeSection,
    setSection,
    article,
    error,
    fieldsData,
    onFieldsDataChange,
    generateHeadlines,
    generateSummary,
    headlines,
    summary,
    loadingHeadlines,
    loadingSummary,
}: IProps) {
    if (activeSection == null) {
        return (
            <DefaultAiAssistantPanel
                setSection={setSection}
            />
        );
    } else if (activeSection === 'headlines') {
        return (
            <HeadlinesTab
                article={article}
                error={error}
                fieldsData={fieldsData}
                onFieldsDataChange={onFieldsDataChange}
                generateHeadlines={generateHeadlines}
                headlines={headlines}
                loading={loadingHeadlines}
            />
        );
    }

    return (
        <SummaryTab
            article={article}
            generateSummary={generateSummary}
            summary={summary}
            loading={loadingSummary}
            error={error}
        />
    );
}
