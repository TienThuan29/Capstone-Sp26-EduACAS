import { useState, useEffect } from 'react';
import { UserProfile } from '@/types/user';
import { Constant } from '@/configs/constant';

export const validateUserRole = async (user: UserProfile | null) => {

    if (!user) {
        return {
            isAdmin: false,
            isLecturer: false,
            isStudent: false,
            hasRole: (_role: string) => false,
            getUserRole: () => null,
        }
    };

    const hasRole = async (role: string): Promise<boolean> => {
        try {
            return user.role === role;
        } 
        catch (error) {
            console.error('Error hashing role for comparison:', error);
            return false;
        }
    };

    return {
        isAdmin: await hasRole(Constant.ROLES.ADMIN),
        isLecturer: await hasRole(Constant.ROLES.LECTURER),
        isStudent: await hasRole(Constant.ROLES.STUDENT),
        hasRole: hasRole,
        getUserRole: () => user?.role,
    }
}

export const useRoleValidator = (user: UserProfile | null) => {
    const [roleValidator, setRoleValidator] = useState<{
        isAdmin: boolean,
        isLecturer: boolean,
        isStudent: boolean,
        hasRole: (role: string) => boolean | Promise<boolean>,
        getUserRole: () => string | null
    }>({} as {
        isAdmin: boolean,
        isLecturer: boolean,
        isStudent: boolean,
        hasRole: (role: string) => boolean | Promise<boolean>,
        getUserRole: () => string | null
    });

    useEffect(() => {
        const loadRoleValidator = async () => {
            const validator = await validateUserRole(user);
            setRoleValidator(validator);
        };
        
        loadRoleValidator();
    }, [user]);

    return roleValidator;
};