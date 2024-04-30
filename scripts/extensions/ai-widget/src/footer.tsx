import React from 'react';
import {Button} from 'superdesk-ui-framework/react';
import {IAiAssistantSection} from './ai-assistant';
import {superdesk} from './superdesk';

interface IProps {
    activeSection: IAiAssistantSection;
    setLoadingHeadlines: () => void;
    setLoadingSummary: () => void;
}
export default function AiAssistantFooter({activeSection, setLoadingHeadlines, setLoadingSummary}: IProps) {
    const {gettext} = superdesk.localization;

    if (activeSection != null) {
        return (
            <Button
                onClick={() => {
                    if (activeSection === 'headlines') {
                        setLoadingHeadlines();
                    } else if (activeSection === 'summary') {
                        setLoadingSummary();
                    }
                }}
                text={gettext('Regenerate')}
                style="hollow"
            />
        );
    }

    return <></>;
}
