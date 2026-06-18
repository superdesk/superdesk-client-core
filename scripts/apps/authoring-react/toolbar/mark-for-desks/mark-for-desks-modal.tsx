import React from 'react';
import {gettext} from 'core/utils';
import {IArticle, IDesk} from 'superdesk-api';
import {Modal, TreeSelect} from 'superdesk-ui-framework/react';
import {sdApi} from 'api';
import {dispatchInternalEvent} from 'core/internal-events';
import {toggleMarkedDesk} from './helper';

type IMarkedDesk = NonNullable<IArticle['marked_desks']>[number];

interface IProps {
    article: IArticle;
    closeModal(): void;
}

interface IState {
    selectedDesks: Array<IMarkedDesk>;
}

export class MarkForDesksModal extends React.PureComponent<IProps, IState> {
    constructor(props: IProps) {
        super(props);

        this.state = {
            selectedDesks: this.props.article.marked_desks ?? [],
        };

        this.handleSelectionChange = this.handleSelectionChange.bind(this);
    }

    private handleSelectionChange(nextValue: Array<IDesk>): void {
        const articleId = this.props.article._id;
        const previousIds = this.state.selectedDesks.map((m) => m.desk_id);
        const nextIds = nextValue.map((desk) => desk._id);
        const isAdding = nextIds.length > previousIds.length;
        const delta = isAdding
            ? nextIds.find((id) => !previousIds.includes(id))
            : previousIds.find((id) => !nextIds.includes(id));

        if (delta == null) {
            return;
        }

        const nextSelected: Array<IMarkedDesk> = isAdding
            ? [
                ...this.state.selectedDesks,
                {
                    desk_id: delta,
                    user_marked: sdApi.user.getCurrentUserId(),
                    date_marked: new Date().toISOString(),
                },
            ]
            : this.state.selectedDesks.filter((m) => m.desk_id !== delta);

        // Optimistic local state: chip appears/disappears immediately, regardless of POST latency.
        this.setState({selectedDesks: nextSelected});

        toggleMarkedDesk(delta, articleId).then(() => {
            // Safe to overwrite locally: marked_desks is a side-channel field with no editor input, so
            // there are no unsaved user edits to clobber, and the patch matches what the server already
            // persisted via the toggle above. A full reload here would race with the archive index refresh
            // and return stale data.
            dispatchInternalEvent('dangerouslyOverwriteAuthoringData', {
                item: {
                    _id: articleId,
                    marked_desks: nextSelected,
                },
            });
        });
    }

    render(): JSX.Element {
        const allDesks = sdApi.desks.getAllDesks();
        const treeSelectValue = this.state.selectedDesks.map((m) => allDesks.get(m.desk_id));

        return (
            <Modal
                visible
                onHide={this.props.closeModal}
                size="medium"
                headerTemplate={gettext('Marked for desks')}
            >
                <div data-test-id="modal-mark-for-desks">
                    <TreeSelect
                        kind="synchronous"
                        allowMultiple
                        label={gettext('Select desks')}
                        value={treeSelectValue}
                        onChange={this.handleSelectionChange}
                        getId={(desk) => desk.name}
                        getLabel={(desk) => desk.name}
                        getOptions={() => allDesks.toArray().map((item) => ({value: item}))}
                        data-test-id="desks-select"
                    />
                </div>
            </Modal>
        );
    }
}
