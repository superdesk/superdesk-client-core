import React from 'react';
import {Button, ContentDivider, Heading, IconButton, Spacer} from 'superdesk-ui-framework/react';
import {superdesk} from '../superdesk';
import {IArticle, OrderedMap} from 'superdesk-api';
import HeadlinesBody from './headlines';

interface IProps {
    closeActiveSection: () => void;
    article: IArticle;
    error: boolean;
    loading: boolean;
    headlines: Array<string>;
    generateHeadlines: () => void;
    reGenerateHeadlines: () => void;
    fieldsData?: OrderedMap<string, unknown>;
    onFieldsDataChange?(fieldsData?: OrderedMap<string, unknown>): void;
}

export default function getHeadlinesWidget({
    closeActiveSection,
    article,
    error,
    loading,
    headlines,
    generateHeadlines,
    reGenerateHeadlines,
    fieldsData,
    onFieldsDataChange,
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
                generateHeadlines={generateHeadlines}
                headlines={headlines}
                loading={loading}
            />
        ),
        footer: (
            <Button
                onClick={reGenerateHeadlines}
                text={gettext('Regenerate')}
                style="hollow"
            />
        ),
    };
}
