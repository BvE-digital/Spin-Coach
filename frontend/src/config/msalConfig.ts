import { PublicClientApplication, type Configuration, LogLevel } from '@azure/msal-browser'

const msalConfig: Configuration = {
  auth: {
    clientId: import.meta.env.VITE_AZURE_CLIENT_ID as string,
    authority: `https://login.microsoftonline.com/${import.meta.env.VITE_AZURE_TENANT_ID as string}`,
    redirectUri: import.meta.env.VITE_AZURE_REDIRECT_URI as string,
    postLogoutRedirectUri: '/',
    // Prevents the service worker from caching the redirect target URL
    navigateToLoginRequestUrl: false,
  },
  cache: {
    // sessionStorage: tokens not accessible from SW context, avoids stale SW reads
    cacheLocation: 'sessionStorage',
    storeAuthStateInCookie: false,
  },
  system: {
    loggerOptions: {
      loggerCallback: (level, message, containsPii) => {
        if (containsPii) return
        if (level === LogLevel.Error) console.error('[MSAL]', message)
        if (level === LogLevel.Warning) console.warn('[MSAL]', message)
      },
    },
    // iframes are blocked in standalone PWA display mode on iOS
    allowNativeBroker: false,
  },
}

// CRITICAL: call msalInstance.initialize() before ReactDOM.createRoot()
// so handleRedirectPromise() can consume the auth code before React renders
export const msalInstance = new PublicClientApplication(msalConfig)

export const loginRequest = {
  scopes: ['openid', 'profile', 'email', 'offline_access'],
}

export const d365Scopes = {
  scopes: [import.meta.env.VITE_D365_SCOPE as string],
}
