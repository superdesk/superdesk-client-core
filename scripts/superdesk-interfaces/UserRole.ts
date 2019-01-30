export interface IUserRole {
    _id: string;
    name: string;
    privileges: any;
    author_role: string;
    editor_role: string;
}

export interface IRolesService {
    getUserRole(userRoleId: IUserRole['_id']): Promise<IUserRole>;
}
