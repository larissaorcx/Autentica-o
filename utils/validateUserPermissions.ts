
type User = {
    permissions?: string[];
    roles?: string[];
}

type ValidateUserPermissionsParms = {
    user: User;
    permissions?: string[];
    roles?: string[];
}

export function ValidateUserPermissions({
    user,
    permissions, 
    roles
}:ValidateUserPermissionsParms) {

    if(permissions?.length > 0){
        const hasAllPermissions = permissions.every(permissions => {
            return user.permissions.includes(permissions)
        })

        if(!hasAllPermissions){
            return false;
        }
    }
    if(roles?.length > 0){
        const hasAllRoles = permissions.some(role => {
            return user.roles.includes(role)
        })
        
        if(!hasAllRoles){
            return false;
        }
    }

    return true;
}