import React from 'react';

declare module 'react' {
    /**
     * Patching `forwardRef` to work with generic components.
     */
    function forwardRef<T, P = {}>(
        render: (props: P, ref: React.Ref<T>) => React.ReactElement | null,
    ): (props: P & React.RefAttributes<T>) => React.ReactElement | null;
}
