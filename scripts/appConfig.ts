import {ISuperdeskGlobalConfig, IExtensions, IUser} from 'superdesk-api';

export const appConfig: ISuperdeskGlobalConfig = window['appConfigLoaded'];

export const dashboardRoute = '/workspace';
export const IDENTITY_KEY = 'sess:user';
export const extensions: IExtensions = {};

export function getUserInterfaceLanguage() {
    const user: IUser | null = JSON.parse(localStorage.getItem(IDENTITY_KEY));
    const language = user?.language ?? appConfig.default_language ?? window.navigator.language ?? 'en';

    if (appConfig.profileLanguages?.includes(language)) {
        return language;
    } else {
        return 'en';
    }
}

export const debugInfo = {
    translationsLoaded: false,
};

export let authoringReactEnabledUserSelection = (JSON.parse(localStorage.getItem('auth-react') ?? 'false') as boolean);

export function toggleAuthoringReact(enabled: boolean) {
    localStorage.setItem('auth-react', JSON.stringify(enabled));

    authoringReactEnabledUserSelection = enabled;
    return authoringReactEnabledUserSelection;
}
/**
 * Authoring react has to be enabled in the broadcasting
 * module regardless of the user selection.
 * */
export let authoringReactViewEnabled = authoringReactEnabledUserSelection;
export const uiFrameworkAuthoringPanelTest = false;

export function setAuthoringReact(enabled: boolean) {
    authoringReactViewEnabled = enabled;
}
