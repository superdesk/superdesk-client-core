import {gettext} from 'core/utils';
import {IStage} from 'superdesk-api';
import {ICard} from 'apps/monitoring/services/CardsService';

// labelMap maps schema entry keys to their display names.
export const GET_LABEL_MAP = () => ({
    'package-story-labels': gettext('Package story labels'),
    abstract: gettext('Abstract'),
    alt_text: gettext('Alt text'),
    anpa_take_key: gettext('Take Key'),
    archive_description: gettext('Archive description'),
    attachments: gettext('Attachments'),
    authors: gettext('Authors'),
    body_footer: gettext('Body footer'),
    body_html: gettext('Body HTML'),
    byline: gettext('Byline'),
    categories: gettext('Categories'),
    company_codes: gettext('Company Codes'),
    copyrightholder: gettext('Copyright holder'),
    copyrightnotice: gettext('Copyright notice'),
    dateline: gettext('Dateline'),
    description_text: gettext('Description'),
    desk: gettext('Desk'),
    ednote: gettext('Ed. Note'),
    embargo: gettext('Embargo'),
    feature_image: gettext('Feature Image'),
    feature_media: gettext('Feature Media'),
    footer: gettext('Footer'),
    footers: gettext('Footers'),
    genre: gettext('Genre'),
    headline: gettext('Headline'),
    ingest_provider: gettext('Ingest Provider'),
    keywords: gettext('Keywords'),
    language: gettext('Language'),
    media: gettext('Media'),
    media_description: gettext('Media Description'),
    place: gettext('Place'),
    priority: gettext('Priority'),
    publish_schedule: gettext('Scheduled Time'),
    relatedItems: gettext('Related Items'),
    sign_off: gettext('Sign Off'),
    slugline: gettext('Slugline'),
    sms: gettext('SMS'),
    sms_message: gettext('SMS Message'),
    source: gettext('Source'),
    stage: gettext('Stage'),
    subject: gettext('Subject'),
    type: gettext('Type'),
    urgency: gettext('Urgency'),
    usageterms: gettext('Usage Terms'),
});

function getLabelForStageName(stageName: IStage['name']): string | null {
    switch (stageName.toLowerCase()) {
    case 'working stage':
        return gettext('Working Stage');
    case 'incoming stage':
        return gettext('Incoming Stage');
    default:
        return null;
    }
}

function getLabelForStageType(stageType: ICard['type']): string | null {
    switch (stageType) {
    case 'deskOutput':
        return gettext('Desk Output');
    case 'sentDeskOutput':
        return gettext('Sent Desk Output');
    case 'scheduledDeskOutput':
        return gettext('Scheduled Desk Output');
    default:
        return null;
    }
}

function isStage(x: any): x is IStage {
    return x.name != null;
}

function isCard(x: any): x is ICard {
    return x.type != null;
}

// will return the provided name if the label doesn't exist
export function getLabelForStage(stage: IStage | ICard): string {
    if (isStage(stage)) {
        return getLabelForStageName(stage.name) ?? stage.name;
    }

    if (isCard(stage)) {
        return getLabelForStageType(stage.type) ?? stage.type;
    }
}

export const EXTRA_SCHEMA_FIELDS = Object.freeze({
    feature_media: {},
    media_description: {},
});

export const EXTRA_EDITOR_FIELDS = Object.freeze({
    feature_media: {enabled: true},
    media_description: {enabled: true},
});


export const EDITOR_BLOCK_FIELD_TYPE = 'editor-block';

/**
 * Vocabulary types used for custom fields
 */
export const CUSTOM_FIELD_TYPES = [
    'text',
    'date',
    'media',
    'embed',
    'urls',
    EDITOR_BLOCK_FIELD_TYPE,
    'custom',
];
