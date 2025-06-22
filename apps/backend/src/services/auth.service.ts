import { User as UserType } from 'shared-types';

import { User } from '../models/user.model';

export const createUser = async (userData: UserType) => {
    return await User.create(userData);
};

export const findUserByFirebaseUid = async (firebaseUid: string) => {
    return await User.findOne({ firebaseUid });
};
