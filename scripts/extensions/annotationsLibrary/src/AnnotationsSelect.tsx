import * as React from 'react';
import {AnnotationSelectList} from './AnnotationSelectList';
import {AnnotationSelectSingleItem} from './AnnotationSelectSingleItem';
import {ISuperdesk, ICrudManager} from 'superdesk-api';
import {IKnowledgeBaseItem} from './interfaces';

interface IProps {
    annotationText: string;
    conceptItems: ICrudManager<IKnowledgeBaseItem>;
    annotationTypeSelect: JSX.Element;
    onCancel(): void;
    onApplyAnnotation(html: string): void;
    superdesk: ISuperdesk;
}

interface IState {
    selected: IKnowledgeBaseItem | null;
}

export class AnnotationsSelect extends React.Component<IProps, IState> {
    constructor(props: IProps) {
        super(props);

        this.state = {
            selected: null,
        };
    }
    render() {
        const {gettext} = this.props.superdesk.localization;

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
                    superdesk={this.props.superdesk}
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
                    superdesk={this.props.superdesk}
                />
            );
        }
    }
}
