import React from "react";
import {
    SidePanelTools,
    SidePanel,
    SidePanelHeader,
    SidePanelHeading,
    SidePanelContent,
    SidePanelContentBlock,
} from "core/components/SidePanel";
import {FormGroup as FormViewEdit} from "./from-group";
import {IFormGroup} from "./interfaces/form";
import { connectServices } from "core/helpers/ReactRenderAsync";

interface IProps {
    formConfig: IFormGroup;
    item: {[key: string]: any};
    onClose: () => void;
    updateItem: (nextItem) => Promise<void>;

    // connected services
    modal?: any;
}

interface IState {
    editMode: boolean;
    nextItem: IProps['item'];
}

class KnowledgeItemViewEditComponent extends React.Component<IProps, IState> {
    constructor(props) {
        super(props);

        this.state = {
            editMode: false,
            nextItem: this.props.item,
        };

        this.setEditMode = this.setEditMode.bind(this);
        this.handleFieldChange = this.handleFieldChange.bind(this);
        this.isFormDirty = this.isFormDirty.bind(this);
    }
    componentWillReceiveProps(nextProps) {
        this.setState({
            nextItem: nextProps.item,
        });
    }
    setEditMode(nextValue: boolean) {
        if (nextValue) {
            this.setState({editMode: nextValue});
        } else {
            const exitEditMode = () => {
                this.setState({
                    editMode: nextValue,
                    nextItem: this.props.item,
                });
            };
            if (this.isFormDirty()) {
                this.props.modal.confirm(gettext('There are unsaved changed which will be discarded. Continue?'))
                    .then(exitEditMode)
                    .catch((err) => {
                        // do nothing
                    });
            } else {
                exitEditMode();
            }
        }
    }
    handleFieldChange(field: keyof IProps['item'], nextValue: valueof<IProps['item']>) {
        this.setState({
            ...this.state,
            nextItem: {
                ...this.state.nextItem,
                [field]: nextValue,
            },
        });
    }
    isFormDirty() {
        return JSON.stringify(this.props.item) !== JSON.stringify(this.state.nextItem);
    }
    render() {
        const {editMode: editing} = this.state;

        return (
            <SidePanel side='right' width={360}>
                <SidePanelHeader>
                    <SidePanelHeading>{gettext('Details:')}</SidePanelHeading>
                    {
                        editing
                            ? (
                                <div className="side-panel__sliding-toolbar side-panel__sliding-toolbar--right">
                                    <button className="btn" onClick={() => this.setEditMode(false)}>Cancel</button>
                                    <button
                                        disabled={!this.isFormDirty()}
                                        onClick={() => {
                                            this.props.updateItem(this.state.nextItem).then(this.props.onClose);
                                        }}
                                        className="btn btn--primary"
                                    >
                                        Save
                                    </button>
                                </div>
                            )
                            : (
                                <SidePanelTools>
                                    <div>
                                        <button onClick={() => this.setEditMode(true)} className="icn-btn">
                                            <i className="icon-pencil"></i>
                                        </button>
                                        <button className="icn-btn" onClick={this.props.onClose}>
                                            <i className="icon-close-small"></i>
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
                            editMode={this.state.editMode}
                            handleFieldChange={this.handleFieldChange}
                        />
                    </SidePanelContentBlock>
                </SidePanelContent>
            </SidePanel>
        );
    }
}

export const KnowledgeItemViewEdit = connectServices<IProps>(
    KnowledgeItemViewEditComponent,
    ['modal'],
);
