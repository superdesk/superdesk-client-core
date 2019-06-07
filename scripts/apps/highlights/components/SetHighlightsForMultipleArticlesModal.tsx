import React from "react";
import {gettext} from 'core/utils';
import {ModalHeader} from "core/ui/components/Modal/ModalHeader";
import {ModalBody} from "core/ui/components/Modal/ModalBody";
import {ModalFooter} from "core/ui/components/Modal/ModalFooter";
import {Modal} from "core/ui/components/Modal/Modal";
import {connectServices} from "core/helpers/ReactRenderAsync";
import {IArticle, IDesk} from "superdesk-api";

interface IProps {
    closeModal(): void;
    highlightsService?: any;
}

interface IState {
    selectedHighlights: Array<string>;
    highlightsForDesk?: Array<any>;
}

export function getModalForMultipleHighlights(articles: Array<IArticle>, deskId: IDesk['_id']) {
    class SetHighlightsForMultipleArticlesModalComponent extends React.Component<IProps, IState> {
        constructor(props: IProps) {
            super(props);

            this.state = {
                selectedHighlights: [],
            };

            this.handleChange = this.handleChange.bind(this);
            this.markHighlights = this.markHighlights.bind(this);
        }
        componentDidMount() {
            this.props.highlightsService.get(deskId).then((res) => {
                this.setState({
                    highlightsForDesk: res._items.filter(
                        (item) => item.desks.length < 1, // Multi mark highlights should only show global highlights
                    ),
                });
            });
        }
        markHighlights() {
            var promises = Promise.resolve();

            articles.forEach((article) => {
                this.state.selectedHighlights.forEach((highlightId) => {
                    promises.then(() => this.props.highlightsService.markItem(highlightId, article));
                });
            });

            promises.then(() => {
                this.props.closeModal();
            });
        }
        handleChange(event: React.ChangeEvent<HTMLSelectElement>) {
            const selected = [];
            const {options} = event.target;

            for (const key in options) {
                const optionElement = options[key];

                if (optionElement.selected) {
                    selected.push(optionElement.value);
                }
            }

            this.setState({
                selectedHighlights: selected,
            });
        }
        render() {
            if (this.state.highlightsForDesk == null) {
                return null;
            }

            return (
                <Modal>
                    <ModalHeader onClose={this.props.closeModal}>{gettext('Set highlights')}</ModalHeader>
                    <ModalBody>
                        {
                            this.state.highlightsForDesk.length < 1
                                ? <div>{gettext('No available highlights')}</div>
                                : (
                                    <select multiple onChange={this.handleChange}>
                                        {
                                            this.state.highlightsForDesk.map((highlight, i) => (
                                                <option
                                                    key={i}
                                                    value={highlight._id}
                                                >
                                                    {highlight.name}
                                                </option>
                                            ))
                                        }
                                    </select>
                                )
                        }
                    </ModalBody>
                    <ModalFooter>
                        <button className="btn" onClick={this.props.closeModal}>{gettext('Cancel')}</button>
                        <button
                            className="btn btn--primary"
                            disabled={this.state.selectedHighlights.length < 1}
                            onClick={this.markHighlights}
                        >
                            {gettext('Confirm')}
                        </button>
                    </ModalFooter>
                </Modal>
            );
        }
    }

    return connectServices(SetHighlightsForMultipleArticlesModalComponent, ['highlightsService']);

}
