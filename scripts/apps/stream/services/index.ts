import {gettext} from 'core/ui/components/utils';

ActivityMessageService.$inject = [];
export function ActivityMessageService() {
    return {
        format: (activity) => {
            let displayMessage;

            if (activity.name !== 'notify') {
                displayMessage = gettext(activity.message);
                for (var tag in activity.data) {
                    if (activity.data.hasOwnProperty(tag)) {
                        var tagRegex = new RegExp('{{\\s*' + tag + '\\s*}}', 'gi');

                        displayMessage =
                            displayMessage.replace(tagRegex, activity.data[tag]);
                    }
                }
            }
            return displayMessage;
        },
    };
}
