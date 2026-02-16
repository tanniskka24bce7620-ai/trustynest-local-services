import { useState } from "react";
import { useAuth } from "@/lib/authContext";
import { useNavigate } from "react-router-dom";
import { SERVICE_TYPES, SERVICE_ICONS } from "@/lib/mockData";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Star, Edit2, Save } from "lucide-react";

const ProviderDashboard = () => {
  const { user, completeProfile } = useAuth();
  const navigate = useNavigate();

  const [profileSaved, setProfileSaved] = useState(false);
  const [editing, setEditing] = useState(true);

  const [form, setForm] = useState({
    name: user?.name || "",
    age: "",
    experience: "",
    contact: "",
    serviceType: "",
    city: "",
    area: "",
    bio: "",
    available: true,
  });

  if (!user) {
    navigate("/");
    return null;
  }

  const handleChange = (field: string, value: string | boolean) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    completeProfile();
    setProfileSaved(true);
    setEditing(false);
  };

  return (
    <div className="container mx-auto max-w-2xl px-4 py-8">
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg gradient-hero">
          <span className="text-lg font-bold text-primary-foreground">
            {form.serviceType ? SERVICE_ICONS[form.serviceType] || "👷" : "👷"}
          </span>
        </div>
        <div>
          <h1 className="text-2xl font-bold">Service Provider Dashboard</h1>
          <p className="text-sm text-muted-foreground">Manage your profile and availability</p>
        </div>
      </div>

      {user.verified && (
        <Badge variant="outline" className="mb-4 gap-1 border-success/30 bg-success/10 text-success">
          <CheckCircle className="h-3 w-3" /> Aadhaar Verified
        </Badge>
      )}

      <div className="rounded-2xl border border-border bg-card p-6 shadow-card">
        {profileSaved && !editing && (
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2 text-success">
              <CheckCircle className="h-5 w-5" />
              <span className="text-sm font-medium">Profile is live and visible to customers</span>
            </div>
            <Button variant="outline" size="sm" onClick={() => setEditing(true)}>
              <Edit2 className="mr-1 h-4 w-4" /> Edit
            </Button>
          </div>
        )}

        {/* Profile preview when not editing */}
        {profileSaved && !editing && (
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-muted text-3xl">
                {SERVICE_ICONS[form.serviceType] || "👷"}
              </div>
              <div>
                <h2 className="text-xl font-semibold">{form.name}</h2>
                <p className="text-sm text-muted-foreground">{form.serviceType}</p>
                <p className="text-sm text-muted-foreground">{form.area}, {form.city}</p>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="rounded-lg bg-muted p-3">
                <p className="text-lg font-bold">{form.experience}</p>
                <p className="text-xs text-muted-foreground">Years Exp</p>
              </div>
              <div className="rounded-lg bg-muted p-3">
                <p className="text-lg font-bold flex items-center justify-center gap-1">
                  0 <Star className="h-4 w-4 fill-warning text-warning" />
                </p>
                <p className="text-xs text-muted-foreground">Rating</p>
              </div>
              <div className="rounded-lg bg-muted p-3">
                <p className="text-lg font-bold">0</p>
                <p className="text-xs text-muted-foreground">Reviews</p>
              </div>
            </div>
            <div className="rounded-lg bg-muted p-3 text-sm">{form.bio}</div>
            <div className="flex items-center justify-between rounded-lg border border-border p-3">
              <span className="text-sm font-medium">Availability</span>
              <Switch checked={form.available} onCheckedChange={(v) => handleChange("available", v)} />
            </div>
          </div>
        )}

        {/* Edit form */}
        {editing && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label>Full Name</Label>
                <Input value={form.name} onChange={(e) => handleChange("name", e.target.value)} required />
              </div>
              <div>
                <Label>Age</Label>
                <Input type="number" value={form.age} onChange={(e) => handleChange("age", e.target.value)} required />
              </div>
              <div>
                <Label>Years of Experience</Label>
                <Input type="number" value={form.experience} onChange={(e) => handleChange("experience", e.target.value)} required />
              </div>
              <div>
                <Label>Contact Number</Label>
                <Input value={form.contact} onChange={(e) => handleChange("contact", e.target.value)} placeholder="+91 XXXXX XXXXX" required />
              </div>
              <div>
                <Label>Service Type</Label>
                <Select value={form.serviceType} onValueChange={(v) => handleChange("serviceType", v)}>
                  <SelectTrigger><SelectValue placeholder="Select service" /></SelectTrigger>
                  <SelectContent>
                    {SERVICE_TYPES.map((s) => (
                      <SelectItem key={s} value={s}>{SERVICE_ICONS[s]} {s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>City</Label>
                <Input value={form.city} onChange={(e) => handleChange("city", e.target.value)} required />
              </div>
              <div className="sm:col-span-2">
                <Label>Area</Label>
                <Input value={form.area} onChange={(e) => handleChange("area", e.target.value)} placeholder="e.g. Andheri West" required />
              </div>
              <div className="sm:col-span-2">
                <Label>Bio / Short Description</Label>
                <Textarea value={form.bio} onChange={(e) => handleChange("bio", e.target.value)} placeholder="Describe your services..." required />
              </div>
            </div>
            <div className="flex items-center justify-between rounded-lg border border-border p-3">
              <span className="text-sm font-medium">Available for work</span>
              <Switch checked={form.available} onCheckedChange={(v) => handleChange("available", v)} />
            </div>
            <Button type="submit" className="w-full" size="lg">
              <Save className="mr-2 h-4 w-4" /> Save Profile
            </Button>
          </form>
        )}
      </div>
    </div>
  );
};

export default ProviderDashboard;
