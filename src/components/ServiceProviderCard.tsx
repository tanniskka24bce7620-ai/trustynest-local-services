import { ServiceProvider, SERVICE_ICONS } from "@/lib/mockData";
import { Star, MapPin, Clock, CheckCircle, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface Props {
  provider: ServiceProvider;
  onViewProfile: (provider: ServiceProvider) => void;
}

const ServiceProviderCard = ({ provider, onViewProfile }: Props) => {
  return (
    <div className="group rounded-xl border border-border bg-card p-5 shadow-soft transition-all hover:shadow-card">
      <div className="flex gap-4">
        <img
          src={provider.photo}
          alt={provider.name}
          className="h-20 w-20 rounded-xl object-cover"
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h3 className="font-semibold truncate">{provider.name}</h3>
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <span>{SERVICE_ICONS[provider.serviceType]}</span>
                <span>{provider.serviceType}</span>
              </div>
            </div>
            {provider.verified && (
              <Badge variant="outline" className="shrink-0 gap-1 border-success/30 bg-success/10 text-success">
                <CheckCircle className="h-3 w-3" /> Verified
              </Badge>
            )}
          </div>

          <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <MapPin className="h-3 w-3" /> {provider.area}, {provider.city}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" /> {provider.experience} yrs exp
            </span>
          </div>

          <div className="mt-2 flex items-center gap-1">
            <Star className="h-4 w-4 fill-warning text-warning" />
            <span className="text-sm font-medium">{provider.rating}</span>
            <span className="text-xs text-muted-foreground">({provider.reviewCount} reviews)</span>
          </div>
        </div>
      </div>

      <p className="mt-3 text-sm text-muted-foreground line-clamp-2">{provider.bio}</p>

      <div className="mt-4 flex items-center gap-2">
        <Button size="sm" className="flex-1" onClick={() => onViewProfile(provider)}>
          Book Service
        </Button>
        <Button size="sm" variant="outline" onClick={() => onViewProfile(provider)}>
          View Profile
        </Button>
        <a href={`tel:${provider.contact}`}>
          <Button size="sm" variant="ghost">
            <Phone className="h-4 w-4" />
          </Button>
        </a>
      </div>

      {!provider.available && (
        <div className="mt-2 rounded-md bg-destructive/10 px-3 py-1 text-center text-xs font-medium text-destructive">
          Currently Unavailable
        </div>
      )}
    </div>
  );
};

export default ServiceProviderCard;
