import axios from 'axios'
import { jwtDecode } from 'jwt-decode'
import dayjs from 'dayjs';
import { Api } from '@/configs/api';
import { Constant } from '@/configs/constant';
import { useMemo, useCallback } from "react";
import { useAuth } from '@/contexts/AuthContext';
import { AuthTokens, UserProfile } from '@/types/user';
import { PageUrl } from '@/configs/page.url';

const useAxios = () => {
    const { authTokens, setUser, setAuthTokens } = useAuth();

    // Memoize setUser and setAuthTokens to prevent unnecessary re-renders
    const memoizedSetUser = useCallback((userProfile: UserProfile | null) => setUser(userProfile), [setUser]);
    const memoizedSetAuthTokens = useCallback((tokens: AuthTokens | null) => setAuthTokens(tokens), [setAuthTokens]);

    const AxiosInstance = useMemo(() => {
        const instance = axios.create({
            baseURL: Api.BASE_API,
            headers: {
                Authorization: `Bearer ${authTokens?.accessToken}`
            }
        });

        instance.interceptors.request.use(async req => {
            // Always set Authorization header, even if headers are overridden
            if (authTokens?.accessToken) {
                req.headers.Authorization = `Bearer ${authTokens.accessToken}`;
            }

            // Skip refresh logic if no token (avoid jwtDecode with invalid input)
            if (!authTokens?.accessToken) return req;

            let isExpired = true;
            try {
                const user = jwtDecode(authTokens.accessToken);
                isExpired = user.exp ? dayjs.unix(user.exp).diff(dayjs()) < 1 : true;
            } catch {
                return req;
            }
            if (!isExpired) return req;

            const response = await axios.post(Api.BASE_API + Api.Auth.REFRESH_TOKEN, {
                refreshToken: authTokens?.refreshToken
            }, {
                headers: {
                    Authorization: `Bearer ${authTokens?.refreshToken}`,
                }
            });

            memoizedSetAuthTokens(response.data);
            memoizedSetUser(jwtDecode(response.data.access_token));
            localStorage.setItem(Constant.AUTH_TOKEN_KEY, JSON.stringify(response.data));

            req.headers.Authorization = `Bearer ${response.data.access_token}`;
            return req;
        });

        // Add response interceptor: only redirect to login on 401 (Unauthorized).
        // 403 (Forbidden) = valid token but not allowed for this resource — do not redirect.
        instance.interceptors.response.use(
            response => response,
            error => {
                if (error.response?.status === 401) {
                    memoizedSetAuthTokens(null);
                    memoizedSetUser(null);
                    localStorage.removeItem(Constant.AUTH_TOKEN_KEY);
                    window.location.replace(PageUrl.LOGIN_PAGE);
                }
                return Promise.reject(error);
            }
        );

        return instance;
    }, [authTokens, memoizedSetAuthTokens, memoizedSetUser]);

    return AxiosInstance;
}

export default useAxios;
