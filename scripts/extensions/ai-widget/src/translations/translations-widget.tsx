import React from 'react';
import {ContentDivider, Heading, IconButton, Spacer} from 'superdesk-ui-framework/react';
import {superdesk} from '../superdesk';
import {IArticle, OrderedMap} from 'superdesk-api';
import TranslationsBody from './translations-body';
import TranslationFooter from './translations-footer';
import {ITranslationLanguage} from '../ai-assistant';

interface IProps {
    closeActiveSection: () => void;
    article: IArticle;
    error: boolean;
    loading: boolean;
    translations: string;
    generateTranslations: () => void;
    fieldsData?: OrderedMap<string, unknown>;
    onFieldsDataChange?(fieldsData?: OrderedMap<string, unknown>): void;
    setActiveLanguage: (language: ITranslationLanguage) => void;
    activeLanguageId: ITranslationLanguage;
    programmaticallyOpened: boolean;
}

export default function getTranslationsWidget({
    closeActiveSection,
    article,
    error,
    loading,
    translations,
    generateTranslations,
    fieldsData,
    onFieldsDataChange,
    setActiveLanguage,
    activeLanguageId,
    programmaticallyOpened,
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
                            ariaValue={gettext('Close Translate')}
                        />
                        <Heading type="h4" align="center">
                            {gettext('Translate')}
                        </Heading>
                    </Spacer>
                </div>
                <ContentDivider type="solid" margin="none" />
            </>
        ),
        body: (
            <TranslationsBody
                programmaticallyOpened={programmaticallyOpened}
                activeLanguageId={activeLanguageId}
                article={article}
                error={error}
                generateTranslation={generateTranslations}
                loading={loading}
                translation={translations}
                fieldsData={fieldsData}
                onFieldsDataChange={onFieldsDataChange}
            />
        ),
        footer: (
            <TranslationFooter
                programmaticallyOpened={programmaticallyOpened}
                activeLanguageId={activeLanguageId}
                setActiveLanguage={setActiveLanguage}
                generateTranslations={generateTranslations}
            />
        ),
    };
}
