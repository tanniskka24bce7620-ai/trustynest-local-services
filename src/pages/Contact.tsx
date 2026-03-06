import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Mail, Phone, MapPin } from "lucide-react";
import { useState } from "react";

const Contact = () => {
  const { t } = useTranslation();
  const [sent, setSent] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSent(true);
  };

  return (
    <div className="container mx-auto max-w-4xl px-4 py-16">
      <h1 className="mb-4 text-center text-4xl font-bold">{t("contact.title")} <span className="text-gradient">{t("contact.us")}</span></h1>
      <p className="mb-10 text-center text-muted-foreground">{t("contact.subtitle")}</p>

      <div className="grid gap-8 md:grid-cols-2">
        <div className="space-y-6">
          {[
            { icon: Mail, label: t("contact.email"), value: "support@servnest.in" },
            { icon: Phone, label: t("contact.phone"), value: "+91 98765 43210" },
            { icon: MapPin, label: t("contact.address"), value: "Mumbai, Maharashtra, India" },
          ].map((item) => (
            <div key={item.label} className="flex items-start gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg gradient-hero">
                <item.icon className="h-5 w-5 text-primary-foreground" />
              </div>
              <div>
                <p className="font-medium">{item.label}</p>
                <p className="text-sm text-muted-foreground">{item.value}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="rounded-xl border border-border bg-card p-6 shadow-soft">
          {sent ? (
            <div className="py-8 text-center">
              <p className="text-lg font-semibold text-success">{t("contact.sent")}</p>
              <p className="text-sm text-muted-foreground">{t("contact.sentDesc")}</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label>{t("contact.name")}</Label>
                <Input placeholder={t("contact.namePlaceholder")} required />
              </div>
              <div>
                <Label>{t("contact.email")}</Label>
                <Input type="email" placeholder={t("contact.emailPlaceholder")} required />
              </div>
              <div>
                <Label>{t("contact.message")}</Label>
                <Textarea placeholder={t("contact.messagePlaceholder")} rows={4} required />
              </div>
              <Button type="submit" className="w-full">{t("contact.send")}</Button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default Contact;
