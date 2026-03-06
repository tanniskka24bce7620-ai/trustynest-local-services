import { useTranslation } from "react-i18next";
import { Shield, Users, Heart } from "lucide-react";

const About = () => {
  const { t } = useTranslation();

  return (
    <div className="container mx-auto max-w-3xl px-4 py-16">
      <h1 className="mb-4 text-center text-4xl font-bold">{t("about.title")} <span className="text-gradient">ServNest</span></h1>
      <p className="mb-10 text-center text-lg text-muted-foreground">{t("about.subtitle")}</p>
      <div className="grid gap-6 md:grid-cols-3">
        {[
          { icon: Shield, title: t("about.trustTitle"), desc: t("about.trustDesc") },
          { icon: Users, title: t("about.communityTitle"), desc: t("about.communityDesc") },
          { icon: Heart, title: t("about.empowerTitle"), desc: t("about.empowerDesc") },
        ].map((item) => (
          <div key={item.title} className="rounded-xl border border-border bg-card p-6 text-center shadow-soft">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-lg gradient-hero">
              <item.icon className="h-6 w-6 text-primary-foreground" />
            </div>
            <h3 className="mb-2 font-semibold">{item.title}</h3>
            <p className="text-sm text-muted-foreground">{item.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default About;
