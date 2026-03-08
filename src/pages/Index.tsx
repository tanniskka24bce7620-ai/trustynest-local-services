import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Shield, Users, Search, Star, Wrench, ChevronRight } from "lucide-react";
import { SERVICE_ICONS } from "@/lib/mockData";
import heroBanner from "@/assets/hero-banner.jpg";
import servnestLogo from "@/assets/servnest-logo.png";
import LeaderboardSection from "@/components/LeaderboardSection";
import ImageServiceRequest from "@/components/ImageServiceRequest";

const Index = () => {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0">
          <img src={heroBanner} alt="Service professionals" className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-r from-foreground/80 to-foreground/40" />
        </div>
        <div className="container relative mx-auto px-4 py-20 md:py-32">
          <div className="max-w-2xl">
            <h1 className="mb-4 text-4xl font-extrabold leading-tight text-primary-foreground md:text-5xl lg:text-6xl animate-fade-in">
              {t("hero.title")}
            </h1>
            <p className="mb-10 text-lg text-primary-foreground/80 animate-fade-in" style={{ animationDelay: "0.1s" }}>
              {t("hero.subtitle")}
            </p>
            <div className="flex flex-col gap-4 sm:flex-row animate-fade-in" style={{ animationDelay: "0.2s" }}>
              <Link to="/login/provider">
                <Button size="lg" className="w-full gap-2 gradient-hero border-0 text-primary-foreground shadow-elevated sm:w-auto">
                  <Wrench className="h-5 w-5" />
                  {t("hero.loginProvider")}
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link to="/login/customer">
                <Button size="lg" variant="outline" className="w-full gap-2 border-primary-foreground/30 bg-primary-foreground/10 text-primary-foreground backdrop-blur hover:bg-primary-foreground/20 sm:w-auto">
                  <Users className="h-5 w-5" />
                  {t("hero.loginCustomer")}
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Services Grid */}
      <section className="container mx-auto px-4 py-16">
        <h2 className="mb-2 text-center text-3xl font-bold">{t("services.title")}</h2>
        <p className="mb-10 text-center text-muted-foreground">{t("services.subtitle")}</p>
        <div className="grid grid-cols-3 gap-4 sm:grid-cols-4 md:grid-cols-6">
          {Object.entries(SERVICE_ICONS).map(([name, icon]) => (
            <Link
              to="/login/customer"
              key={name}
              className="group flex flex-col items-center gap-2 rounded-xl border border-border bg-card p-4 transition-all hover:shadow-card hover:border-primary/30"
            >
              <span className="text-3xl transition-transform group-hover:scale-110">{icon}</span>
              <span className="text-xs font-medium text-muted-foreground text-center">{name}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="gradient-hero-subtle py-16">
        <div className="container mx-auto px-4">
          <h2 className="mb-10 text-center text-3xl font-bold">{t("features.title")}</h2>
          <div className="grid gap-6 md:grid-cols-3">
            {[
              { icon: Shield, title: t("features.aadhaarTitle"), desc: t("features.aadhaarDesc") },
              { icon: Search, title: t("features.searchTitle"), desc: t("features.searchDesc") },
              { icon: Star, title: t("features.ratingsTitle"), desc: t("features.ratingsDesc") },
            ].map((f) => (
              <div key={f.title} className="rounded-xl bg-card p-6 shadow-soft">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg gradient-hero">
                  <f.icon className="h-6 w-6 text-primary-foreground" />
                </div>
                <h3 className="mb-2 text-lg font-semibold">{f.title}</h3>
                <p className="text-sm text-muted-foreground">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Image-Based Service Request */}
      <ImageServiceRequest />

      {/* Leaderboard */}
      <LeaderboardSection />

      {/* Trust Section */}
      <section className="container mx-auto px-4 py-16">
        <div className="rounded-2xl gradient-hero p-8 text-center md:p-12">
          <Shield className="mx-auto mb-4 h-12 w-12 text-primary-foreground" />
          <h2 className="mb-3 text-2xl font-bold text-primary-foreground md:text-3xl">{t("trust.title")}</h2>
          <p className="mx-auto max-w-xl text-primary-foreground/80">{t("trust.desc")}</p>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-card py-8">
        <div className="container mx-auto flex flex-col items-center gap-4 px-4 text-center md:flex-row md:justify-between md:text-left">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg gradient-hero">
              <span className="text-sm font-bold text-primary-foreground">S</span>
            </div>
            <span className="font-bold text-gradient">ServNest</span>
          </div>
          <p className="text-sm text-muted-foreground">{t("footer.copyright")}</p>
          <div className="flex gap-4 text-sm text-muted-foreground">
            <Link to="/about" className="hover:text-primary">{t("nav.about")}</Link>
            <Link to="/contact" className="hover:text-primary">{t("nav.contact")}</Link>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
