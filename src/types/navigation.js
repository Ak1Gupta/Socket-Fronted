export const RootStackParamList = {
  PhoneAuth: undefined,
  OTPVerification: { phoneNumber: string },
  Signup: { phoneNumber: string },
  GroupList: undefined,
  CreateGroup: { username: string },
  Chat: { groupId: number, groupName: string, username: string }
}; 