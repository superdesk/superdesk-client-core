import React from 'react';
import {Set} from 'immutable';

export interface IMultiSelectOptions {
    selected: Set<string>;
    select(id: string): void;
    unselect(id: string): void;
    unselectAll(): void;
    toggle(id: string): void;
}

interface IProps {
    children: (options: IMultiSelectOptions) => JSX.Element;
}

interface Istate {
    selected: Set<string>;
}

export class MultiSelectHoc extends React.PureComponent<IProps, Istate> {
    constructor(props: IProps) {
        super(props);

        this.state = {
            selected: Set<string>(),
        };

        this.select = this.select.bind(this);
        this.unselect = this.unselect.bind(this);
        this.toggle = this.toggle.bind(this);
        this.unselectAll = this.unselectAll.bind(this);
    }
    select(id: string) {
        this.setState({selected: this.state.selected.add(id)});
    }
    unselect(id: string) {
        this.setState({selected: this.state.selected.remove(id)});
    }
    toggle(id: string) {
        if (this.state.selected.has(id)) {
            this.unselect(id);
        } else {
            this.select(id);
        }
    }
    unselectAll() {
        this.setState({selected: Set()});
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
