export type UserId = string;

interface UserRole {
    name: string;
    privileges: any;
}

export interface User {
    id: UserId;
    role: UserRole;
}
