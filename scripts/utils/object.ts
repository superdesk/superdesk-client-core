export const getObjectEntries = <T extends object>(
    o: T,
): Array<[keyof T, T[keyof T]]> => Object.entries(o) as Array<[keyof T, T[keyof T]]>;

export const getInvertObject = <
  T extends Record<string, string>,
  R extends { [K in keyof T as T[K]]: K }
>(
        o: T,
    ): R => Object.fromEntries(Object.entries(o).map(([k, v]) => [v, k])) as R;
