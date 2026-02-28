
"use client";

import { use, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { MapPin, Calendar, User, Info, AlertCircle, CheckCircle2, ArrowLeft, Sparkles, Map as MapIcon, Loader2, Briefcase, MessageSquare, ShieldCheck } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useFirestore, useDoc, useMemoFirebase, useUser, updateDocumentNonBlocking } from '@/firebase';
import { doc } from 'firebase/firestore';
import { WasteComplaint, UserProfile, ComplaintStatus } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';

export default function ComplaintDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const firestore = useFirestore();
  const { user } = useUser();
  const { toast } = useToast();
  
  const [workerReply, setWorkerReply] = useState('');
  
  const complaintRef = useMemoFirebase(() => {
    if (!firestore || !id) return null;
    return doc(firestore, 'complaints', id);
  }, [firestore, id]);

  const { data: complaint, isLoading } = useDoc<WasteComplaint>(complaintRef);

  const profileRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return doc(firestore, 'users', user.uid);
  }, [firestore, user]);

  const { data: profileDoc } = useDoc<UserProfile>(profileRef);

  const handleUpdateStatus = (newStatus: ComplaintStatus) => {
    if (!complaintRef) return;
    
    const updateData: any = { 
      status: newStatus,
    };

    if (newStatus === 'resolved') {
      updateData.resolvedDateTime = new Date().toISOString();
      updateData.resolutionDetails = workerReply;
    } else {
      updateData.resolvedDateTime = null;
    }
    
    updateDocumentNonBlocking(complaintRef, updateData);

    toast({
      title: "Status Updated",
      description: `Report marked as ${newStatus}. ${newStatus === 'resolved' ? 'Citizen has been notified of your reply.' : 'Review is underway.'}`,
    });
  };

  if (isLoading) {
    return (
      <div className="container py-20 flex justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
      </div>
    );
  }

  if (!complaint) {
    return (
      <div className="container py-20 text-center">
        <h1 className="text-2xl font-bold mb-4">Complaint Not Found</h1>
        <Button asChild>
          <Link href="/complaints">Back to List</Link>
        </Button>
      </div>
    );
  }

  const isWorker = profileDoc?.role === 'worker';
  const statusInfo = {
    pending: { icon: AlertCircle, color: 'text-yellow-600', bg: 'bg-yellow-50', label: 'Reported' },
    'in-progress': { icon: Info, color: 'text-blue-600', bg: 'bg-blue-50', label: 'Under Review' },
    resolved: { icon: CheckCircle2, color: 'text-green-600', bg: 'bg-green-50', label: 'Cleaned Up' },
  };

  const currentStatus = statusInfo[complaint.status as keyof typeof statusInfo] || statusInfo.pending;
  const StatusIcon = currentStatus.icon;

  return (
    <div className="container px-4 py-8 md:py-12 max-w-5xl">
      <Button asChild variant="ghost" className="mb-6 hover:bg-transparent hover:text-primary p-0">
        <Link href="/complaints" className="flex items-center gap-2 font-semibold">
          <ArrowLeft className="w-5 h-5" />
          Back to Reports
        </Link>
      </Button>

      <div className="grid lg:grid-cols-2 gap-10">
        <div className="space-y-6">
          <div className="relative aspect-square rounded-3xl overflow-hidden shadow-2xl border-4 border-white">
            <Image 
              src={complaint.imageUrl} 
              alt={complaint.aiSummary} 
              fill 
              className="object-cover"
            />
          </div>
          
          <Card className="rounded-3xl border-none shadow-md overflow-hidden bg-white">
            <CardContent className="p-6">
               <div className="flex items-center justify-between mb-4">
                 <div className="flex items-center gap-2">
                   <MapIcon className="w-5 h-5 text-accent" />
                   <h3 className="font-bold text-lg">Site Location</h3>
                 </div>
               </div>
               <p className="text-muted-foreground mb-2 flex items-start gap-2">
                 <MapPin className="w-4 h-4 text-primary shrink-0 mt-1" />
                 {complaint.location.address}
               </p>
               <div className="p-3 bg-muted/30 rounded-xl text-xs font-mono text-center">
                 Coordinates: {complaint.location.lat.toFixed(4)}, {complaint.location.lng.toFixed(4)}
               </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <div className="flex items-center gap-3 mb-2">
            <div className={cn("p-2 rounded-xl", currentStatus.bg)}>
              <StatusIcon className={cn("w-6 h-6", currentStatus.color)} />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-0.5">Report Status</p>
              <p className={cn("font-bold text-lg", currentStatus.color)}>{currentStatus.label}</p>
            </div>
          </div>

          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-gray-900 leading-tight">
            {complaint.aiSummary}
          </h1>

          <div className="flex flex-wrap gap-4 text-sm font-medium text-muted-foreground">
            <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-full shadow-sm">
              <Calendar className="w-4 h-4 text-accent" />
              {format(new Date(complaint.createdAt), 'MMMM d, yyyy • h:mm a')}
            </div>
            <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-full shadow-sm">
              <User className="w-4 h-4 text-accent" />
              Reported by {complaint.userName}
            </div>
          </div>

          {/* Worker Controls */}
          {isWorker && (
            <Card className="border-2 border-accent/20 bg-accent/5 rounded-3xl overflow-hidden shadow-lg ring-1 ring-accent/10">
              <CardContent className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Briefcase className="w-5 h-5 text-accent" />
                  <h3 className="font-bold text-accent">Guardian Response Panel</h3>
                </div>
                
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase text-accent/70 ml-1 flex items-center gap-1">
                      <MessageSquare className="w-3 h-3" /> Worker's Resolution Reply
                    </label>
                    <Textarea 
                      placeholder="Describe the action taken or provide details for the citizen..."
                      value={workerReply}
                      onChange={(e) => setWorkerReply(e.target.value)}
                      className="rounded-xl border-accent/20 focus:ring-accent bg-white/50"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <Button 
                      variant={complaint.status === 'in-progress' ? "default" : "outline"} 
                      className="rounded-xl h-12 font-bold transition-all"
                      onClick={() => handleUpdateStatus('in-progress')}
                      disabled={complaint.status === 'in-progress'}
                    >
                      Under Review
                    </Button>
                    <Button 
                      variant={complaint.status === 'resolved' ? "default" : "outline"} 
                      className="rounded-xl h-12 font-bold bg-green-600 hover:bg-green-700 text-white border-none shadow-md active:scale-95 transition-all"
                      onClick={() => handleUpdateStatus('resolved')}
                      disabled={complaint.status === 'resolved'}
                    >
                      <CheckCircle2 className="w-4 h-4 mr-2" /> Mark Resolved
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Official Resolution Card (Visible to everyone if resolved) */}
          {complaint.status === 'resolved' && (
            <Card className="rounded-3xl border-2 border-green-100 bg-green-50/30 overflow-hidden shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-center gap-2 mb-3">
                  <ShieldCheck className="w-5 h-5 text-green-600" />
                  <h3 className="font-bold text-green-800">Official Resolution</h3>
                </div>
                <div className="bg-white/80 p-4 rounded-2xl border border-green-100 shadow-inner italic text-green-900">
                  {complaint.resolutionDetails || "This spot has been successfully cleaned by our Madurai Cleanup Guardians."}
                </div>
                {complaint.resolvedDateTime && (
                  <p className="text-[10px] uppercase font-bold text-green-600/60 mt-3 text-right">
                    Completed on {format(new Date(complaint.resolvedDateTime), 'MMM d, yyyy • h:mm a')}
                  </p>
                )}
              </CardContent>
            </Card>
          )}

          <div className="space-y-3">
            <h3 className="font-bold text-lg text-gray-800">Citizen Description</h3>
            <p className="text-muted-foreground leading-relaxed bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
              &quot;{complaint.description}&quot;
            </p>
          </div>

          <Card className="rounded-3xl border-none shadow-xl bg-gradient-to-br from-primary to-green-800 text-white overflow-hidden relative">
            <div className="absolute top-0 right-0 p-4 opacity-20 pointer-events-none">
              <Sparkles className="w-24 h-24 text-white rotate-12" />
            </div>
            <CardContent className="p-8">
              <div className="flex items-center gap-2 mb-6">
                <Sparkles className="w-6 h-6 text-green-300" />
                <h3 className="font-bold text-xl tracking-tight">Vision-AI Classification</h3>
              </div>
              
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/20">
                  <p className="text-xs font-bold uppercase text-green-200 mb-1">Waste Type</p>
                  <p className="text-xl font-bold capitalize">{complaint.aiAnalysis.wasteType}</p>
                </div>
                <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/20">
                  <p className="text-xs font-bold uppercase text-green-200 mb-1">Impact Level</p>
                  <p className="text-xl font-bold capitalize">{complaint.aiAnalysis.severity}</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="bg-white/10 backdrop-blur-md rounded-2xl p-5 border border-white/20">
                  <p className="text-xs font-bold uppercase text-green-200 mb-2">Technical Analysis</p>
                  <p className="text-sm leading-relaxed text-gray-100 italic">
                    {complaint.aiAnalysis.analysisDetails}
                  </p>
                </div>
                
                <div className="flex flex-wrap gap-2">
                  {complaint.aiKeyDetails.map((detail, i) => (
                    <Badge key={i} variant="secondary" className="bg-green-400/20 text-white hover:bg-green-400/30 border-none px-3 py-1">
                      {detail}
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
