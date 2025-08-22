import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, Target, PiggyBank, BarChart3, Shield, Zap } from "lucide-react";
import { Link } from "react-router-dom";
import heroImage from "@/assets/hero-financial.jpg";

const LandingPage = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="bg-gradient-card shadow-card border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <PiggyBank className="h-8 w-8 text-primary mr-2" />
              <span className="font-bold text-xl text-foreground">MoneyWise</span>
            </div>
            <div className="flex space-x-4">
              <Link to="/auth">
                <Button variant="ghost">Accedi</Button>
              </Link>
              <Link to="/auth">
                <Button variant="hero">Inizia Gratis</Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative bg-gradient-hero text-white overflow-hidden">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 lg:py-32">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <h1 className="text-4xl lg:text-6xl font-bold leading-tight">
                Il Futuro delle Tue 
                <span className="text-primary-glow"> Finanze</span>
              </h1>
              <p className="text-xl lg:text-2xl text-white/90 leading-relaxed">
                L'app più intuitiva per gestire i tuoi obiettivi finanziari e prevedere le tue spese future con precisione.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link to="/auth">
                  <Button variant="glow" size="lg" className="w-full sm:w-auto">
                    Inizia Subito - È Gratis
                  </Button>
                </Link>
                <Button variant="outline" size="lg" className="w-full sm:w-auto border-white/30 text-white hover:bg-white/10">
                  Guarda Demo
                </Button>
              </div>
            </div>
            <div className="relative">
              <div className="relative rounded-2xl overflow-hidden shadow-hero animate-float">
                <img 
                  src={heroImage} 
                  alt="Dashboard finanziaria moderna" 
                  className="w-full h-auto"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent"></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-accent/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-foreground mb-4">
              Perché MoneyWise è Diverso
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Non siamo solo un'altra app di budget. Siamo il tuo consulente finanziario personale che prevede il futuro.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="shadow-card hover:shadow-glow transition-smooth group">
              <CardHeader>
                <div className="w-12 h-12 bg-gradient-primary rounded-lg flex items-center justify-center mb-4 group-hover:animate-glow">
                  <Zap className="h-6 w-6 text-white" />
                </div>
                <CardTitle>Inserimento Ultrarapido</CardTitle>
                <CardDescription>
                  Aggiungi spese e obiettivi in secondi con la nostra interfaccia intelligente
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="shadow-card hover:shadow-glow transition-smooth group">
              <CardHeader>
                <div className="w-12 h-12 bg-gradient-secondary rounded-lg flex items-center justify-center mb-4 group-hover:animate-glow">
                  <BarChart3 className="h-6 w-6 text-white" />
                </div>
                <CardTitle>Previsioni Intelligenti</CardTitle>
                <CardDescription>
                  Algoritmi avanzati che predicono le tue spese future con precisione
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="shadow-card hover:shadow-glow transition-smooth group">
              <CardHeader>
                <div className="w-12 h-12 bg-gradient-primary rounded-lg flex items-center justify-center mb-4 group-hover:animate-glow">
                  <Target className="h-6 w-6 text-white" />
                </div>
                <CardTitle>Obiettivi Smart</CardTitle>
                <CardDescription>
                  Definisci obiettivi realistici basati sui tuoi pattern di spesa reali
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl lg:text-4xl font-bold text-foreground mb-6">
                Smetti di Indovinare, Inizia a Sapere
              </h2>
              <div className="space-y-6">
                <div className="flex items-start space-x-4">
                  <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <TrendingUp className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg text-foreground">Previsioni Precise</h3>
                    <p className="text-muted-foreground">Saprai esattamente quanto puoi spendere questo mese e nei prossimi</p>
                  </div>
                </div>
                <div className="flex items-start space-x-4">
                  <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <Shield className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg text-foreground">Sicurezza Bancaria</h3>
                    <p className="text-muted-foreground">I tuoi dati sono protetti con crittografia di livello bancario</p>
                  </div>
                </div>
                <div className="flex items-start space-x-4">
                  <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <Target className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg text-foreground">Obiettivi Raggiungibili</h3>
                    <p className="text-muted-foreground">Imposta obiettivi realistici basati sui tuoi comportamenti di spesa</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-gradient-card rounded-2xl p-8 shadow-hero">
              <div className="text-center">
                <div className="text-4xl font-bold text-primary mb-2">95%</div>
                <div className="text-sm text-muted-foreground mb-6">Precisione delle previsioni</div>
                <div className="grid grid-cols-2 gap-6 text-center">
                  <div>
                    <div className="text-2xl font-bold text-foreground">10k+</div>
                    <div className="text-sm text-muted-foreground">Utenti attivi</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-foreground">€2M+</div>
                    <div className="text-sm text-muted-foreground">Risparmi generati</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-hero text-white">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl lg:text-4xl font-bold mb-6">
            Prendi il Controllo delle Tue Finanze Oggi
          </h2>
          <p className="text-xl text-white/90 mb-8">
            Unisciti a migliaia di persone che hanno trasformato la loro situazione finanziaria con MoneyWise.
          </p>
          <Link to="/auth">
            <Button variant="glow" size="lg" className="px-12">
              Inizia Gratis Ora
            </Button>
          </Link>
          <p className="text-sm text-white/70 mt-4">
            Nessuna carta di credito richiesta • Setup in 2 minuti
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-muted py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="flex items-center justify-center mb-4">
              <PiggyBank className="h-8 w-8 text-primary mr-2" />
              <span className="font-bold text-xl text-foreground">MoneyWise</span>
            </div>
            <p className="text-muted-foreground">
              © 2024 MoneyWise. Il tuo partner per il successo finanziario.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;