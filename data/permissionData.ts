import { RolePermissions, PermissionLevel, UserRole, ModulePermissions } from '../types';
import { NAV_LINKS } from '../constants';

const allAccess: PermissionLevel = { view: true, create: true, edit: true, delete: true };
const readOnly: PermissionLevel = { view: true, create: false, edit: false, delete: false };
const noAccess: PermissionLevel = { view: false, create: false, edit: false, delete: false };
const createEditView: PermissionLevel = { view: true, create: true, edit: true, delete: false };

const modules = NAV_LINKS.map(link => link.href.replace('#/', '').replace('/', '') || 'dashboard');

const getInitialPermissionsForRole = (role: UserRole): ModulePermissions => {
    const permissions: ModulePermissions = {};
    modules.forEach(moduleKey => {
        switch (role) {
            case 'Admin':
                permissions[moduleKey] = { ...allAccess };
                break;
            case 'Farm Manager':
                 if (moduleKey === 'admin') permissions[moduleKey] = { ...noAccess };
                 else if (moduleKey === 'accounting') permissions[moduleKey] = { ...readOnly };
                 else permissions[moduleKey] = { ...allAccess };
                break;
            case 'Accountant':
                 if (['accounting', 'reports'].includes(moduleKey)) permissions[moduleKey] = { ...allAccess };
                 else if (['dashboard', 'sales'].includes(moduleKey)) permissions[moduleKey] = { ...readOnly };
                 else permissions[moduleKey] = { ...noAccess };
                break;
            case 'Sales':
                 if (moduleKey === 'sales') permissions[moduleKey] = { ...allAccess };
                 else if (['dashboard', 'reports'].includes(moduleKey)) permissions[moduleKey] = { ...readOnly };
                 else permissions[moduleKey] = { ...noAccess };
                break;
            case 'Worker':
                 if (moduleKey === 'production') permissions[moduleKey] = { ...createEditView };
                 else permissions[moduleKey] = { ...noAccess };
                 permissions['dashboard'] = { ...readOnly };
                break;
            default:
                permissions[moduleKey] = { ...noAccess };
        }
    });
    return permissions;
}

export const initialPermissions: RolePermissions = {
    'Admin': getInitialPermissionsForRole('Admin'),
    'Farm Manager': getInitialPermissionsForRole('Farm Manager'),
    'Accountant': getInitialPermissionsForRole('Accountant'),
    'Sales': getInitialPermissionsForRole('Sales'),
    'Worker': getInitialPermissionsForRole('Worker'),
};
