import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useLocale } from "@/contexts/LocaleContext";
import { userApi } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, User } from "lucide-react";
import { toast } from "sonner";

export default function Account() {
  const { user, setUser } = useAuth();
  const { t } = useLocale();
  const [name, setName] = useState("");
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");

  useEffect(() => {
    if (user) setName(user.name);
  }, [user]);

  const salvarPerfil = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setErro("");
    setSalvando(true);
    try {
      const atualizado = await userApi.updateProfile({ name: name.trim(), email: user.email });
      setUser(atualizado);
      toast.success(t("accountSuccessProfile"));
    } catch (err) {
      setErro((err as Error).message || t("accountErrorUnknown"));
    } finally {
      setSalvando(false);
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

          {/* Conta do Google */}
          <div className="glass-card rounded-xl p-6 space-y-4">
            <h2 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground">
              {t("accountGoogleConnected")}
            </h2>
            <div className="flex items-center gap-4">
              {user?.photoURL ? (
                <img
                  src={user.photoURL}
                  alt=""
                  referrerPolicy="no-referrer"
                  className="w-12 h-12 rounded-full border border-border/50"
                />
              ) : (
                <div className="w-12 h-12 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center">
                  <User className="w-5 h-5 text-primary" />
                </div>
              )}
              <div className="min-w-0">
                <p className="font-medium truncate">{user?.name}</p>
                <p className="text-sm text-muted-foreground truncate">{user?.email}</p>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">{t("accountEmailFromGoogle")}</p>
          </div>

          {/* Perfil */}
          <div className="glass-card glass-card-hover rounded-xl p-6 space-y-5">
            <div className="flex items-center gap-2">
              <User className="w-5 h-5 text-primary" />
              <h2 className="font-semibold">{t("accountProfile")}</h2>
            </div>
            <form onSubmit={salvarPerfil} className="space-y-4">
              {erro && (
                <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm">{erro}</div>
              )}
              <div className="space-y-2">
                <label className="text-sm font-medium" htmlFor="perfil-nome">
                  {t("accountName")}
                </label>
                <Input
                  id="perfil-nome"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="bg-secondary/50 border-border/50 rounded-xl h-11"
                  required
                />
              </div>
              <Button
                type="submit"
                className="w-full rounded-xl h-11"
                disabled={salvando || !name.trim() || name.trim() === user?.name}
              >
                {salvando ? "..." : t("accountSaveProfile")}
              </Button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
