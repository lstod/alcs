import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import jwtDecode, { JwtPayload } from 'jwt-decode';
import { BehaviorSubject, firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';

const JWT_TOKEN_KEY = 'jwt_token';
const REFRESH_TOKEN_KEY = 'refresh_token';

export interface ICurrentUser {
  name: string;
  email: string;
}

@Injectable({
  providedIn: 'root',
})
export class AuthenticationService {
  private token: string | undefined;
  private refreshToken: string | undefined;
  private expires: number | undefined;
  private refreshExpires: number | undefined;

  isInitialized = false;
  $currentUser = new BehaviorSubject<ICurrentUser | undefined>(undefined);
  currentUser: ICurrentUser | undefined;

  constructor(private http: HttpClient, private router: Router) {}

  async setTokens(token: string, refreshToken: string) {
    this.token = token;
    this.refreshToken = refreshToken;
    localStorage.setItem(JWT_TOKEN_KEY, token);
    localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);

    const decodedToken = jwtDecode<JwtPayload>(token);
    const decodedRefreshToken = jwtDecode<JwtPayload>(refreshToken);

    //Convert to MS for JS consistency
    this.refreshExpires = decodedRefreshToken.exp! * 1000;
    this.expires = decodedToken.exp! * 1000;
    this.currentUser = decodedToken as ICurrentUser;
    this.$currentUser.next(this.currentUser);
  }

  clearTokens() {
    this.token = undefined;
    this.refreshToken = undefined;
    localStorage.removeItem(JWT_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
  }

  async getLoginUrl() {
    return firstValueFrom(this.http.get<{ loginUrl: string }>(`${environment.apiUrl}/authorize/login`));
  }

  async getToken() {
    if (!this.isInitialized) {
      this.isInitialized = true;
      await this.loadTokenFromStorage();
    }

    if (this.token && this.refreshToken && this.expires && this.expires < Date.now()) {
      //Clear token to prevent infinite loop from interceptor
      this.token = undefined;
      await this.refreshTokens();
    }
    return this.token;
  }

  async refreshTokens() {
    if (this.refreshToken) {
      if (this.refreshExpires && this.refreshExpires < Date.now()) {
        await this.router.navigateByUrl('/login');
        return;
      }

      const newTokens = await this.getNewTokens(this.refreshToken);
      await this.setTokens(newTokens.token, newTokens.refresh_token);
    }
  }

  private async loadTokenFromStorage() {
    const existingToken = localStorage.getItem(JWT_TOKEN_KEY);
    const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);

    if (existingToken && refreshToken) {
      const valid = await this.isTokenValid(existingToken);
      if (valid) {
        await this.setTokens(existingToken, refreshToken);
      }
    }
  }

  async logout() {
    const logoutUrl = await this.getLogoutUrl();
    if (logoutUrl) {
      this.clearTokens();
      window.location.href = logoutUrl.url;
    }
  }

  private async isTokenValid(token: string) {
    try {
      await firstValueFrom(
        this.http.get(`${environment.apiUrl}/token`, {
          responseType: 'text',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })
      );
      return true;
    } catch (e) {
      if (e instanceof HttpErrorResponse && e.status === 401) {
        //Take user to login page
        return false;
      }
      throw e;
    }
  }

  private async getNewTokens(refreshToken: string) {
    const res = await firstValueFrom(
      this.http.get<{
        refresh_token: string;
        token: string;
      }>(`${environment.apiUrl}/authorize/refresh?r=${refreshToken}`)
    );
    return res;
  }

  private async getLogoutUrl() {
    return firstValueFrom(this.http.get<{ url: string }>(`${environment.apiUrl}/logout`));
  }

  getCurrentUser = () => this.currentUser;
}