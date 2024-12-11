export type RootStackParamList = {
  Login: undefined;
  Chat: {
    username: string;
  };
};

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
} 