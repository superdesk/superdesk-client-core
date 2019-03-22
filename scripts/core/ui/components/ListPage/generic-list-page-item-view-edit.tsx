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
import {connectServices} from 'core/helpers/ReactRenderAsync';
import {IFormGroup} from 'core/ui/components/generic-form/interfaces/form';
import {FormViewEdit} from 'core/ui/components/generic-form/from-group';

interface IProps {
    operation: 'editing' | 'creation';
    editMode: boolean;
    formConfig: IFormGroup;
    item: {[key: string]: any};
    onEditModeChange(nextValue: boolean): void;
    onClose: () => void;
    onCancel?: () => void;
    onSave: (nextItem) => Promise<any>;

    // connected services
    modal?: any;
}

interface IState {
    nextItem: IProps['item'];
    issues: {[field: string]: Array<string>};
}

class GenericListPageItemViewEditComponent extends React.Component<IProps, IState> {
    _mounted: boolean;

    constructor(props) {
        super(props);

        this.state = {
            nextItem: this.props.item,
            issues: {},
        };

        this.enableEditMode = this.enableEditMode.bind(this);
        this.handleCancel = this.handleCancel.bind(this);
        this.handleFieldChange = this.handleFieldChange.bind(this);
        this.isFormDirty = this.isFormDirty.bind(this);
        this.handleSave = this.handleSave.bind(this);
    }
    componentWillReceiveProps(nextProps) {
        if (this.props.editMode === false) {
            // enable changing which item is previewed
            this.setState({
                nextItem: nextProps.item,
            });
        }
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
    handleFieldChange(field: keyof IProps['item'], nextValue: valueof<IProps['item']>) {
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
                this.setState({
                    nextItem: this.props.item,
                }, () => {
                    this.props.onEditModeChange(false);
                });
            };

        (
            this.isFormDirty() === false
                ? Promise.resolve()
                : this.props.modal.confirm(gettext('There are unsaved changes which will be discarded. Continue?'))
        ).then(cancelFn)
            .catch(() => {
            // do nothing
            });
    }
    isFormDirty() {
        return JSON.stringify(this.props.item) !== JSON.stringify(this.state.nextItem);
    }
    handleSave() {
        this.props.onSave(this.state.nextItem).then(() => {
            if (this._mounted === true) {
                this.props.onEditModeChange(false);
            }
        })
            .catch((res) => {
                let issues = {};

                for (let fieldName in res.data._issues) {
                    let issuesForField = [];

                    if (typeof res.data._issues[fieldName] === 'string') {
                        issuesForField.push(res.data._issues[fieldName]);
                    } else {
                        for (let key in res.data._issues[fieldName]) {
                            if (key === 'required') {
                                issuesForField.push(
                                    gettext('Field is required'),
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
            });
    }
    render() {
        return (
            <SidePanel side="right" width={360}>
                <SidePanelHeader>
                    <SidePanelHeading>{gettext('Details:')}</SidePanelHeading>
                    {
                        this.props.editMode
                            ? (
                                <div className="side-panel__sliding-toolbar side-panel__sliding-toolbar--right">
                                    <button className="btn" onClick={this.handleCancel}>
                                        {gettext('Cancel')}
                                    </button>
                                    <button
                                        disabled={!this.isFormDirty()}
                                        onClick={this.handleSave}
                                        className="btn btn--primary"
                                    >
                                        {gettext('Save')}
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
                            formConfig={this.props.formConfig}
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

export const GenericListPageItemViewEdit = connectServices<IProps>(
    GenericListPageItemViewEditComponent,
    ['modal'],
);
