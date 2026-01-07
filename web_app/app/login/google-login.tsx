import React from "react";
import { config } from "@/configs/config";

declare global {
  interface Window {
    google?: {
      accounts: {
        oauth2: {
          initTokenClient: (config: {
            client_id: string;
            callback: (response: { access_token: string }) => void;
            scope: string;
          }) => {
            requestAccessToken: () => void;
          };
        };
        id: {
          initialize: (config: {
            client_id: string;
            callback: (response: { credential: string }) => void;
            auto_select?: boolean;
            cancel_on_tap_outside?: boolean;
          }) => void;
          prompt: (notificationCallback?: (notification: {
            isNotDisplayed: () => boolean;
            isSkippedMoment: () => boolean;
            getDismissedReason: () => string;
            getMomentType: () => string;
          }) => void) => void;
          renderButton: (
            element: HTMLElement,
            config: {
              type?: string;
              theme?: string;
              size?: string;
              text?: string;
              shape?: string;
              logo_alignment?: string;
              width?: string;
              locale?: string;
            }
          ) => void;
        };
      };
    };
  }
}

export const handleGoogleLogin = async (
  setIsGoogleLoading: React.Dispatch<React.SetStateAction<boolean>>,
  googleInitialized: React.MutableRefObject<boolean>,
  googleButtonRef: React.RefObject<HTMLDivElement | null>,
  handleGoogleCredentialResponse: (response: { credential: string }) => Promise<void>
) => {
  if (!config.GOOGLE_CLIENT_ID) {
    return;
  }
  setIsGoogleLoading(true);

  try {
    if (!window.google) {
      // console.log("Waiting for Google Identity Services to load");
      await new Promise((resolve) => {
        const checkGoogle = setInterval(() => {
          if (window.google) {
            clearInterval(checkGoogle);
            resolve(true);
          }
        }, 100);
        setTimeout(() => {
          clearInterval(checkGoogle);
          resolve(false);
        }, 5000);
      });
    }

    if (!window.google) {
      setIsGoogleLoading(false);
      return;
    }

    if (!googleInitialized.current) {
      try {
        window.google.accounts.id.initialize({
          client_id: config.GOOGLE_CLIENT_ID,
          callback: handleGoogleCredentialResponse,
          auto_select: false,
          cancel_on_tap_outside: true,
        });
        googleInitialized.current = true;
        console.log("Google Identity Services initialized");
      } catch (error) {
        console.error("Error initializing Google Identity Services:", error);
        alert("Error initializing Google login. Please check your Google Client ID configuration.");
        setIsGoogleLoading(false);
        return;
      }
    }

    if (googleButtonRef.current && window.google && window.google.accounts.id.renderButton) {
      console.log("Rendering Google sign-in button...");
      
      if (googleButtonRef.current.firstChild) {
        googleButtonRef.current.innerHTML = '';
      }
      
      try {
        window.google.accounts.id.renderButton(googleButtonRef.current, {
          type: "standard",
          theme: "outline",
          size: "large",
          text: "signin_with",
          width: "100%",
          logo_alignment: "left",
        });
        
        setTimeout(() => {
          const button = googleButtonRef.current?.querySelector('div[role="button"]') as HTMLElement;
          if (button) {
            console.log("Google button rendered, triggering click...");
            button.click();
          } else {
            console.warn("Google button not found after rendering, trying prompt() as fallback...");
            // Fallback to prompt if button rendering failed
            if (window.google && window.google.accounts.id.prompt) {
              window.google.accounts.id.prompt();
            } else {
              setIsGoogleLoading(false);
            }
          }
        }, 300);
      } catch (error) {
        console.error("Error rendering Google button:", error);
        if (window.google && window.google.accounts.id.prompt) {
          window.google.accounts.id.prompt();
        } else {
          setIsGoogleLoading(false);
        }
      }
    } else {
      // Fallback to prompt if button ref not available
      if (window.google && window.google.accounts.id.prompt) {
        console.log("Using prompt() as fallback...");
        window.google.accounts.id.prompt();
      } else {
        console.error("Google prompt method not available");
        setIsGoogleLoading(false);
      }
    }
  } catch (error) {
    console.error("Error initiating Google login:", error);
    alert("An error occurred while trying to sign in with Google. Please try again.");
    setIsGoogleLoading(false);
  }
};
