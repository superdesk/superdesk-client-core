import React from "react";
import {IKnowledgeBaseItem} from "apps/knowledge-base/knowledge-base-page";
import {connectCrudManager, ICrudManager} from "core/helpers/CrudManager";
import {AnnotationSelectList} from "./AnnotationSelectList";
import { AnnotationSelectSingleItem } from "./AnnotationSelectSingleItem";

interface IProps {
    annotationText: string;
    annotationTypes: Array<string>;
    onApplyAnnotation(contentPlainText: string): void;

    // connected
    conceptItems: ICrudManager<IKnowledgeBaseItem>;
}

interface IState {
    selected?: IKnowledgeBaseItem;
}

class AnnotationsSelectComponent extends React.Component<IProps, IState> {
    constructor(props) {
        super(props);

        this.state = {
            selected: null,
        };
    }
    componentDidMount() {
        this.props.conceptItems.read(1, null, {'name': this.props.annotationText});
    }
    render() {
        if (this.props.conceptItems._items == null) {
            return null; // loading
        }

        if (this.state.selected != null) {
            return (
                <AnnotationSelectSingleItem
                    item={this.state.selected}
                    onBack={() => {
                        this.setState({selected: null});
                    }}
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
                />
            );
        }
    }
}

export const AnnotationsSelect = connectCrudManager<IKnowledgeBaseItem>(
    AnnotationsSelectComponent,
    'conceptItems',
    'concept_items',
);
