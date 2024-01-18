import React from 'react';
import {gettext} from 'core/utils';
import {connectServices} from 'core/helpers/ReactRenderAsync';
import {IDesk, IArticle} from 'superdesk-api';
import {getHighlightsLabel, IHighlight} from '../services/HighlightsService';
import {Modal} from 'superdesk-ui-framework/react/components/Modal';
import {Button, ButtonGroup} from 'superdesk-ui-framework/react';

interface IProps {
    closeModal(): void;
    highlightsService?: any;
}

interface IState {
    selectedHighlights: Array<string>;
    highlightsForDesk?: Array<IHighlight>;
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
                    highlightsForDesk: res._items,
                });
            });
        }
        markHighlights() {
            var promises = Promise.resolve();

            articles.forEach((article) => {
                this.state.selectedHighlights.forEach((highlightId) => {
                    if (article.highlights == null || article.highlights.includes(highlightId) === false) {
                        promises.then(() => this.props.highlightsService.markItem(highlightId, article));
                    }
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
                <div data-test-id="multiple-highlights-select">

                    <Modal
                        visible
                        zIndex={1050}
                        size="small"
                        position="top"
                        onHide={this.props.closeModal}
                        headerTemplate={gettext('Set highlights')}
                        footerTemplate={
                            (
                                <ButtonGroup align="end">
                                    <Button
                                        type="default"
                                        text={gettext('Cancel')}
                                        onClick={this.props.closeModal}
                                    />
                                    <Button
                                        type="primary"
                                        text={gettext('Confirm')}
                                        disabled={this.state.selectedHighlights.length < 1}
                                        onClick={this.markHighlights}
                                        data-test-id="confirm"
                                    />
                                </ButtonGroup>
                            )
                        }
                    >
                        {
                            this.state.highlightsForDesk.length < 1
                                ? <div>{gettext('No available highlights')}</div>
                                : (
                                    <select
                                        multiple
                                        value={this.state.selectedHighlights}
                                        onChange={this.handleChange}
                                        data-test-id="input-select-multiple"
                                    >
                                        {
                                            this.state.highlightsForDesk.map((highlight, i) => (
                                                <option
                                                    key={i}
                                                    value={highlight._id}
                                                >
                                                    {getHighlightsLabel(highlight)}
                                                </option>
                                            ))
                                        }
                                    </select>
                                )
                        }
                    </Modal>
                </div>
            );
        }
    }

    return connectServices(SetHighlightsForMultipleArticlesModalComponent, ['highlightsService']);
}
