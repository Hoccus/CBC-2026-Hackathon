import { v } from "convex/values";
import { action, query } from "./_generated/server";
import { authComponent } from "./auth_component";

const GOOGLE_CALENDAR_SCOPE = "https://www.googleapis.com/auth/calendar.readonly";
const MICROSOFT_CALENDAR_SCOPE = "Calendars.Read";

function hasScope(scopeString: string | null | undefined, requiredScope: string) {
  return (scopeString || "").split(" ").includes(requiredScope);
}

async function getAccounts(ctx: any, userId: string) {
  return await ctx.runQuery(authComponent.adapter.findMany, {
    model: "account",
    where: [{ field: "userId", value: userId }],
  });
}

function formatGoogleDate(value?: { dateTime?: string; date?: string }) {
  return value?.dateTime || value?.date || new Date().toISOString();
}

function formatMicrosoftDate(value?: { dateTime?: string }) {
  return value?.dateTime || new Date().toISOString();
}

export const getConnections = query({
  args: {},
  handler: async (ctx) => {
    const user = await authComponent.getAuthUser(ctx);
    const accounts = await getAccounts(ctx, user._id);

    const google = accounts.find(
      (account: any) =>
        account.providerId === "google" &&
        !!account.accessToken &&
        hasScope(account.scope, GOOGLE_CALENDAR_SCOPE),
    );
    const microsoft = accounts.find(
      (account: any) =>
        account.providerId === "microsoft" &&
        !!account.accessToken &&
        hasScope(account.scope, MICROSOFT_CALENDAR_SCOPE),
    );

    return {
      connections: [
        {
          provider: "google",
          state: google ? "connected" : "idle",
          title: "Google Calendar",
          account_email: google ? user.email : null,
        },
        {
          provider: "outlook",
          state: microsoft ? "connected" : "idle",
          title: "Outlook",
          account_email: microsoft ? user.email : null,
        },
      ],
    };
  },
});

export const getEvents = action({
  args: {
    days: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const user = await authComponent.getAuthUser(ctx);
    const accounts = await getAccounts(ctx, user._id);
    const days = Math.max(1, Math.min(args.days ?? 7, 14));
    const now = new Date();
    const end = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);

    const events: Array<{
      id: string;
      provider: "google" | "outlook";
      title: string;
      location?: string | null;
      starts_at: string;
      ends_at: string;
      timezone?: string | null;
      is_all_day: boolean;
    }> = [];

    const googleAccount = accounts.find(
      (account: any) =>
        account.providerId === "google" &&
        !!account.accessToken &&
        hasScope(account.scope, GOOGLE_CALENDAR_SCOPE),
    );

    if (googleAccount?.accessToken) {
      const response = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/primary/events?singleEvents=true&orderBy=startTime&timeMin=${encodeURIComponent(
          now.toISOString(),
        )}&timeMax=${encodeURIComponent(end.toISOString())}&maxResults=50`,
        {
          headers: {
            authorization: `Bearer ${googleAccount.accessToken}`,
          },
        },
      );

      if (response.ok) {
        const payload = (await response.json()) as {
          items?: Array<{
            id: string;
            summary?: string;
            location?: string;
            start?: { dateTime?: string; date?: string; timeZone?: string };
            end?: { dateTime?: string; date?: string; timeZone?: string };
          }>;
        };

        for (const item of payload.items ?? []) {
          events.push({
            id: `google:${item.id}`,
            provider: "google",
            title: item.summary || "Untitled event",
            location: item.location || null,
            starts_at: formatGoogleDate(item.start),
            ends_at: formatGoogleDate(item.end),
            timezone: item.start?.timeZone || item.end?.timeZone || null,
            is_all_day: !!item.start?.date && !item.start?.dateTime,
          });
        }
      }
    }

    const microsoftAccount = accounts.find(
      (account: any) =>
        account.providerId === "microsoft" &&
        !!account.accessToken &&
        hasScope(account.scope, MICROSOFT_CALENDAR_SCOPE),
    );

    if (microsoftAccount?.accessToken) {
      const response = await fetch(
        `https://graph.microsoft.com/v1.0/me/calendarView?startDateTime=${encodeURIComponent(
          now.toISOString(),
        )}&endDateTime=${encodeURIComponent(end.toISOString())}&$top=50&$orderby=start/dateTime`,
        {
          headers: {
            authorization: `Bearer ${microsoftAccount.accessToken}`,
          },
        },
      );

      if (response.ok) {
        const payload = (await response.json()) as {
          value?: Array<{
            id: string;
            subject?: string;
            location?: { displayName?: string };
            start?: { dateTime?: string; timeZone?: string };
            end?: { dateTime?: string; timeZone?: string };
            isAllDay?: boolean;
          }>;
        };

        for (const item of payload.value ?? []) {
          events.push({
            id: `outlook:${item.id}`,
            provider: "outlook",
            title: item.subject || "Untitled event",
            location: item.location?.displayName || null,
            starts_at: formatMicrosoftDate(item.start),
            ends_at: formatMicrosoftDate(item.end),
            timezone: item.start?.timeZone || item.end?.timeZone || null,
            is_all_day: !!item.isAllDay,
          });
        }
      }
    }

    return {
      events: events.sort((a, b) => a.starts_at.localeCompare(b.starts_at)),
    };
  },
});
