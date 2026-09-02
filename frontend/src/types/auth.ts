export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResult {
    userId: string;
    accessToken: string;
    refreshToken: string;
    userName: string;
    email: string;
    roles: string[];
}

export interface RefreshTokenResult {
  accessToken: string;
  refreshToken: string;
}

export interface CurrentUser {
    userId: string;
    userName: string;
    email: string;
    roles: string[];
}