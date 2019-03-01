import React from "react";
import {IKnowledgeBaseItem} from "apps/knowledge-base/knowledge-base-page";
import {ICrudManager} from "core/helpers/CrudManager";
import {AnnotationSelectList} from "./AnnotationSelectList";
import {AnnotationSelectSingleItem} from "./AnnotationSelectSingleItem";
import {RawDraftContentState} from "draft-js";

interface IProps {
    annotationText: string;
    conceptItems: ICrudManager<IKnowledgeBaseItem>;
    annotationTypeSelect: JSX.Element;
    onCancel(): void;
    onApplyAnnotation(rawDraftContentState: RawDraftContentState): void;
}

interface IState {
    selected?: IKnowledgeBaseItem;
}

export class AnnotationsSelect extends React.Component<IProps, IState> {
    constructor(props) {
        super(props);

        this.state = {
            selected: null,
        };
    }
    render() {
        const backButton = (
            <div className="space-between" style={{marginTop: 15}}>
                <span />
                <button
                    onClick={this.props.onCancel}
                    className="btn"
                >
                    {gettext('Cancel')}
                </button>
            </div>
        );

        if (this.props.conceptItems._items == null) {
            return null; // loading
        }

        if (this.props.conceptItems._meta.total < 1) {
            return (
                <div>
                    <p style={{marginTop: 20}}>{gettext('No matches found in the library.')}</p>
                    {backButton}
                </div>
            );
        }

        if (this.state.selected != null) {
            return (
                <AnnotationSelectSingleItem
                    item={this.state.selected}
                    onBack={() => {
                        this.setState({selected: null});
                    }}
                    annotationTypeSelect={this.props.annotationTypeSelect}
                    onApplyAnnotation={this.props.onApplyAnnotation}
                />
            );
        } else {
            return (
                <AnnotationSelectList
                    items={this.props.conceptItems._items}
                    onSelect={(item) => {
                        this.setState({selected: item});
                    }}
                    backButton={backButton}
                    onCancel={this.props.onCancel}
                />
            );
        }
    }
}
