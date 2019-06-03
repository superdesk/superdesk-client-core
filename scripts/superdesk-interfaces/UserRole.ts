import {IUserRole} from "superdesk-api";

export interface IRolesService {
    getUserRole(userRoleId: IUserRole['_id']): Promise<IUserRole>;
}
