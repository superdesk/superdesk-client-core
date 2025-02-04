
export function getQueryMarkedForUser(userId: string): object {
    return {
        term: {
            marked_for_user: userId,
        },
    };
}

export function getQueryNotMarkedForAnyoneOrMarkedForMe(userId: string): object {
    return {
        bool: {
            should: [
                {
                    bool: {
                        must_not: {
                            exists: {
                                field: 'marked_for_user',
                            },
                        },
                    },
                },
                {...getQueryMarkedForUser(userId)},
            ],
        },
    };
}
