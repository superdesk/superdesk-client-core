export interface IUserRole {
    name: string;
    privileges: any;
}

export interface IUser {
    _id: string;
    role: IUserRole;
}
