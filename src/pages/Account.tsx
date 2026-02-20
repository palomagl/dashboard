import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useLocale } from "@/contexts/LocaleContext";
import { authApi } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, User, Lock } from "lucide-react";
import { toast } from "sonner";

export default function Account() {
  const { user, setUser } = useAuth();
  const { t } = useLocale();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileError, setProfileError] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordError, setPasswordError] = useState("");

  useEffect(() => {
    if (user) {
      setName(user.name);
      setEmail(user.email);
    }
  }, [user]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileError("");
    setProfileLoading(true);
    try {
      const updated = await authApi.updateProfile({ name: name.trim(), email: email.trim() });
      setUser(updated);
      toast.success(t("accountSuccessProfile"));
    } catch (err: any) {
      setProfileError(err.message || t("accountErrorUnknown"));
    } finally {
      setProfileLoading(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError("");
    if (newPassword.length < 6) {
      setPasswordError(t("accountPasswordMinLength"));
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError(t("accountPasswordMismatch"));
      return;
    }
    setPasswordLoading(true);
    try {
      await authApi.updatePassword(currentPassword, newPassword);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      toast.success(t("accountSuccessPassword"));
    } catch (err: any) {
      setPasswordError(err.message || t("accountErrorUnknown"));
    } finally {
      setPasswordLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-2xl py-6 px-4 md:px-6">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground text-sm mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          {t("accountBackToDashboard")}
        </Link>

        <div className="space-y-8">
          <div>
            <h1 className="text-2xl font-bold">{t("accountTitle")}</h1>
            <p className="text-muted-foreground text-sm mt-1">{t("accountSubtitle")}</p>
          </div>

          <div className="glass-card glass-card-hover rounded-xl p-6 space-y-5">
            <div className="flex items-center gap-2">
              <User className="w-5 h-5 text-primary" />
              <h2 className="font-semibold">{t("accountProfile")}</h2>
            </div>
            <form onSubmit={handleSaveProfile} className="space-y-4">
              {profileError && (
                <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm">{profileError}</div>
              )}
              <div className="space-y-2">
                <label className="text-sm font-medium">{t("accountName")}</label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="bg-secondary/50 border-border/50 rounded-xl h-11"
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">{t("accountEmail")}</label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-secondary/50 border-border/50 rounded-xl h-11"
                  required
                />
              </div>
              <Button type="submit" className="w-full rounded-xl h-11" disabled={profileLoading}>
                {profileLoading ? "..." : t("accountSaveProfile")}
              </Button>
            </form>
          </div>

          <div className="glass-card glass-card-hover rounded-xl p-6 space-y-5">
            <div className="flex items-center gap-2">
              <Lock className="w-5 h-5 text-primary" />
              <h2 className="font-semibold">{t("accountChangePassword")}</h2>
            </div>
            <form onSubmit={handleChangePassword} className="space-y-4">
              {passwordError && (
                <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm">{passwordError}</div>
              )}
              <div className="space-y-2">
                <label className="text-sm font-medium">{t("accountCurrentPassword")}</label>
                <Input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="••••••••"
                  className="bg-secondary/50 border-border/50 rounded-xl h-11"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">{t("accountNewPassword")}</label>
                <Input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                  className="bg-secondary/50 border-border/50 rounded-xl h-11"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">{t("accountConfirmPassword")}</label>
                <Input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="bg-secondary/50 border-border/50 rounded-xl h-11"
                />
              </div>
              <Button
                type="submit"
                variant="secondary"
                className="w-full rounded-xl h-11"
                disabled={passwordLoading || !currentPassword || !newPassword || !confirmPassword}
              >
                {passwordLoading ? "..." : t("accountChangePasswordButton")}
              </Button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
