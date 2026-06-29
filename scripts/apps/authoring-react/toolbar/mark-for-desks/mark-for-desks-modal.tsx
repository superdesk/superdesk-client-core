import React from 'react';
import {gettext} from 'core/utils';
import {IArticle, IDesk} from 'superdesk-api';
import {Modal, TreeSelect} from 'superdesk-ui-framework/react';
import {sdApi} from 'api';
import {dispatchInternalEvent} from 'core/internal-events';
import {notify} from 'core/notify/notify';
import {resolveDesks, toggleMarkedDesk} from './helper';

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

    private markFor(deskId: string): IMarkedDesk {
        return {
            desk_id: deskId,
            user_marked: sdApi.user.getCurrentUserId(),
            date_marked: new Date().toISOString(),
        };
    }

    private handleSelectionChange(nextValue: Array<IDesk>): void {
        const articleId = this.props.article._id;
        const previousSelected = this.state.selectedDesks;
        const previousIds = previousSelected.map((m) => m.desk_id);
        const nextIds = nextValue.map((desk) => desk._id);

        // TreeSelect gives us the whole next value (its clear-all empties everything at once), so
        // toggle every added or removed desk, not just one.
        const changedIds = [
            ...nextIds.filter((id) => !previousIds.includes(id)),
            ...previousIds.filter((id) => !nextIds.includes(id)),
        ];

        if (changedIds.length === 0) {
            return;
        }

        const existingById = new Map(previousSelected.map((m) => [m.desk_id, m]));
        const nextSelected = nextValue.map((desk) => existingById.get(desk._id) ?? this.markFor(desk._id));

        this.setState({selectedDesks: nextSelected});

        Promise.allSettled(
            changedIds.map((deskId) => toggleMarkedDesk(deskId, articleId)),
        ).then((results) => {
            // Each toggle flips one desk. Apply only the ones that succeeded so the UI matches the server.
            const persistedIds = new Set(previousIds);

            changedIds.forEach((deskId, index) => {
                if (results[index].status === 'rejected') {
                    return;
                }

                if (persistedIds.has(deskId)) {
                    persistedIds.delete(deskId);
                    return;
                }

                persistedIds.add(deskId);
            });

            // Keep the user's order; put desks that stayed marked after a failed unmark at the end.
            const persistedOrder = [
                ...nextIds.filter((id) => persistedIds.has(id)),
                ...Array.from(persistedIds).filter((id) => !nextIds.includes(id)),
            ];
            const persisted = persistedOrder.map((id) => existingById.get(id) ?? this.markFor(id));

            // Patch state directly instead of reloading; a reload would race the index and read stale
            // data. marked_desks has no editor input, so there are no unsaved edits to lose.
            this.setState({selectedDesks: persisted});
            dispatchInternalEvent('dangerouslyOverwriteAuthoringData', {
                item: {
                    _id: articleId,
                    marked_desks: persisted,
                },
            });

            if (results.some((result) => result.status === 'rejected')) {
                notify.error(gettext('Some desks could not be updated.'));
            }
        });
    }

    render(): JSX.Element {
        const allDesks = sdApi.desks.getAllDesks();
        const treeSelectValue = resolveDesks(this.state.selectedDesks.map((m) => m.desk_id), allDesks);

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
