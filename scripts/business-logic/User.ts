export interface IUserRole {
    name: string;
    privileges: any;
}

export interface IUser {
    id: string;
    role: IUserRole;
}
