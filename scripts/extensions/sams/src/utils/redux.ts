// External Modules
import {AnyAction} from 'redux';

interface IBranch<S = any> {
    [leafName: string]: IBranchLeaf<S>;
}

interface IBranchLeaf<S = any, P = any> {
    id: string;
    action(payload?: P): AnyAction;
    reducer(state: S, payload: P): S;
}

interface IGenActionReducerArgs<S, P> {
    id: string;
    action?(payload?: P): any;
    reducer(state: S, payload: P): S;
}

export function genBranchLeaf<S, P = undefined>(leaf: IGenActionReducerArgs<S, P>): IBranchLeaf<S, P> {
    function actionCallback(payload?: P) {
        return {
            type: leaf.id,
            payload: leaf.action != null ?
                leaf.action(payload) :
                payload,
        };
    }

    return {
        id: leaf.id,
        action: actionCallback,
        reducer: leaf.reducer,
    };
}

export function getReducersFromBranchLeaf<S>(initialState: S, branch: IBranch<S>): (state: S, action: AnyAction) => S {
    const reducers: Dictionary<string, IBranchLeaf['reducer']> = {};

    Object.keys(branch).forEach(
        (leafName) => {
            const leaf = branch[leafName];

            reducers[leaf.id] = leaf.reducer;
        },
    );

    return (state: S = initialState, action: AnyAction) => {
        const reducer = reducers[action.type];

        return reducer != null ?
            reducer(state, action.payload) :
            state;
    };
}
