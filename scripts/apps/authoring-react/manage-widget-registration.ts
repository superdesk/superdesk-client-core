import {registerInternalExtension} from 'core/helpers/register-internal-extension';
// import {getDemoWidget} from './widgets/demo-widget';
import {getFindAndReplaceWidget} from './widgets/find-and-replace';

const authoringReactWidgetsExtension = 'authoring-react-widgets';

export function registerAuthoringReactWidgets() {
    registerInternalExtension(authoringReactWidgetsExtension, {
        contributions: {
            authoringSideWidgets: [
                /**
                 * Uncomment to test it.
                 */
                // getDemoWidget(),

                getFindAndReplaceWidget(),
            ],
        },
    });
}

/**
 * It could also be unregistered while the app is running,
 * but not when authoring is open.
 */
// export function unregisterAuthoringReactWidgets() {
//     unregisterInternalExtension(authoringReactWidgetsExtension);
// }
