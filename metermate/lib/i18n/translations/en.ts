/**
 * English — the canonical dictionary. `hi.ts` and `mr.ts` are typed against
 * this file's keys, so a missing translation is a build error, not a silent
 * English fallback in production.
 */
export const en = {
  // ---------------------------------------------------------------- common
  "common.save": "Save",
  "common.saving": "Saving…",
  "common.edit": "Edit",
  "common.delete": "Delete",
  "common.cancel": "Cancel",
  "common.close": "Close",
  "common.add": "Add",
  "common.loading": "Loading…",
  "common.retry": "Try again",
  "common.somethingWrong": "Something went wrong. Please try again.",

  // ------------------------------------------------------------------- nav
  "nav.home": "Home",
  "nav.settings": "Settings",

  // ------------------------------------------------------------------ auth
  "auth.signIn": "Sign in",
  "auth.signInSubtitle": "Welcome back to MeterMate.",
  "auth.signingIn": "Signing in…",
  "auth.email": "Email",
  "auth.password": "Password",
  "auth.newHere": "New here?",
  "auth.createAccount": "Create an account",
  "auth.createAccountTitle": "Create your account",
  "auth.createAccountSubtitle": "Free, no card needed — just an email and password.",
  "auth.creatingAccount": "Creating account…",
  "auth.passwordHint": "At least 8 characters.",
  "auth.alreadyHaveAccount": "Already have an account?",
  "auth.badCredentials": "That email or password isn't right.",

  // ------------------------------------------------------------ onboarding
  "onboarding.step1Title": "Add your first property",
  "onboarding.step1Description": "A building or unit you bill for. You can add more later, from Settings.",
  "onboarding.step2Title": "Add its first meter",
  "onboarding.step2Description": "One per tenant, flat or shop front. The WhatsApp number is optional — add it now or later.",
  "onboarding.propertyName": "Property name",
  "onboarding.address": "Address",
  "onboarding.meterName": "Meter name",
  "onboarding.whatsappNumber": "Tenant's WhatsApp number",
  "onboarding.whatsappHint": "Used for the WhatsApp bill button.",
  "onboarding.continue": "Continue",
  "onboarding.finish": "Finish setup",
  "onboarding.skip": "Skip — add a meter later",

  // ------------------------------------------------------------------ home
  "home.title": "Home",
  "home.subtitle": "{{period}} — the latest cycle with readings.",
  "home.noReadingsSubtitle": "No readings recorded yet.",
  "home.mainBillLabel": "This month's total bill",
  "home.mainBillNotAdded": "Not added yet",
  "home.meterAmountsLabel": "Meter amounts",
  "home.ownerAmountLabel": "Owner amount",
  "home.ownerAmountAdd": "Add the bill in Settings",
  "home.ownerAmountRemaining": "Remaining after readings",
  "home.ownerAmountOver": "Collected above main bill",
  "home.recordTitle": "Record this month",
  "home.allRecordedTitle": "All meters recorded",
  "home.recordedCount": "{{recorded}} of {{total}} meters recorded for {{period}}",
  "home.lastMonth": "Last month",
  "home.thisMonth": "This month's reading",
  "home.units": "Units",
  "home.amount": "Amount",
  "home.sendBill": "Send bill",
  "home.viewHistory": "View history",
  "home.historyTitle": "Reading history",
  "home.historyDescription": "Filter by property, meter or month.",
  "home.allProperties": "All properties",
  "home.allMeters": "All meters",
  "home.noMetersTitle": "No meters yet",
  "home.noMetersDescription": "Add a property and a meter in Settings, then come back to record readings.",
  "home.welcomeTitle": "Welcome to MeterMate",
  "home.welcomeDescription": "Finish setup to start tracking usage.",

  // -------------------------------------------------------------- settings
  "settings.title": "Settings",
  "settings.subtitle": "Defaults for this device. Your readings and meters are stored on the server.",
  "settings.mainBill": "Main bill",
  "settings.mainBillDescription": "The total electricity bill for a month. Home shows this month's amount and subtracts every recorded meter to work out the owner's share.",
  "settings.billingMonth": "Billing month",
  "settings.totalAmount": "Total amount",
  "settings.language": "Language",
  "settings.languageDescription": "Changes every screen. Numbers stay in the usual format.",
  "settings.appearance": "Appearance",
  "settings.appearanceDescription": "Follow your system setting, or pick light or dark for this device.",
  "settings.defaultRate": "Default rate per unit",
  "settings.defaultRateDescription": "Used when a meter has no rate history. Once a meter has been billed, its own last rate is suggested instead.",
  "settings.account": "Account",
  "settings.signOut": "Sign out",
  "settings.oneTimeSetup": "One-time setup",
  "settings.oneTimeSetupDescription": "Manage these only when a property or meter changes.",
  "settings.manageMeters": "Manage meters",
  "settings.manageProperties": "Manage properties",
  "settings.yourData": "Your data",
  "settings.yourDataDescription": "What MeterMate is currently tracking.",
  "settings.properties": "Properties",
  "settings.meters": "Meters",
  "settings.unitsThisCycle": "Units this cycle",

  // -------------------------------------------------------------- whatsapp
  "whatsapp.billMessage":
    "Hi, your {{period}} electricity bill for {{meterName}} is ₹{{amount}} ({{units}} units).",

  // ----------------------------------------------------------------- brand
  "brand.poweredBy": "Powered by Kantex Technologies",
  "brand.copyright": "© {{year}} Kantex Technologies. All rights reserved.",
} as const;

export type TranslationKey = keyof typeof en;
