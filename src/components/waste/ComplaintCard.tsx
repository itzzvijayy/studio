
import { WasteComplaint } from '@/lib/types';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, Calendar, ArrowRight, Sparkles } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

interface ComplaintCardProps {
  complaint: WasteComplaint;
}

export function ComplaintCard({ complaint }: ComplaintCardProps) {
  const statusColors = {
    pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    'in-progress': 'bg-blue-100 text-blue-800 border-blue-200',
    resolved: 'bg-green-100 text-green-800 border-green-200',
  };

  const severityColors = {
    low: 'bg-gray-100 text-gray-700',
    medium: 'bg-blue-100 text-blue-700',
    high: 'bg-orange-100 text-orange-700',
    critical: 'bg-red-100 text-red-700',
  };

  return (
    <Link href={`/complaints/${complaint.id}`}>
      <Card className="overflow-hidden hover:shadow-xl transition-all border-none shadow-md group h-full flex flex-col">
        <div className="relative aspect-[4/3] overflow-hidden">
          <Image 
            src={complaint.imageUrl} 
            alt={complaint.aiSummary} 
            fill 
            className="object-cover group-hover:scale-105 transition-transform duration-500"
          />
          <Badge className={cn("absolute top-4 left-4 border", statusColors[complaint.status])}>
            {complaint.status}
          </Badge>
          {complaint.aiAnalysis.severity && (
            <Badge className={cn("absolute top-4 right-4", severityColors[complaint.aiAnalysis.severity])}>
              {complaint.aiAnalysis.severity}
            </Badge>
          )}
        </div>
        <CardContent className="p-5 flex-1 flex flex-col">
          <div className="flex items-center gap-1.5 mb-2 text-xs font-semibold text-primary uppercase tracking-widest">
            <Sparkles className="w-3 h-3" />
            <span>AI Verified: {complaint.aiAnalysis.wasteType}</span>
          </div>
          <h3 className="text-xl font-bold mb-3 line-clamp-1 group-hover:text-primary transition-colors">
            {complaint.aiSummary}
          </h3>
          <div className="space-y-2 mb-4 flex-1">
            <div className="flex items-start gap-2 text-sm text-muted-foreground">
              <MapPin className="w-4 h-4 shrink-0 text-accent mt-0.5" />
              <span className="line-clamp-1">{complaint.location.address}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="w-4 h-4 shrink-0 text-accent" />
              <span>{format(new Date(complaint.createdAt), 'MMM d, yyyy')}</span>
            </div>
          </div>
          <div className="flex items-center justify-between pt-4 border-t mt-auto">
            <span className="text-sm font-medium text-muted-foreground">
              By {complaint.userName}
            </span>
            <div className="text-primary group-hover:translate-x-1 transition-transform">
              <ArrowRight className="w-5 h-5" />
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
