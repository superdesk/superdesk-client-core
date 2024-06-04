import React from 'react';
import {IllustrationButton, SvgIconIllustration} from 'superdesk-ui-framework/react';
import {configuration} from './configuration';
import {superdesk} from './superdesk';
import {IAiAssistantSection} from './ai-assistant';

interface IProps {
    setSection: (id: IAiAssistantSection) => void;
}

export default function DefaultAiAssistantPanel({setSection}: IProps) {
    const {gettext} = superdesk.localization;

    return (
        <div
            className="
                sd-grid-list
                sd-grid-list--xx-small
                sd-grid-list--gap-s
                sd-grid-list--no-margin
            "
        >
            {configuration.generateHeadlines != null && (
                <IllustrationButton
                    text={gettext('Headlines')}
                    onClick={() => {
                        setSection('headlines');
                    }}
                >
                    <SvgIconIllustration illustration="headlines" />
                </IllustrationButton>
            )}
            {configuration.generateSummary != null && (
                <IllustrationButton
                    text={gettext('Summary')}
                    onClick={() => {
                        setSection('summary');
                    }}
                >
                    <SvgIconIllustration illustration="summary" />
                </IllustrationButton>
            )}
            {configuration.generateTranslations != null && (
                <IllustrationButton
                    text={gettext('Translations')}
                    onClick={() => {
                        setSection('translations');
                    }}
                >
                    <SvgIconIllustration illustration="translate" />
                </IllustrationButton>
            )}
        </div>
    );
}
