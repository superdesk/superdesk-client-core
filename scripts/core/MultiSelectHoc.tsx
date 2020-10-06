import React from 'react';
import {Map} from 'immutable';
import {IArticle} from 'superdesk-api';

export interface IMultiSelectOptions {
    selected: Map<string, IArticle>;
    select(item: IArticle): void;
    unselect(id: string): void;
    unselectAll(): void;
    toggle(item: IArticle): void;
}

interface IProps {
    children: (options: IMultiSelectOptions) => JSX.Element;
}

interface Istate {
    selected: Map<string, IArticle>;
}

export class MultiSelectHoc extends React.PureComponent<IProps, Istate> {
    constructor(props: IProps) {
        super(props);

        this.state = {
            selected: Map<string, IArticle>(),
        };

        this.select = this.select.bind(this);
        this.unselect = this.unselect.bind(this);
        this.toggle = this.toggle.bind(this);
        this.unselectAll = this.unselectAll.bind(this);
    }
    select(item: IArticle) {
        this.setState({selected: this.state.selected.set(item._id, item)});
    }
    unselect(id: string) {
        this.setState({selected: this.state.selected.remove(id)});
    }
    toggle(item: IArticle) {
        if (this.state.selected.has(item._id)) {
            this.unselect(item._id);
        } else {
            this.select(item);
        }
    }
    unselectAll() {
        this.setState({selected: Map<string, IArticle>()});
    }
    render() {
        return this.props.children({
            selected: this.state.selected,
            select: this.select,
            unselect: this.unselect,
            unselectAll: this.unselectAll,
            toggle: this.toggle,
        });
    }
}
