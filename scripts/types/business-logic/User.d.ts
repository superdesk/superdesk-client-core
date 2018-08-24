export interface UserRole {
    name: string;
    privileges: any;
}

export interface User {
    id: string;
    role: UserRole;
}
