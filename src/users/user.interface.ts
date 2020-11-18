interface User {
  id: string;
  fullName: string;
  email: string;
  password: string;
  twoFactorAuthenticationCode: string;
  isTwoFactorAuthenticationEnabled: boolean;
}

export default User;
