
import {ICreate, IEdit, IPreview} from '../rundown-templates/template-edit';
import {superdesk} from '../superdesk';

const {gettext} = superdesk.localization;

export function handleUnsavedRundownChanges(
    mode: ICreate | IEdit | IPreview | null,
    skipUnsavedChangesCheck: boolean,
    onSuccess: () => void,
) {
    if (skipUnsavedChangesCheck === true) {
        onSuccess();

        return;
    }

    if (mode == null) {
        onSuccess();
    } else if (mode.type === 'preview') {
        onSuccess();
    } else {
        superdesk.ui.confirm(gettext('There is an item open in editing mode. Discard changes?')).then((confirmed) => {
            if (confirmed) {
                onSuccess();
            }
        });
    }
}
