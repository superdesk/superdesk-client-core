import * as React from 'react';
import VideoEditorContext from './VideoEditorContext';

interface IProps {
    isDirty: boolean;
    onClose: () => void;
    onReset: () => void;
    onSave: () => void;
}

export class VideoEditorHeader extends React.Component<IProps> {
    static contextType = VideoEditorContext;
    render() {
        const { gettext } = this.context.superdesk.localization;
        return (
            <>
                {this.props.isDirty ? (
                    <div className="modal__sliding-toolbar">
                        <div className="sliding-toolbar__inner"></div>
                        <button className="btn btn--primary btn--ui-dark btn--hollow" onClick={this.props.onReset}>
                            {gettext('Cancel')}
                        </button>
                        <button className="btn btn--primary btn--ui-dark sd-margin-l-2" onClick={this.props.onSave}>
                            {gettext('Save')}
                        </button>
                    </div>
                ) : (
                    <button className="btn btn--primary btn--ui-dark btn--hollow" onClick={this.props.onClose}>
                        {gettext('Done')}
                    </button>
                )}
            </>
        );
    }
}
