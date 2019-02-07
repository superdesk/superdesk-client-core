import {gettext} from 'core/ui/components/utils';

ActivityMessageService.$inject = [];
export function ActivityMessageService() {
    return {
        format: (activity) => {
            if (activity && activity.name !== 'notify') {
                return gettext(activity.message, activity.data);
            }
            return '';
        },
    };
}
