import { Calendar, Search, Sun, Moon, LogOut, User, Menu, X } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";
import { useLocale } from "@/contexts/LocaleContext";
import type { Locale } from "@/lib/translations";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function DashboardHeader() {
  const [currentDate] = useState(new Date());
  const [isDark, setIsDark] = useState(
    () => typeof document !== "undefined" && document.documentElement.classList.contains("dark")
  );
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, logout } = useAuth();
  const { locale, setLocale, t } = useLocale();

  const toggleTheme = () => {
    const next = !document.documentElement.classList.contains("dark");
    document.documentElement.classList.toggle("dark", next);
    try {
      localStorage.setItem("theme", next ? "dark" : "light");
    } catch {}
    setIsDark(next);
  };

  const localeForDate = locale === "pt" ? "pt-BR" : "en-US";
  const formatDate = (date: Date) => {
    return date.toLocaleDateString(localeForDate, {
      weekday: "long",
      day: "numeric",
      month: "long",
    });
  };

  const getGreeting = () => {
    const hour = currentDate.getHours();
    if (hour < 12) return t("greetingMorning");
    if (hour < 18) return t("greetingAfternoon");
    return t("greetingEvening");
  };

  return (
    <header className="pb-6 border-b border-border/50">
      {/* Top Row - Greeting and Actions */}
      <div className="flex items-start justify-between gap-4 mb-4">
        <div className="flex-1 min-w-0">
          <h1 className="text-xl sm:text-2xl font-semibold tracking-tight leading-tight">
            <span className="text-foreground">{getGreeting()},</span>
            <br className="sm:hidden" />
            <Link 
              to="/account" 
              className="gradient-text hover:opacity-90 transition-opacity inline-block mt-1 sm:mt-0 sm:ml-1"
            >
              {user?.name || t("user")}
            </Link>
          </h1>
        </div>

        {/* Desktop Actions */}
        <div className="hidden md:flex items-center gap-2 flex-shrink-0">
          <div className="flex items-center gap-1 text-xs text-muted-foreground border border-border/50 rounded-lg p-0.5 bg-secondary/30">
            <button
              type="button"
              onClick={() => setLocale("pt" as Locale)}
              className={`px-2.5 py-1 rounded-md transition-colors ${locale === "pt" ? "bg-primary text-primary-foreground" : "hover:bg-secondary"}`}
              aria-label="Português"
            >
              PT
            </button>
            <button
              type="button"
              onClick={() => setLocale("en" as Locale)}
              className={`px-2.5 py-1 rounded-md transition-colors ${locale === "en" ? "bg-primary text-primary-foreground" : "hover:bg-secondary"}`}
              aria-label="English"
            >
              EN
            </button>
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder={t("search")}
              className="pl-9 w-64 bg-secondary/50 border-border/50 focus:border-primary/50"
            />
          </div>

          <Button type="button" variant="ghost" size="icon" onClick={toggleTheme} aria-label={isDark ? t("themeLight") : t("themeDark")}>
            {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </Button>

          <Button type="button" variant="ghost" size="icon" asChild>
            <Link to="/account" title={t("accountTitle")} aria-label={t("accountTitle")}>
              <User className="w-5 h-5" />
            </Link>
          </Button>
          
          <Button type="button" variant="ghost" size="icon" onClick={logout} title={t("logout")} aria-label={t("logout")}>
            <LogOut className="w-5 h-5" />
          </Button>
        </div>

        {/* Mobile Menu Button */}
        <div className="md:hidden flex items-center gap-2 flex-shrink-0">
          <div className="flex items-center gap-1 text-xs text-muted-foreground border border-border/50 rounded-lg p-0.5 bg-secondary/30">
            <button
              type="button"
              onClick={() => setLocale("pt" as Locale)}
              className={`px-2 py-1 rounded-md transition-colors text-xs ${locale === "pt" ? "bg-primary text-primary-foreground" : "hover:bg-secondary"}`}
              aria-label="Português"
            >
              PT
            </button>
            <button
              type="button"
              onClick={() => setLocale("en" as Locale)}
              className={`px-2 py-1 rounded-md transition-colors text-xs ${locale === "en" ? "bg-primary text-primary-foreground" : "hover:bg-secondary"}`}
              aria-label="English"
            >
              EN
            </button>
          </div>

          <DropdownMenu open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden">
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <div className="relative px-2 py-1.5">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder={t("search")}
                  className="pl-9 w-full bg-secondary/50 border-border/50 focus:border-primary/50 text-sm"
                />
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={toggleTheme} className="cursor-pointer">
                {isDark ? <Sun className="w-4 h-4 mr-2" /> : <Moon className="w-4 h-4 mr-2" />}
                {isDark ? t("themeLight") : t("themeDark")}
              </DropdownMenuItem>
              <DropdownMenuItem asChild className="cursor-pointer">
                <Link to="/account" className="flex items-center">
                  <User className="w-4 h-4 mr-2" />
                  {t("accountTitle")}
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={logout} className="cursor-pointer text-destructive focus:text-destructive">
                <LogOut className="w-4 h-4 mr-2" />
                {t("logout")}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Date Row */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Calendar className="w-4 h-4 flex-shrink-0" />
        <span className="capitalize truncate">{formatDate(currentDate)}</span>
      </div>
    </header>
  );
}
