import * as React from 'react';

interface IProps {
    isDirty: boolean;
    onClose: () => void;
    onReset: () => void;
}

export class VideoEditorHeader extends React.Component<IProps> {
    handleSave = () => {};

    render() {
        return (
            <>
                {this.props.isDirty ? (
                    <div className="modal__sliding-toolbar">
                        <div className="sliding-toolbar__inner"></div>
                        <button className="btn btn--primary btn--ui-dark btn--hollow" onClick={this.props.onReset}>
                            Cancel
                        </button>
                        <button className="btn btn--primary btn--ui-dark sd-margin-l-2" onClick={this.handleSave}>
                            Save
                        </button>
                    </div>
                ) : (
                    <button className="btn btn--primary btn--ui-dark btn--hollow" onClick={this.props.onClose}>
                        Done
                    </button>
                )}
            </>
        );
    }
}
