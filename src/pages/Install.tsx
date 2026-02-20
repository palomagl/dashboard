import { useState, useEffect } from "react";
import { Download, Smartphone, CheckCircle2, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export default function Install() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setIsInstalled(true);
    }

    // Check if iOS
    const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent);
    setIsIOS(isIOSDevice);

    // Listen for install prompt
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener("beforeinstallprompt", handler);

    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === "accepted") {
      setIsInstalled(true);
    }
    setDeferredPrompt(null);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-8 text-center">
        <Link to="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="w-4 h-4" />
          Voltar ao Dashboard
        </Link>

        <div className="glass-card rounded-2xl p-8 space-y-6">
          <div className="w-20 h-20 mx-auto bg-gradient-to-br from-primary to-primary/50 rounded-2xl flex items-center justify-center">
            <Smartphone className="w-10 h-10 text-primary-foreground" />
          </div>

          <div>
            <h1 className="text-2xl font-bold mb-2">Instalar Minha Rotina</h1>
            <p className="text-muted-foreground">
              Adicione o app à sua tela inicial para acesso rápido e funcionamento offline
            </p>
          </div>

          {isInstalled ? (
            <div className="flex items-center justify-center gap-2 text-emerald-500 py-4">
              <CheckCircle2 className="w-6 h-6" />
              <span className="font-medium">App já instalado!</span>
            </div>
          ) : isIOS ? (
            <div className="space-y-4 text-left bg-secondary/50 rounded-xl p-4">
              <p className="font-medium text-sm">Para instalar no iPhone/iPad:</p>
              <ol className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <span className="bg-primary/20 text-primary rounded-full w-5 h-5 flex items-center justify-center text-xs shrink-0">1</span>
                  Toque no ícone de <strong>Compartilhar</strong> (quadrado com seta)
                </li>
                <li className="flex items-start gap-2">
                  <span className="bg-primary/20 text-primary rounded-full w-5 h-5 flex items-center justify-center text-xs shrink-0">2</span>
                  Role para baixo e toque em <strong>"Adicionar à Tela de Início"</strong>
                </li>
                <li className="flex items-start gap-2">
                  <span className="bg-primary/20 text-primary rounded-full w-5 h-5 flex items-center justify-center text-xs shrink-0">3</span>
                  Toque em <strong>Adicionar</strong>
                </li>
              </ol>
            </div>
          ) : deferredPrompt ? (
            <Button 
              onClick={handleInstall} 
              size="lg" 
              className="w-full bg-primary hover:bg-primary/90"
            >
              <Download className="w-5 h-5 mr-2" />
              Instalar App
            </Button>
          ) : (
            <div className="space-y-4 text-left bg-secondary/50 rounded-xl p-4">
              <p className="font-medium text-sm">Para instalar no Android:</p>
              <ol className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <span className="bg-primary/20 text-primary rounded-full w-5 h-5 flex items-center justify-center text-xs shrink-0">1</span>
                  Abra o menu do navegador (⋮)
                </li>
                <li className="flex items-start gap-2">
                  <span className="bg-primary/20 text-primary rounded-full w-5 h-5 flex items-center justify-center text-xs shrink-0">2</span>
                  Toque em <strong>"Instalar app"</strong> ou <strong>"Adicionar à tela inicial"</strong>
                </li>
                <li className="flex items-start gap-2">
                  <span className="bg-primary/20 text-primary rounded-full w-5 h-5 flex items-center justify-center text-xs shrink-0">3</span>
                  Confirme a instalação
                </li>
              </ol>
            </div>
          )}

          <div className="pt-4 border-t border-border/50">
            <h3 className="font-medium mb-3">Benefícios do app:</h3>
            <ul className="space-y-2 text-sm text-muted-foreground text-left">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                Acesso rápido pela tela inicial
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                Funciona offline
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                Experiência de app nativo
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                Carrega super rápido
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
