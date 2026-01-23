
export type UserProfile = {
    id: string;
    roleNumber: string;
    email: string;
    fullname: string;
    avatarUrl: string;
    birthday: string | null;
    role: string;
    firstLogin: boolean;
    isEnable: boolean;
    lastLoginDate: string | null;
    createdDate: string;
    updatedDate: string;
}

export type AuthTokens = {
    accessToken: string;
    refreshToken: string;
};