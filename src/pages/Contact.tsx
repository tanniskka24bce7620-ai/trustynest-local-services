import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Mail, Phone, MapPin } from "lucide-react";
import { useState } from "react";

const Contact = () => {
  const [sent, setSent] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSent(true);
  };

  return (
    <div className="container mx-auto max-w-4xl px-4 py-16">
      <h1 className="mb-4 text-center text-4xl font-bold">Contact <span className="text-gradient">Us</span></h1>
      <p className="mb-10 text-center text-muted-foreground">Have questions? We'd love to hear from you.</p>

      <div className="grid gap-8 md:grid-cols-2">
        <div className="space-y-6">
          {[
            { icon: Mail, label: "Email", value: "support@servnest.in" },
            { icon: Phone, label: "Phone", value: "+91 98765 43210" },
            { icon: MapPin, label: "Address", value: "Mumbai, Maharashtra, India" },
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
              <p className="text-lg font-semibold text-success">Message sent!</p>
              <p className="text-sm text-muted-foreground">We'll get back to you soon.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label>Name</Label>
                <Input placeholder="Your name" required />
              </div>
              <div>
                <Label>Email</Label>
                <Input type="email" placeholder="you@example.com" required />
              </div>
              <div>
                <Label>Message</Label>
                <Textarea placeholder="Your message..." rows={4} required />
              </div>
              <Button type="submit" className="w-full">Send Message</Button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default Contact;
