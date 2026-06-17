import { useState, useEffect } from "react"
import {
  Settings,
  Mail,
  Bell,
  Eye,
  ShieldAlert,
  Save,
  CheckCircle,
  AlertCircle,
  LogOut,
  UserCheck,
  ChevronDown,
  ChevronRight,
  Smartphone,
  BellRing,
} from "lucide-react"
import { Sidebar } from "../components/layout/Sidebar"
import { useAuth } from "../contexts/AuthContext"
import { Button } from "../components/ui/Button"
import { Avatar } from "../components/ui/Avatar"
import {
  useUpdatePassword,
  useUpdateEmail,
  useUpdatePreferences,
  useDeactivateAccount
} from "../services/auth"
import {
  useNotificationPreferences,
  useBulkUpdateNotificationPreferences,
  useVapidPublicKey,
  usePushSubscribe,
  usePushUnsubscribe,
  type NotificationPreference,
} from "../services/notifications"


type SettingsTab = "account" | "notifications" | "privacy"

export function SettingsPage() {
  const { user, logout } = useAuth()
  const [activeTab, setActiveTab] = useState<SettingsTab>("account")
  
  // Account settings states
  const [email, setEmail] = useState("")
  const [emailPassword, setEmailPassword] = useState("")
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")

  // Preferences states
  const [emailNotifications, setEmailNotifications] = useState(true)
  const [pushNotifications, setPushNotifications] = useState(false)
  const [isPushToggling, setIsPushToggling] = useState(false)
  const [weeklyDigest, setWeeklyDigest] = useState(true)
  const [profilePrivacy, setProfilePrivacy] = useState<"PUBLIC" | "CAMPUS_ONLY" | "PRIVATE">("PUBLIC")
  const [showReputation, setShowReputation] = useState(true)

  // Status indicators
  const [successMsg, setSuccessMsg] = useState<string | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [isDeactivateOpen, setIsDeactivateOpen] = useState(false)

  // Per-type notification preferences
  const { data: notifPrefs } = useNotificationPreferences()
  const bulkUpdatePrefsMutation = useBulkUpdateNotificationPreferences()
  const [perTypePrefs, setPerTypePrefs] = useState<NotificationPreference[]>([])
  const [expandedTypes, setExpandedTypes] = useState<Set<string>>(new Set())

  // Push subscription
  const { data: vapidKey } = useVapidPublicKey()
  const pushSubscribeMutation = usePushSubscribe()
  const pushUnsubscribeMutation = usePushUnsubscribe()
  const [pushPermission, setPushPermission] = useState<NotificationPermission | 'unsupported'>(
    typeof Notification === 'undefined' ? 'unsupported' : Notification.permission
  )

  function urlBase64ToUint8Array(base64String: string) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4)
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
    const rawData = window.atob(base64)
    return Uint8Array.from([...rawData].map((char) => char.charCodeAt(0)))
  }

  /** Get the active SW registration, or throw if none is available within 3 seconds. */
  async function getSwRegistration(): Promise<ServiceWorkerRegistration> {
    if (!('serviceWorker' in navigator)) {
      throw new Error('Service workers are not supported in this browser.')
    }
    // navigator.serviceWorker.ready never resolves if no SW is registered (e.g. dev mode).
    // Race it against a timeout so the UI doesn't hang indefinitely.
    const timeout = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('No active service worker found. Push notifications require the installed PWA.')), 3000),
    )
    return Promise.race([navigator.serviceWorker.ready, timeout])
  }

  useEffect(() => {
    async function checkActualSubscription() {
      if (pushPermission === 'granted') {
        try {
          const registration = await getSwRegistration()
          const sub = await registration.pushManager.getSubscription()
          setPushNotifications(!!sub)
        } catch {
          setPushNotifications(false)
        }
      } else {
        setPushNotifications(false)
      }
    }
    checkActualSubscription()
  }, [pushPermission])

  async function handlePushToggle() {
    if (isPushToggling) return
    setIsPushToggling(true)

    const wantSubscribe = !pushNotifications

    try {
      if (wantSubscribe) {
        if (pushPermission === 'unsupported') {
          showNotification('error', 'Push notifications are not supported in this browser.')
          return
        }

        let permission = pushPermission
        if (permission === 'default') {
          permission = await Notification.requestPermission()
          setPushPermission(permission)
        }

        if (permission === 'granted') {
          const registration = await getSwRegistration()
          if (!vapidKey?.publicKey) {
            showNotification('error', 'Could not fetch VAPID key.')
            return
          }

          // Clean up any stale browser subscription before creating a fresh one
          const existingSub = await registration.pushManager.getSubscription()
          if (existingSub) {
            await existingSub.unsubscribe()
          }

          const sub = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(vapidKey.publicKey),
          })

          const subJson = sub.toJSON()

          // Atomically: register subscription on server + update user preference flag
          await pushSubscribeMutation.mutateAsync({
            endpoint: subJson.endpoint!,
            p256dh: subJson.keys!.p256dh,
            auth: subJson.keys!.auth,
          })
          await updatePreferencesMutation.mutateAsync({ pushNotifications: true })

          setPushNotifications(true)
          showNotification('success', 'Push notifications enabled!')
        } else {
          showNotification('error', 'Push notification permission was denied. Update it in your browser settings.')
        }
      } else {
        // Unsubscribe: browser + server + user preference flag
        const registration = await getSwRegistration()
        const sub = await registration.pushManager.getSubscription()
        if (sub) {
          const endpoint = sub.endpoint
          await sub.unsubscribe()
          await pushUnsubscribeMutation.mutateAsync(endpoint)
        }
        await updatePreferencesMutation.mutateAsync({ pushNotifications: false })

        setPushNotifications(false)
        showNotification('success', 'Push notifications disabled.')
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : undefined
      showNotification('error', message ?? (wantSubscribe
        ? 'Failed to enable push notifications.'
        : 'Failed to disable push notifications. Please try again.')
      )
    } finally {
      setIsPushToggling(false)
    }

  }

  useEffect(() => {
    if (notifPrefs && notifPrefs.length > 0) {
      setPerTypePrefs(notifPrefs)
    }
  }, [notifPrefs])

  const ALL_TYPES: { type: NotificationPreference['type']; label: string; desc: string }[] = [
    { type: "LIKE", label: "Likes", desc: "When someone likes your post" },
    { type: "LIKE_COMMENT", label: "Comment Likes", desc: "When someone likes your comment" },
    { type: "COMMENT", label: "Comments", desc: "When someone comments on your post" },
    { type: "REPLY", label: "Replies", desc: "When someone replies to your comment" },
    { type: "REPOST", label: "Reposts", desc: "When someone reposts your post" },
    { type: "FOLLOW", label: "Follows", desc: "When someone follows you" },
    { type: "MENTION", label: "Mentions", desc: "When someone mentions you" },
    { type: "SYSTEM", label: "System", desc: "System announcements and updates" },
  ]

  function getPref(type: string) {
    return perTypePrefs.find((p) => p.type === type)
  }

  function togglePref(type: string, channel: 'inApp' | 'push') {
    setPerTypePrefs((prev) =>
      prev.map((p) => (p.type === type ? { ...p, [channel]: !p[channel] } : p)),
    )
  }

  function toggleTypeExpanded(type: string) {
    setExpandedTypes((prev) => {
      const next = new Set(prev)
      if (next.has(type)) next.delete(type)
      else next.add(type)
      return next
    })
  }

  // Mutation hooks
  const updatePasswordMutation = useUpdatePassword()
  const updateEmailMutation = useUpdateEmail()
  const updatePreferencesMutation = useUpdatePreferences()
  const deactivateMutation = useDeactivateAccount()

  // Initialize form fields when user object changes
  useEffect(() => {
    if (user) {
      setEmail(user.email || "")
      setEmailNotifications(user.emailNotifications ?? true)
      setWeeklyDigest(user.weeklyDigest ?? true)
      setProfilePrivacy(user.profilePrivacy || "PUBLIC")
      setShowReputation(user.showReputation ?? true)
    }
  }, [user])

  const showNotification = (type: "success" | "error", text: string) => {
    if (type === "success") {
      setSuccessMsg(text)
      setErrorMsg(null)
    } else {
      setErrorMsg(text)
      setSuccessMsg(null)
    }
    // Auto clear after 4 seconds
    setTimeout(() => {
      setSuccessMsg(null)
      setErrorMsg(null)
    }, 4000)
  }

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!currentPassword || !newPassword || !confirmPassword) {
      showNotification("error", "Please fill in all password fields.")
      return
    }
    if (newPassword.length < 6) {
      showNotification("error", "New password must be at least 6 characters.")
      return
    }
    if (newPassword !== confirmPassword) {
      showNotification("error", "Passwords do not match.")
      return
    }

    try {
      await updatePasswordMutation.mutateAsync({
        currentPassword,
        newPassword,
      })
      showNotification("success", "Password updated successfully!")
      setCurrentPassword("")
      setNewPassword("")
      setConfirmPassword("")
    } catch (err: any) {
      const msg = err.response?.data?.message || "Failed to update password."
      showNotification("error", msg)
    }
  }

  const handleUpdateEmail = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) {
      showNotification("error", "Please enter a valid email address.")
      return
    }
    if (!emailPassword) {
      showNotification("error", "Please enter your password to confirm email change.")
      return
    }

    try {
      await updateEmailMutation.mutateAsync({
        email,
        currentPassword: emailPassword,
      })
      showNotification("success", "Email address updated successfully!")
      setEmailPassword("")
    } catch (err: any) {
      const msg = err.response?.data?.message || "Failed to update email address."
      showNotification("error", msg)
    }
  }

  const handleSavePreferences = async () => {
    try {
      await updatePreferencesMutation.mutateAsync({
        emailNotifications,
        weeklyDigest,
        profilePrivacy,
        showReputation,
      })
      showNotification("success", "Settings and preferences saved successfully!")
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || "Failed to save preferences."
      showNotification("error", msg)
    }
  }

  const handleDeactivate = async () => {
    try {
      await deactivateMutation.mutateAsync()
      setIsDeactivateOpen(false)
      // Call authentication logout after database update
      logout()
    } catch (err: any) {
      const msg = err.response?.data?.message || "Failed to deactivate account."
      showNotification("error", msg)
    }
  }

  const privacyOptions = [
    {
      value: "PUBLIC",
      title: "Public Domain",
      desc: "Your research, credentials, and reputation score are completely public and accessible."
    },
    {
      value: "CAMPUS_ONLY",
      title: "Campus Access Only",
      desc: "Only registered and verified scholars belonging to your institution can view your activities."
    },
    {
      value: "PRIVATE",
      title: "Private Circle",
      desc: "Your profile details and posts are completely hidden, except to your selected colleagues."
    }
  ] as const;

  return (
    <div className="min-h-screen bg-surface pb-16 lg:pb-0 animate-scale-in">
      <div className="mx-auto max-w-7xl flex gap-6 px-4 lg:px-6 pt-4">
        <Sidebar />

        <main className="flex-1 max-w-[620px] min-w-0 space-y-4">
          {/* Header */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
              <Settings size={20} />
            </div>
            <div>
              <h1 className="font-geist font-bold text-headline-md text-on-surface leading-none">
                Settings
              </h1>
              <p className="text-body-sm text-on-surface-variant font-inter mt-1.5">
                Configure your account credentials, notifications, and privacy options.
              </p>
            </div>
          </div>

          {/* Success / Error alerts */}
          {successMsg && (
            <div className="flex items-center gap-2.5 p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 text-body-md font-geist font-medium transition-all animate-slide-up">
              <CheckCircle size={17} className="shrink-0" />
              {successMsg}
            </div>
          )}

          {errorMsg && (
            <div className="flex items-center gap-2.5 p-3.5 rounded-xl bg-error/15 border border-error/20 text-error text-body-md font-geist font-medium transition-all animate-slide-up">
              <AlertCircle size={17} className="shrink-0" />
              {errorMsg}
            </div>
          )}

          {/* Settings Tabs */}
          <div className="flex gap-1.5 bg-surface-container-low rounded-xl p-1 border border-outline-variant/10">
            <button
              onClick={() => setActiveTab("account")}
              className={`flex-1 py-2 px-3 rounded-lg text-title-sm font-geist font-medium transition-all duration-200 flex items-center justify-center gap-2 ${
                activeTab === "account"
                  ? "bg-surface text-on-surface shadow-sm"
                  : "text-on-surface-variant hover:text-on-surface"
              }`}
            >
              <Mail size={15} />
              Account
            </button>
            <button
              onClick={() => setActiveTab("notifications")}
              className={`flex-1 py-2 px-3 rounded-lg text-title-sm font-geist font-medium transition-all duration-200 flex items-center justify-center gap-2 ${
                activeTab === "notifications"
                  ? "bg-surface text-on-surface shadow-sm"
                  : "text-on-surface-variant hover:text-on-surface"
              }`}
            >
              <Bell size={15} />
              Alerts
            </button>
            <button
              onClick={() => setActiveTab("privacy")}
              className={`flex-1 py-2 px-3 rounded-lg text-title-sm font-geist font-medium transition-all duration-200 flex items-center justify-center gap-2 ${
                activeTab === "privacy"
                  ? "bg-surface text-on-surface shadow-sm"
                  : "text-on-surface-variant hover:text-on-surface"
              }`}
            >
              <Eye size={15} />
              Privacy
            </button>
          </div>

          {/* Tab Contents */}
          <div className="bg-surface-container-lowest border border-outline-variant/15 rounded-2xl p-5 space-y-6 shadow-sm">
            {activeTab === "account" && (
              <div className="space-y-6 animate-slide-up">
                {/* Profile Peek */}
                <div className="flex items-center gap-3.5 p-3 rounded-xl bg-surface-container-low border border-outline-variant/5">
                  <Avatar src={user?.avatar ?? undefined} name={user?.name ?? "User"} size="md" />
                  <div>
                    <h3 className="text-title-md font-geist font-semibold text-on-surface leading-tight">
                      {user?.name}
                    </h3>
                    <p className="text-body-sm text-on-surface-variant">
                      @{user?.username} · Verified {user?.role === "STUDENT" ? "Scholar" : "Business"}
                    </p>
                  </div>
                </div>

                {/* Email update Form */}
                <form onSubmit={handleUpdateEmail} className="space-y-3.5">
                  <h2 className="text-title-lg font-geist font-bold text-on-surface flex items-center gap-2 pb-1 border-b border-outline-variant/10">
                    Email Settings
                  </h2>
                  <div className="space-y-1.5">
                    <label className="text-label-md font-geist text-on-surface font-semibold">
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="email@institution.edu"
                      className="w-full h-10 px-3.5 bg-surface border border-outline-variant/25 rounded-xl text-body-md font-inter text-on-surface focus:outline-none focus:border-primary transition-all shadow-inner"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-label-md font-geist text-on-surface font-semibold">
                      Confirm Account Password
                    </label>
                    <input
                      type="password"
                      value={emailPassword}
                      onChange={(e) => setEmailPassword(e.target.value)}
                      placeholder="Enter password to confirm email change"
                      className="w-full h-10 px-3.5 bg-surface border border-outline-variant/25 rounded-xl text-body-md font-inter text-on-surface focus:outline-none focus:border-primary transition-all shadow-inner"
                    />
                  </div>
                  <Button
                    type="submit"
                    variant="secondary"
                    size="sm"
                    className="w-full sm:w-auto"
                    loading={updateEmailMutation.isPending}
                  >
                    Update Email Address
                  </Button>
                </form>

                {/* Password update Form */}
                <form onSubmit={handleUpdatePassword} className="space-y-3.5 pt-2">
                  <h2 className="text-title-lg font-geist font-bold text-on-surface flex items-center gap-2 pb-1 border-b border-outline-variant/10">
                    Change Password
                  </h2>
                  <div className="space-y-1.5">
                    <label className="text-label-md font-geist text-on-surface font-semibold">
                      Current Password
                    </label>
                    <input
                      type="password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full h-10 px-3.5 bg-surface border border-outline-variant/25 rounded-xl text-body-md font-inter text-on-surface focus:outline-none focus:border-primary transition-all shadow-inner"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-label-md font-geist text-on-surface font-semibold">
                      New Password
                    </label>
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="At least 6 characters"
                      className="w-full h-10 px-3.5 bg-surface border border-outline-variant/25 rounded-xl text-body-md font-inter text-on-surface focus:outline-none focus:border-primary transition-all shadow-inner"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-label-md font-geist text-on-surface font-semibold">
                      Confirm New Password
                    </label>
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Confirm your new password"
                      className="w-full h-10 px-3.5 bg-surface border border-outline-variant/25 rounded-xl text-body-md font-inter text-on-surface focus:outline-none focus:border-primary transition-all shadow-inner"
                    />
                  </div>
                  <Button
                    type="submit"
                    variant="secondary"
                    size="sm"
                    className="w-full sm:w-auto"
                    loading={updatePasswordMutation.isPending}
                  >
                    Change Password
                  </Button>
                </form>

                {/* Deactivate Account Danger Zone */}
                <div className="pt-4 border-t border-error-container/30">
                  <div className="p-4 rounded-xl bg-error/5 border border-error-container/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <h4 className="text-title-md font-geist font-bold text-error flex items-center gap-1.5">
                        <ShieldAlert size={16} />
                        Danger Zone
                      </h4>
                      <p className="text-body-sm text-on-surface-variant font-inter leading-relaxed">
                        Deactivating your account will immediately hide your profile and all contributions from feeds.
                      </p>
                    </div>
                    <button
                      onClick={() => setIsDeactivateOpen(true)}
                      className="w-full sm:w-auto px-4 py-2 bg-error hover:bg-error/90 text-on-error font-geist font-semibold text-title-sm rounded-xl transition-all duration-150 flex items-center justify-center gap-1.5 shadow"
                    >
                      <LogOut size={14} />
                      Deactivate Account
                    </button>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "notifications" && (
              <div className="space-y-5 animate-slide-up">
                <h2 className="text-title-lg font-geist font-bold text-on-surface pb-1 border-b border-outline-variant/10">
                  Notification Settings
                </h2>

                <div className="space-y-3.5">
                  {/* Master Toggles */}
                  <div className="flex items-center justify-between p-3.5 rounded-xl bg-surface-container-low/40 border border-outline-variant/10 hover:border-outline-variant/25 transition-all duration-200">
                    <div className="space-y-0.5 max-w-[75%]">
                      <span className="font-geist text-title-md text-on-surface font-semibold flex items-center gap-1.5">
                        <BellRing size={15} className="text-primary" />
                        In-App Notifications
                      </span>
                      <p className="font-inter text-body-sm text-on-surface-variant">
                        Show notifications in the app notification feed.
                      </p>
                    </div>
                    <span className="text-label-sm text-on-surface-variant/60 font-geist font-medium">
                      Always On
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-3.5 rounded-xl bg-surface-container-low/40 border border-outline-variant/10 hover:border-outline-variant/25 transition-all duration-200">
                    <div className="space-y-0.5 max-w-[75%]">
                      <span className="font-geist text-title-md text-on-surface font-semibold flex items-center gap-1.5">
                        <Smartphone size={15} className="text-primary" />
                        Push Notifications
                      </span>
                      <p className="font-inter text-body-sm text-on-surface-variant">
                        Receive browser push notifications.
                      </p>
                      {pushPermission === 'denied' && (
                        <p className="font-inter text-body-xs text-error mt-0.5">
                          Permission denied. Enable it in your browser settings.
                        </p>
                      )}
                      {pushPermission === 'unsupported' && (
                        <p className="font-inter text-body-xs text-on-surface-variant mt-0.5">
                          Not supported in this browser.
                        </p>
                      )}
                    </div>
                    <button
                      onClick={handlePushToggle}
                      disabled={pushPermission === 'unsupported' || isPushToggling}
                      className={`relative w-11 h-6 shrink-0 rounded-full transition-all duration-200 focus:outline-none disabled:opacity-40 ${
                        pushNotifications ? "bg-primary" : "bg-outline-variant/50"
                      }`}
                    >
                      {isPushToggling ? (
                        <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 block w-3.5 h-3.5 border-2 border-white/60 border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <span className={`absolute top-0.5 left-0.5 block w-5 h-5 rounded-full bg-[#ffffff] shadow-sm transition-transform duration-200 ${
                          pushNotifications ? "translate-x-5" : "translate-x-0"
                        }`} />
                      )}
                    </button>
                  </div>

                  <div className="flex items-center justify-between p-3.5 rounded-xl bg-surface-container-low/40 border border-outline-variant/10 hover:border-outline-variant/25 transition-all duration-200">
                    <div className="space-y-0.5 max-w-[80%]">
                      <span className="font-geist text-title-md text-on-surface font-semibold">
                        Email Notifications
                      </span>
                      <p className="font-inter text-body-sm text-on-surface-variant">
                        Receive daily updates on new discussions, follows, and comments.
                      </p>
                    </div>
                    <button
                      onClick={() => setEmailNotifications(!emailNotifications)}
                      className={`relative w-11 h-6 shrink-0 rounded-full transition-all duration-200 focus:outline-none ${
                        emailNotifications ? "bg-primary" : "bg-outline-variant/50"
                      }`}
                    >
                      <span className={`absolute top-0.5 left-0.5 block w-5 h-5 rounded-full bg-[#ffffff] shadow-sm transition-transform duration-200 ${
                        emailNotifications ? "translate-x-5" : "translate-x-0"
                      }`} />
                    </button>
                  </div>

                  <div className="flex items-center justify-between p-3.5 rounded-xl bg-surface-container-low/40 border border-outline-variant/10 hover:border-outline-variant/25 transition-all duration-200">
                    <div className="space-y-0.5 max-w-[80%]">
                      <span className="font-geist text-title-md text-on-surface font-semibold">
                        Weekly Campus Digest
                      </span>
                      <p className="font-inter text-body-sm text-on-surface-variant">
                        A curated recap of trending posts, top academic events, and department publications.
                      </p>
                    </div>
                    <button
                      onClick={() => setWeeklyDigest(!weeklyDigest)}
                      className={`relative w-11 h-6 shrink-0 rounded-full transition-all duration-200 focus:outline-none ${
                        weeklyDigest ? "bg-primary" : "bg-outline-variant/50"
                      }`}
                    >
                      <span className={`absolute top-0.5 left-0.5 block w-5 h-5 rounded-full bg-[#ffffff] shadow-sm transition-transform duration-200 ${
                        weeklyDigest ? "translate-x-5" : "translate-x-0"
                      }`} />
                    </button>
                  </div>
                </div>

                {/* Per-Type Preferences */}
                <div className="pt-2">
                  <h3 className="text-title-md font-geist font-bold text-on-surface mb-3">
                    Per-Notification Type Settings
                  </h3>
                  <div className="space-y-2">
                    {ALL_TYPES.map(({ type, label, desc }) => {
                      const pref = getPref(type)
                      const isExpanded = expandedTypes.has(type)
                      return (
                        <div key={type} className="rounded-xl bg-surface-container-low/20 border border-outline-variant/10 overflow-hidden transition-all duration-200">
                          <button
                            onClick={() => toggleTypeExpanded(type)}
                            className="w-full flex items-center justify-between p-3.5 hover:bg-surface-container-low/40 transition-colors"
                          >
                            <div className="text-left">
                              <span className="font-geist text-title-sm text-on-surface font-semibold">
                                {label}
                              </span>
                              <p className="font-inter text-body-sm text-on-surface-variant">
                                {desc}
                              </p>
                            </div>
                            {isExpanded ? <ChevronDown size={16} className="text-on-surface-variant" /> : <ChevronRight size={16} className="text-on-surface-variant" />}
                          </button>

                          {isExpanded && (
                            <div className="px-3.5 pb-3.5 space-y-2.5 border-t border-outline-variant/10 pt-2.5">
                              <div className="flex items-center justify-between">
                                <span className="font-geist text-label-md text-on-surface font-medium flex items-center gap-1.5">
                                  <BellRing size={13} className="text-primary" />
                                  In-App
                                </span>
                                <button
                                  onClick={() => togglePref(type, 'inApp')}
                                  className={`relative w-11 h-6 shrink-0 rounded-full transition-all duration-200 focus:outline-none ${
                                    pref?.inApp ?? true ? "bg-primary" : "bg-outline-variant/50"
                                  }`}
                                >
                                  <span className={`absolute top-0.5 left-0.5 block w-5 h-5 rounded-full bg-[#ffffff] shadow-sm transition-transform duration-200 ${
                                    pref?.inApp ?? true ? "translate-x-5" : "translate-x-0"
                                  }`} />
                                </button>
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="font-geist text-label-md text-on-surface font-medium flex items-center gap-1.5">
                                  <Smartphone size={13} className="text-primary" />
                                  Push
                                </span>
                                <button
                                  onClick={() => togglePref(type, 'push')}
                                  className={`relative w-11 h-6 shrink-0 rounded-full transition-all duration-200 focus:outline-none ${
                                    pref?.push ?? true ? "bg-primary" : "bg-outline-variant/50"
                                  }`}
                                >
                                  <span className={`absolute top-0.5 left-0.5 block w-5 h-5 rounded-full bg-[#ffffff] shadow-sm transition-transform duration-200 ${
                                    pref?.push ?? true ? "translate-x-5" : "translate-x-0"
                                  }`} />
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>

                <div className="pt-2 flex gap-3">
                  <Button
                    onClick={handleSavePreferences}
                    variant="primary"
                    size="md"
                    className="w-full sm:w-auto"
                    loading={updatePreferencesMutation.isPending}
                    icon={<Save size={16} />}
                  >
                    Save General
                  </Button>
                  <Button
                    onClick={() => bulkUpdatePrefsMutation.mutate(perTypePrefs)}
                    variant="secondary"
                    size="md"
                    className="w-full sm:w-auto"
                    loading={bulkUpdatePrefsMutation.isPending}
                    icon={<Save size={16} />}
                  >
                    Save Per-Type
                  </Button>
                </div>
              </div>
            )}

            {activeTab === "privacy" && (
              <div className="space-y-6 animate-slide-up">
                <h2 className="text-title-lg font-geist font-bold text-on-surface pb-1 border-b border-outline-variant/10">
                  Privacy Settings
                </h2>

                {/* Profile Privacy Grid Selector */}
                <div className="space-y-3">
                  <label className="text-label-md font-geist text-on-surface font-semibold">
                    Profile Visibility Level
                  </label>
                  <div className="grid grid-cols-1 gap-3">
                    {privacyOptions.map((opt) => {
                      const isActive = profilePrivacy === opt.value
                      return (
                        <div
                          key={opt.value}
                          onClick={() => setProfilePrivacy(opt.value)}
                          className={`p-4 rounded-xl border transition-all duration-200 cursor-pointer flex items-start gap-3.5 ${
                            isActive
                              ? "bg-primary/5 border-primary shadow-sm"
                              : "bg-surface border-outline-variant/20 hover:border-outline-variant/50 hover:bg-surface-container-low/10"
                          }`}
                        >
                          <div
                            className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 mt-0.5 ${
                              isActive ? "border-primary" : "border-outline-variant"
                            }`}
                          >
                            {isActive && <span className="w-2.5 h-2.5 rounded-full bg-primary" />}
                          </div>
                          <div className="space-y-1">
                            <h4 className="text-title-md font-geist font-bold text-on-surface">
                              {opt.title}
                            </h4>
                            <p className="text-body-sm text-on-surface-variant font-inter leading-relaxed">
                              {opt.desc}
                            </p>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* Toggle: Show Reputation */}
                <div className="flex items-center justify-between p-3.5 rounded-xl bg-surface-container-low/40 border border-outline-variant/10 hover:border-outline-variant/25 transition-all duration-200">
                  <div className="space-y-0.5 max-w-[80%]">
                    <span className="font-geist text-title-md text-on-surface font-semibold">
                      Public Reputation Score
                    </span>
                    <p className="font-inter text-body-sm text-on-surface-variant">
                      Display your total reputation score badge ({user?.reputationScore ?? 0} pts) beside your comments.
                    </p>
                  </div>
                  <button
                    onClick={() => setShowReputation(!showReputation)}
                    className={`relative w-11 h-6 shrink-0 rounded-full transition-all duration-200 focus:outline-none ${
                      showReputation ? "bg-primary" : "bg-outline-variant/50"
                    }`}
                  >
                    <span
                      className={`absolute top-0.5 left-0.5 block w-5 h-5 rounded-full bg-[#ffffff] shadow-sm transition-transform duration-200 ${
                        showReputation ? "translate-x-5" : "translate-x-0"
                      }`}
                    />
                  </button>
                </div>

                <div className="pt-2">
                  <Button
                    onClick={handleSavePreferences}
                    variant="primary"
                    size="md"
                    className="w-full sm:w-auto"
                    loading={updatePreferencesMutation.isPending}
                    icon={<Save size={16} />}
                  >
                    Save Preferences
                  </Button>
                </div>
              </div>
            )}
          </div>
        </main>

        {/* Informative side tips */}
        <aside className="hidden xl:flex flex-col w-72 shrink-0 gap-4 pt-2 sticky top-4 h-[calc(100vh-2rem)] overflow-y-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
          <div className="bg-surface-container-lowest border border-outline-variant/15 rounded-xl p-4 space-y-3.5">
            <h3 className="font-geist font-semibold text-title-md text-on-surface flex items-center gap-1.5">
              <UserCheck size={16} className="text-primary" />
              Security Tips
            </h3>
            <div className="space-y-2.5 font-inter text-body-sm text-on-surface-variant leading-relaxed">
              <p>
                <strong>Password Guidelines:</strong> Utilize standard password rules with special symbols and digits to secure your account credentials.
              </p>
              <p>
                <strong>Privacy Levels:</strong> Setting your visibility to <em>Campus Access Only</em> restricts access specifically to colleagues verified in your local department domain.
              </p>
              <p>
                <strong>Frictionless Return:</strong> Deactivating your profile retains your local content but hides it. You can reactivate at any time simply by logging back in.
              </p>
            </div>
          </div>
        </aside>
      </div>

      {/* Deactivate confirmation dialog overlay */}
      {isDeactivateOpen && (
        <div className="fixed inset-0 z-50 bg-inverse-surface/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface border border-outline-variant/20 max-w-md w-full rounded-2xl p-6 space-y-4 shadow-xl animate-scale-in">
            <div className="flex items-center gap-3 text-error">
              <div className="w-10 h-10 rounded-xl bg-error/10 flex items-center justify-center">
                <ShieldAlert size={20} />
              </div>
              <h3 className="font-geist font-bold text-headline-sm">
                Confirm Deactivation
              </h3>
            </div>
            <p className="text-body-md text-on-surface-variant font-inter leading-relaxed">
              Are you absolutely sure you want to deactivate your Scholarsphere account? 
              This will log you out immediately and hide your researcher profile, suggested listings, and all published posts/comments from everyone.
              <br />
              <span className="text-on-surface font-semibold mt-2 block">
                * You can reactivate and restore visibility simply by logging back in.
              </span>
            </p>
            <div className="flex gap-3 justify-end pt-2">
              <button
                onClick={() => setIsDeactivateOpen(false)}
                className="px-4 py-2 border border-outline-variant/40 hover:bg-surface-container-low text-on-surface font-geist font-semibold text-title-sm rounded-xl transition-all duration-150"
              >
                Cancel
              </button>
              <button
                onClick={handleDeactivate}
                className="px-4 py-2 bg-error hover:bg-error/90 text-on-error font-geist font-semibold text-title-sm rounded-xl transition-all duration-150 shadow"
              >
                Confirm Deactivate
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
