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
import ng from 'core/services/ng';
import {getFormFieldsFlat} from '../generic-form/get-form-fields-flat';
import {hasValue} from '../generic-form/has-value';

interface IProps<T> {
    operation: 'editing' | 'creation';
    editMode: boolean;
    hiddenFields: Array<string>;
    getFormConfig(item?: Partial<T>): IFormGroup;
    item: Partial<T>;
    onEditModeChange(nextValue: boolean): void;
    onClose: () => void;
    onCancel?: () => void;
    onSave: (nextItem) => Promise<any>;

    /**
     * label "save" doesn't work when data source is an array. The array
     * may be a part of a parent component that has it's own saving mechanism.
     */
    labelForSaveButton: string;
}

interface IIssues {
    [field: string]: Array<string>;
}

interface IState<T> {
    nextItem: IProps<T>['item'];
    issues: IIssues;
}

function getInitialState<T>(props: IProps<T>) {
    return {
        nextItem: props.item,
        issues: {},
    };
}

export class GenericListPageItemViewEdit<T> extends React.Component<IProps<T>, IState<T>> {
    private _mounted: boolean;
    private modal: any;

    constructor(props) {
        super(props);

        this.modal = ng.get('modal');

        this.state = getInitialState(props);

        this.enableEditMode = this.enableEditMode.bind(this);
        this.handleCancel = this.handleCancel.bind(this);
        this.handleFieldChange = this.handleFieldChange.bind(this);
        this.isFormDirty = this.isFormDirty.bind(this);
        this.handleSave = this.handleSave.bind(this);

        this.modal = ng.get('modal');
    }
    componentDidMount() {
        this._mounted = true;
    }
    componentWillUnmount() {
        this._mounted = false;
    }
    enableEditMode() {
        this.setState({
            nextItem: this.props.item,
        }, () => {
            this.props.onEditModeChange(true);
        });
    }
    handleFieldChange(field: string, nextValue: valueof<IProps<T>['item']>) {
        // using updater function to avoid race conditions
        this.setState((prevState) => ({
            ...prevState,
            nextItem: {
                ...prevState.nextItem,
                [field]: nextValue,
            },
        }));
    }
    handleCancel() {
        const cancelFn = typeof this.props.onCancel === 'function'
            ? this.props.onCancel
            : () => {
                this.setState(getInitialState(this.props), () => {
                    this.props.onEditModeChange(false);
                });
            };

        (
            this.isFormDirty() === false
                ? Promise.resolve()
                : this.modal.confirm(gettext('There are unsaved changes which will be discarded. Continue?'))
        ).then(cancelFn)
            .catch(() => {
            // do nothing
            });
    }
    isFormDirty() {
        return JSON.stringify(this.props.item) !== JSON.stringify(this.state.nextItem);
    }
    handleSave() {
        const formConfig = this.props.getFormConfig(this.state.nextItem);
        const currentFields = getFormFieldsFlat(formConfig);
        const currentFieldsIds = currentFields.map(({field}) => field).concat('_id').concat(this.props.hiddenFields);

        /*
            Form config is dynamic and can change during editing.
            For example users can select a dropdown value
            which would cause more fields specific to that option to appear or others to disappear.

            There might be data in the state for fields which no longer exist in form config.
            Only fields in form config at the time of saving will be sent.
        */
        const nextItemCleaned: Partial<T> = currentFieldsIds.reduce<Partial<T>>((acc, field) => {
            const value = this.state.nextItem[field];

            if (value != null) {
                acc[field] = value;
            }

            return acc;
        }, {});

        const requiredValidationErrors = currentFields
            .filter(
                (fieldConfig) =>
                    fieldConfig.required === true && hasValue(fieldConfig, nextItemCleaned[fieldConfig.field]) !== true,
            )
            .reduce<IIssues>((acc, fieldConfig) => {
                acc[fieldConfig.field] = [gettext('Field is required')];

                return acc;
            }, {});

        if (Object.keys(requiredValidationErrors).length > 0) {
            this.setState({
                issues: requiredValidationErrors,
            });

            return;
        }

        this.props.onSave(nextItemCleaned).then(() => {
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

    render() {
        return (
            <SidePanel side="right" width={360} data-test-id="item-view-edit">
                <SidePanelHeader>
                    <SidePanelHeading>{gettext('Details')}</SidePanelHeading>
                    {
                        this.props.editMode
                            ? (
                                <div className="side-panel__sliding-toolbar side-panel__sliding-toolbar--right">
                                    <button
                                        className="btn"
                                        onClick={this.handleCancel}
                                        data-test-id="item-view-edit--cancel-save"
                                    >
                                        {gettext('Cancel')}
                                    </button>
                                    <button
                                        disabled={!this.isFormDirty()}
                                        onClick={this.handleSave}
                                        className="btn btn--primary"
                                        data-test-id="item-view-edit--save"
                                    >
                                        {this.props.labelForSaveButton}
                                    </button>
                                </div>
                            )
                            : (
                                <SidePanelTools>
                                    <div>
                                        {
                                            this.props.operation === 'editing' ? (
                                                <button onClick={this.enableEditMode} className="icn-btn">
                                                    <i className="icon-pencil" />
                                                </button>
                                            ) : null
                                        }
                                        <button className="icn-btn" onClick={this.props.onClose}>
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
