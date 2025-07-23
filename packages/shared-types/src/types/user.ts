export enum UserRoles {
    Host = 'host',
    Guest = 'guest',
    Admin = 'admin',
};

export interface User {
    firebaseUid: string;
    email: string;
    name?: string;
    emailVerified: boolean;
    roles: UserRoles[];
    firstName?: string;
    lastName?: string;
    phoneNumber?: number;
    verified?: boolean;
};
