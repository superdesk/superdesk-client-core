/* eslint-disable max-depth */

import React from 'react';
import {
    SidePanelTools,
    SidePanel,
    SidePanelHeader,
    SidePanelHeading,
    SidePanelContent,
    SidePanelContentBlock,
} from 'core/components/SidePanel';
import {FormViewEdit} from 'core/ui/components/generic-form/from-group';
import {IFormGroup} from 'superdesk-api';
import {isHttpApiError} from 'core/helpers/network';
import {gettext} from 'core/utils';
import {getFormFieldsFlat} from '../generic-form/get-form-fields-flat';
import {showUnsavedChangesModal} from './show-unsaved-changes-modal';
import {hasValue} from '../generic-form/has-value';
import {get, set} from 'lodash';
import {produce} from 'immer';
import {Button} from 'superdesk-ui-framework/react';
import {GenericFormFieldType} from '../generic-form/interfaces/form';
import {notify} from 'core/notify/notify';

interface IProps<T extends object> {
    operation: 'editing' | 'creation';
    editMode: boolean;
    hiddenFields: Array<string>;
    getFormConfig(item?: Partial<T>): IFormGroup<T>;
    item: Partial<T>;
    onEditModeChange(nextValue: boolean): void;
    onClose: () => void;
    onCancel?: () => void;
    onSave: (nextItem) => Promise<any>;
    beforeClose?: (item: T) => Promise<boolean>;

    /**
     * label "save" doesn't work when data source is an array. The array
     * may be a part of a parent component that has it's own saving mechanism.
     */
     labelForSaveButton: string;
}

interface IIssues {
    [field: string]: Array<string>;
}

interface IState<T extends object> {
    nextItem: IProps<T>['item'];
    issues: IIssues;
}

function getInitialState<T extends object>(props: IProps<T>) {
    return {
        nextItem: props.item,
        issues: {},
    };
}

export class GenericListPageItemViewEdit<T extends object> extends React.Component<IProps<T>, IState<T>> {
    private _mounted: boolean;

    constructor(props) {
        super(props);

        this.state = getInitialState(props);
    }

    componentDidMount() {
        this._mounted = true;
    }

    componentWillUnmount() {
        this._mounted = false;
    }

    enableEditMode = () => {
        this.setState({
            nextItem: this.props.item,
        }, () => {
            this.props.onEditModeChange(true);
        });
    }

    handleFieldChange = (field: string, nextValue: valueof<IProps<T>['item']>) => {
        // using updater function to avoid race conditions
        this.setState((prevState) =>
            produce(prevState, (draft) => {
                set(draft.nextItem, field, nextValue);
            }),
        );
    }

    handleCancel = () => {
        const cancelFn = typeof this.props.onCancel === 'function'
            ? this.props.onCancel
            : () => {
                this.setState(getInitialState(this.props), () => {
                    this.props.onEditModeChange(false);
                });
            };

        const executeCancelFn = () => {
            if (this.props.beforeClose != null) {
                this.props.beforeClose(this.props.item as T).then((result) => {
                    if (result) {
                        cancelFn();
                    }
                }).catch(() => {
                    notify.error(gettext('Canceling failed'));
                });
            } else {
                cancelFn();
            }
        };

        if (this.isFormDirty() === false) {
            executeCancelFn();
        } else {
            showUnsavedChangesModal({
                onDiscard: executeCancelFn,
            });
        }
    }

    isFormDirty = () => {
        return JSON.stringify(this.props.item) !== JSON.stringify(this.state.nextItem);
    }

    handleSave = () => {
        const formConfig = this.props.getFormConfig(this.state.nextItem);
        const currentFields = getFormFieldsFlat(formConfig);

        // Filter out alert fields - they're only cosmetic
        const fieldsToSend = currentFields.filter((field) => field.type !== GenericFormFieldType.alert);

        const currentFieldsIds = [
            ...fieldsToSend.map(({field}) => field),
            '_id',
            ...this.props.hiddenFields,
        ];

        /*
            Form config is dynamic and can change during editing.
            For example users can select a dropdown value
            which would cause more fields specific to that option to appear or others to disappear.

            There might be data in the state for fields which no longer exist in form config.
            Only fields in form config at the time of saving will be sent.
        */
        const nextItemCleaned: Partial<T> = currentFieldsIds.reduce<Partial<T>>((acc, field) => {
            const value = get(this.state.nextItem, field);

            if (value != null) {
                set(acc, field, value);
            }

            return acc;
        }, {});

        const requiredValidationErrors = currentFields
            .filter(
                (fieldConfig) =>
                    fieldConfig.required === true
                    && hasValue(fieldConfig, get(nextItemCleaned, fieldConfig.field)) !== true,
            )
            .reduce<IIssues>((acc, fieldConfig) => {
                set(acc, fieldConfig.field, [gettext('Field is required')]);

                return acc;
            }, {});

        if (Object.keys(requiredValidationErrors).length > 0) {
            this.setState({
                issues: requiredValidationErrors,
            });

            return;
        }

        return this.props.onSave(nextItemCleaned).then(() => {
            if (this._mounted) {
                this.setState({
                    issues: {},
                }, () => {
                    this.props.onEditModeChange(false);
                });
            }
        })
            .catch((res) => {
                if (isHttpApiError(res)) {
                    let issues: IIssues = {};

                    for (let fieldName in res._issues) {
                        let issuesForField = [];

                        if (typeof res._issues[fieldName] === 'string') {
                            issuesForField.push(res._issues[fieldName]);
                        } else {
                            for (let key in res._issues[fieldName]) {
                                if (key === 'required') {
                                    issuesForField.push(
                                        gettext('Field is required'),
                                    );
                                } else if (key === 'unique') {
                                    issuesForField.push(
                                        gettext('Value must be unique'),
                                    );
                                } else {
                                    issuesForField.push(
                                        gettext('Uknown validation error'),
                                    );
                                }
                            }
                        }

                        issues[fieldName] = issuesForField;
                    }

                    this.setState({
                        issues: issues,
                    });
                } else if (res instanceof Error) {
                    throw res;
                } else {
                    throw new Error(res);
                }
            });
    }

    handleClose = () => {
        const {onClose, beforeClose, item} = this.props;

        if (beforeClose != null) {
            beforeClose(item as T)
                .then((result) => {
                    if (result) {
                        onClose();
                    }
                })
                .catch(() => {
                    notify.error(gettext('Closing failed'));
                });
        } else {
            onClose();
        }
    }

    render() {
        return (
            <SidePanel side="right" width={360} data-test-id="item-view-edit">
                <SidePanelHeader>
                    <SidePanelHeading>{gettext('Details')}</SidePanelHeading>
                    {
                        this.props.editMode
                            ? (
                                <div
                                    className="side-panel__sliding-toolbar side-panel__sliding-toolbar--right"
                                    data-test-id="toolbar"
                                >
                                    <Button
                                        text={gettext('Cancel')}
                                        type="secondary"
                                        onClick={this.handleCancel}
                                        data-test-id="item-view-edit--cancel-save"
                                    />
                                    <Button
                                        type="primary"
                                        disabled={!this.isFormDirty()}
                                        onClick={this.handleSave}
                                        data-test-id="item-view-edit--save"
                                        text={this.props.labelForSaveButton}
                                    />
                                </div>
                            )
                            : (
                                <SidePanelTools>
                                    <div>
                                        {
                                            this.props.operation === 'editing' ? (
                                                <button
                                                    className="icn-btn"
                                                    onClick={this.enableEditMode}
                                                    data-test-id="list-page-edit"
                                                >
                                                    <i className="icon-pencil" />
                                                </button>
                                            ) : null
                                        }
                                        <button
                                            className="icn-btn"
                                            onClick={this.handleClose}
                                            data-test-id="list-page-close"
                                        >
                                            <i className="icon-close-small" />
                                        </button>
                                    </div>
                                </SidePanelTools>
                            )
                    }
                </SidePanelHeader>
                <SidePanelContent>
                    <SidePanelContentBlock>
                        <FormViewEdit
                            item={this.state.nextItem}
                            formConfig={this.props.getFormConfig(this.state.nextItem)}
                            editMode={this.props.editMode}
                            issues={this.state.issues}
                            handleFieldChange={this.handleFieldChange}
                        />
                    </SidePanelContentBlock>
                </SidePanelContent>
            </SidePanel>
        );
    }
}
