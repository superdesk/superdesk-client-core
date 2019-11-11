import * as React from 'react';
import * as moment from 'moment';

import {
    ISuperdesk,
    IExtension,
    IExtensionActivationResult,
    IEditorComponentProps,
    IPreviewComponentProps,
} from 'superdesk-api';

class DateTimeField extends React.PureComponent<IEditorComponentProps> {
    render() {
        const selected = this.props.value != null;

        const date = this.props.value != null ? moment(this.props.value) : null;
        const day = date == null ? '' : date.toISOString().slice(0, 10);
        const hour = date == null ? '' : date.toISOString().slice(11, 16);

        const checkbox = (
            <input
                type="checkbox"
                checked={selected}
                onChange={(event) => {
                    if (event.target.value === 'on' && selected !== true) {
                        this.props.setValue(new Date().toISOString());
                    } else {
                        this.props.setValue(null);
                    }
                }}
            />
        );

        if (!selected) {
            return (
                <div>
                    {checkbox}
                </div>
            );
        } else {
            return (
                <div>
                    {checkbox}

                    <input
                        type="date"
                        value={day}
                        onChange={(event) => {
                            if (event.target.value === '') {
                                this.props.setValue(null);
                                return;
                            }

                            const value = event.target.value.split('-');
                            const nextDate = date ?? moment();

                            nextDate.set({
                                year: parseInt(value[0], 10),
                                month: parseInt(value[1], 10) - 1,
                                date: parseInt(value[2], 10),
                            });

                            this.props.setValue(nextDate.toISOString());
                        }}
                        style={{width: 130}}
                    />

                    @

                    <input
                        type="time"
                        value={hour}
                        onChange={(event) => {
                            if (event.target.value === '') {
                                return;
                            }

                            const value = event.target.value.split(':');
                            const nextDate = date ?? moment();

                            nextDate.set({
                                hour: parseInt(value[0], 10) + 1,
                                minute: parseInt(value[1], 10),
                            });
                            this.props.setValue(nextDate.toISOString());
                        }}
                        style={{width: 130}}
                    />

                    <button
                        disabled={date == null}
                        onClick={() => {
                            if (date != null) {
                                date.add('minutes', 10);
                                this.props.setValue(date.toISOString());
                            }
                        }}
                    >
                        + 10 min
                    </button>
                    <button
                        disabled={date == null}
                        onClick={() => {
                            if (date != null) {
                                date.add('minutes', 30);
                                this.props.setValue(date.toISOString());
                            }
                        }}
                    >
                        + 30 min
                    </button>
                    <button
                        disabled={date == null}
                        onClick={() => {
                            if (date != null) {
                                date.add('minutes', 60);
                                this.props.setValue(date.toISOString());
                            }
                        }}
                    >
                        + 1 hour
                    </button>

                </div>
            );
        }
    }
}

class DateTimePreview extends React.PureComponent<IPreviewComponentProps> {
    render() {
        return <div>{this.props.value}</div>;
    }
}

const extension: IExtension = {
    id: 'datetimeField',
    activate: (superdesk: ISuperdesk) => {
        const gettext = superdesk.localization.gettext;
        const result: IExtensionActivationResult = {
            contributions: {
                customFieldTypes: [
                    {
                        id: 'datetime',
                        label: gettext('Datetime'),
                        editorComponent: DateTimeField,
                        previewComponent: DateTimePreview,
                    },
                ],
            },
        };

        return Promise.resolve(result);
    },
};

export default extension;
