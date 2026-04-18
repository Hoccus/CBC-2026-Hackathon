import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';
import { ConvexProviderWithAuth, ConvexReactClient, useConvexAuth } from 'convex/react';
import React, { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { colors, radius, type as T } from './theme';
import { CONVEX_URL, SITE_URL } from './config';

type Provider = 'google' | 'microsoft';

type MobileAuthContextValue = {
  isLoading: boolean;
  isSignedIn: boolean;
  signIn: (provider: Provider) => Promise<void>;
  signOut: () => Promise<void>;
  token: string | null;
};

const TOKEN_KEY = 'nutricoach_convex_token';
const convex = new ConvexReactClient(CONVEX_URL);
const MobileAuthContext = createContext<MobileAuthContextValue | null>(null);

function MobileAuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function restore() {
      try {
        const stored = await AsyncStorage.getItem(TOKEN_KEY);
        if (!cancelled) {
          setToken(stored);
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    void restore();

    return () => {
      cancelled = true;
    };
  }, []);

  const signIn = useCallback(async (provider: Provider) => {
    const redirectUri = Linking.createURL('/auth/callback');
    const authUrl = `${SITE_URL}/mobile-auth?provider=${provider}&redirect_uri=${encodeURIComponent(redirectUri)}`;
    const result = await WebBrowser.openAuthSessionAsync(authUrl, redirectUri);

    if (result.type !== 'success' || !result.url) {
      return;
    }

    const { queryParams } = Linking.parse(result.url);
    const nextToken =
      queryParams && typeof queryParams.token === 'string' ? queryParams.token : null;

    if (!nextToken) {
      throw new Error('Mobile sign-in returned without a Convex token.');
    }

    await AsyncStorage.setItem(TOKEN_KEY, nextToken);
    setToken(nextToken);
  }, []);

  const signOut = useCallback(async () => {
    await AsyncStorage.removeItem(TOKEN_KEY);
    setToken(null);
  }, []);

  const value = useMemo<MobileAuthContextValue>(() => ({
    isLoading,
    isSignedIn: !!token,
    signIn,
    signOut,
    token,
  }), [isLoading, signIn, signOut, token]);

  return <MobileAuthContext.Provider value={value}>{children}</MobileAuthContext.Provider>;
}

export function useMobileAuth() {
  const value = useContext(MobileAuthContext);
  if (!value) {
    throw new Error('useMobileAuth must be used inside MobileAuthRoot.');
  }
  return value;
}

function useMobileConvexAuth() {
  const { isLoading, isSignedIn, token } = useMobileAuth();

  const fetchAccessToken = useCallback(async () => token, [token]);

  return {
    isLoading,
    isAuthenticated: isSignedIn,
    fetchAccessToken,
  };
}

function AuthScreen() {
  const { signIn } = useMobileAuth();
  const [submitting, setSubmitting] = useState<Provider | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSignIn(provider: Provider) {
    if (submitting) {
      return;
    }

    setSubmitting(provider);
    setError(null);

    try {
      await signIn(provider);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Authentication failed.');
    } finally {
      setSubmitting(null);
    }
  }

  return (
    <View style={styles.authPage}>
      <View style={styles.authCard}>
        <Text style={T.h1}>Sign In</Text>
        <Text style={[T.muted, { marginTop: 6, marginBottom: 18 }]}>
          Use your web account to sync Convex profile, meals, and coach history.
        </Text>
        <TouchableOpacity
          style={[styles.button, styles.primary]}
          onPress={() => void handleSignIn('google')}
          disabled={submitting !== null}
        >
          <Text style={styles.primaryText}>
            {submitting === 'google' ? 'Opening Google…' : 'Continue With Google'}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.button, styles.secondary]}
          onPress={() => void handleSignIn('microsoft')}
          disabled={submitting !== null}
        >
          <Text style={styles.secondaryText}>
            {submitting === 'microsoft' ? 'Opening Microsoft…' : 'Continue With Microsoft'}
          </Text>
        </TouchableOpacity>
        {error ? <Text style={styles.error}>{error}</Text> : null}
      </View>
    </View>
  );
}

function AuthShell({ children }: { children: ReactNode }) {
  const auth = useConvexAuth();

  if (auth.isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.text} />
        <Text style={[T.muted, { marginTop: 12 }]}>Restoring your session…</Text>
      </View>
    );
  }

  if (!auth.isAuthenticated) {
    return <AuthScreen />;
  }

  return <>{children}</>;
}

export function MobileAuthRoot({ children }: { children: ReactNode }) {
  return (
    <MobileAuthProvider>
      <ConvexProviderWithAuth client={convex} useAuth={useMobileConvexAuth}>
        <AuthShell>{children}</AuthShell>
      </ConvexProviderWithAuth>
    </MobileAuthProvider>
  );
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.bg,
    padding: 24,
  },
  authPage: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.bg,
    padding: 24,
  },
  authCard: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: colors.surface,
    borderRadius: radius,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 20,
    gap: 10,
  },
  button: {
    borderRadius: radius,
    paddingHorizontal: 16,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primary: {
    backgroundColor: colors.text,
  },
  primaryText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  secondary: {
    backgroundColor: colors.bg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  secondaryText: {
    color: colors.text,
    fontWeight: '600',
    fontSize: 14,
  },
  error: {
    color: colors.scoreLowFg,
    fontSize: 12,
    marginTop: 6,
  },
});
