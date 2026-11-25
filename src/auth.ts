/**
 * @fileoverview Configuração central do NextAuth v5 (Auth.js) com provedores OAuth
 * Google (Drive/Sheets) e Microsoft Entra ID / Azure AD (OneDrive/Excel Online).
 *
 * @module auth
 * @description Armazena `accessToken`, `refreshToken`, `provider` e `expiresAt` no JWT
 * HTTP-only criptografado, expondo apenas `provider` e `expiresAt` na sessão client-side
 * para evitar vazamento de credenciais OAuth no navegador.
 */
import NextAuth from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import AzureADProvider from 'next-auth/providers/azure-ad';
import 'next-auth/jwt';

/** Extensão de tipos da sessão client-side do NextAuth */
declare module 'next-auth' {
  interface Session {
    accessToken?: string;
    refreshToken?: string;
    provider?: string;
    expiresAt?: number;
  }
}

/** Extensão de tipos do token JWT server-side do NextAuth */
declare module 'next-auth/jwt' {
  interface JWT {
    accessToken?: string;
    refreshToken?: string;
    provider?: string;
    expiresAt?: number;
  }
}

/**
 * Handlers e helpers de sessão/autenticação exportados pelo NextAuth v5.
 *
 * @description `trustHost: true` habilita execução atrás de proxies reversos (Vercel).
 * Os escopos OAuth solicitam acesso offline (`refreshToken`) e leitura/escrita em planilhas.
 */
export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          scope: 'https://www.googleapis.com/auth/spreadsheets https://www.googleapis.com/auth/drive.file openid email profile',
          access_type: 'offline',
          prompt: 'consent',
        },
      },
    }),
    AzureADProvider({
      clientId: process.env.AZURE_AD_CLIENT_ID!,
      clientSecret: process.env.AZURE_AD_CLIENT_SECRET!,
      authorization: {
        params: {
          scope: 'https://graph.microsoft.com/Files.ReadWrite User.Read openid email profile offline_access',
          tenant: process.env.AZURE_AD_TENANT_ID || 'common',
        },
      },
    }),
  ],
  callbacks: {
      async jwt({ token, account }) {
      if (account) {
        token.accessToken = account.access_token;
        token.refreshToken = account.refresh_token;
        token.provider = account.provider;
        token.expiresAt = account.expires_at ? account.expires_at * 1000 : Date.now() + 3600000;
      }
      return token;
    },
      async session({ session, token }) {
      session.provider = token.provider as string;
      session.expiresAt = token.expiresAt as number;
      return session;
    },
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
  secret: process.env.NEXTAUTH_SECRET,
});