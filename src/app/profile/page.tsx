
"use client";

import { useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { Settings, Leaf, MapPin, Award, ShieldCheck, ChevronRight, Loader2, Mail } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { useFirestore, useUser, useCollection, useDoc, useMemoFirebase } from '@/firebase';
import { collection, query, where, doc } from 'firebase/firestore';
import { WasteComplaint } from '@/lib/types';

export default function ProfilePage() {
  const avatarImg = PlaceHolderImages.find(img => img.id === 'avatar-user');
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();

  // Fetch the specific UserProfile document
  const profileRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return doc(firestore, 'users', user.uid);
  }, [firestore, user]);

  const { data: profileDoc, isLoading: isProfileLoading } = useDoc(profileRef);

  // Fetch user's complaints
  const userComplaintsQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    // We remove the orderBy here to avoid requiring a composite index in Firestore
    // We will sort the results client-side instead.
    return query(
      collection(firestore, 'complaints'),
      where('userId', '==', user.uid)
    );
  }, [firestore, user]);

  const { data: userComplaints, isLoading: isComplaintsLoading } = useCollection<WasteComplaint>(userComplaintsQuery);

  // Client-side sorting to ensure data shows up without index issues
  const sortedComplaints = useMemo(() => {
    if (!userComplaints) return [];
    return [...userComplaints].sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }, [userComplaints]);

  const resolvedCount = userComplaints?.filter(c => c.status === 'resolved').length || 0;
  const totalCount = userComplaints?.length || 0;

  if (isUserLoading) {
    return (
      <div className="container py-20 flex flex-col items-center justify-center gap-4">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
        <p className="text-sm font-medium text-muted-foreground">Identifying citizen profile...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container py-20 text-center">
        <h2 className="text-2xl font-bold mb-4">Citizen Session Required</h2>
        <p className="text-muted-foreground mb-6">Please wait while we initialize your secure Madurai reporting session.</p>
        <Button onClick={() => window.location.reload()}>Refresh Session</Button>
      </div>
    );
  }

  return (
    <div className="container px-4 py-8 md:py-12 max-w-4xl">
      <div className="flex flex-col gap-10">
        <div className="relative">
          <div className="h-48 rounded-3xl bg-gradient-to-r from-primary to-accent overflow-hidden relative">
             <div className="absolute inset-0 opacity-20 pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/leaf.png')]"></div>
             <div className="absolute bottom-4 right-6 text-white/40 text-xs font-bold uppercase tracking-widest">Madurai District Hero</div>
          </div>
          <div className="absolute -bottom-8 left-8 flex items-end gap-6">
            <Avatar className="h-32 w-32 border-4 border-white shadow-2xl rounded-3xl bg-white">
              <AvatarImage src={avatarImg?.imageUrl} />
              <AvatarFallback className="text-4xl bg-secondary text-primary">{user?.displayName?.[0] || 'C'}</AvatarFallback>
            </Avatar>
            <div className="pb-2 text-white md:text-foreground">
               <h1 className="text-3xl font-bold tracking-tight shadow-sm md:shadow-none">
                {profileDoc?.name || user?.displayName || 'Madurai Citizen'}
               </h1>
               <div className="flex items-center gap-2 text-blue-100 md:text-muted-foreground font-medium">
                 <ShieldCheck className="w-4 h-4" />
                 <span>Guardian of the Temple City</span>
               </div>
            </div>
          </div>
          <div className="absolute -bottom-8 right-8">
             <Button variant="outline" className="rounded-full bg-white shadow-md border-none hover:bg-gray-50">
               <Settings className="w-4 h-4 mr-2" /> Settings
             </Button>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
          {[
            { label: 'Reports', value: totalCount.toString(), icon: Leaf, color: 'text-green-600', bg: 'bg-green-50' },
            { label: 'Cleaned', value: resolvedCount.toString(), icon: ShieldCheck, color: 'text-blue-600', bg: 'bg-blue-50' },
            { label: 'Impact', value: (totalCount * 50).toString(), icon: Award, color: 'text-orange-600', bg: 'bg-orange-50' },
            { label: 'District', value: 'Madurai', icon: MapPin, color: 'text-purple-600', bg: 'bg-purple-50' },
          ].map((stat, i) => (
            <Card key={i} className="border-none shadow-sm rounded-2xl overflow-hidden bg-white">
              <CardContent className="p-5 text-center">
                <div className={cn("w-10 h-10 rounded-full mx-auto mb-3 flex items-center justify-center", stat.bg)}>
                  <stat.icon className={cn("w-5 h-5", stat.color)} />
                </div>
                <div className="text-2xl font-bold">{stat.value}</div>
                <div className="text-xs font-bold uppercase tracking-widest text-muted-foreground mt-1">{stat.label}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          <div className="md:col-span-2 space-y-6">
             <div className="flex items-center justify-between px-2">
               <h2 className="text-2xl font-bold">Your Recent Activity</h2>
               {totalCount > 0 && <Badge variant="secondary" className="bg-primary/10 text-primary border-none">{totalCount} Total</Badge>}
             </div>
             
             <div className="space-y-4">
               {isComplaintsLoading ? (
                 <div className="flex justify-center py-12">
                   <Loader2 className="w-8 h-8 animate-spin text-primary" />
                 </div>
               ) : sortedComplaints.length > 0 ? sortedComplaints.slice(0, 5).map((c) => (
                 <Link key={c.id} href={`/complaints/${c.id}`}>
                   <Card className="hover:shadow-md transition-all border-none shadow-sm mb-4 group cursor-pointer overflow-hidden bg-white border border-gray-100/50">
                     <CardContent className="p-4 flex items-center gap-4">
                        <div className="relative h-20 w-20 rounded-xl overflow-hidden shrink-0 border border-gray-100">
                          <Image src={c.imageUrl} alt={c.aiSummary} fill className="object-cover" />
                        </div>
                        <div className="flex-1 min-w-0">
                           <div className="flex items-center justify-between mb-1">
                             <h4 className="font-bold truncate text-lg group-hover:text-primary transition-colors">{c.aiSummary}</h4>
                             <Badge 
                               variant="outline" 
                               className={cn(
                                 "text-[10px] font-bold uppercase",
                                 c.status === 'resolved' ? "bg-green-50 text-green-700 border-green-100" : "bg-yellow-50 text-yellow-700 border-yellow-100"
                               )}
                             >
                               {c.status}
                             </Badge>
                           </div>
                           <p className="text-sm text-muted-foreground flex items-center gap-1 truncate">
                             <MapPin className="w-3 h-3" /> {c.location.address}
                           </p>
                        </div>
                        <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                     </CardContent>
                   </Card>
                 </Link>
               )) : (
                 <div className="text-center py-20 bg-white rounded-3xl border-2 border-dashed border-gray-200">
                   <Leaf className="w-12 h-12 mx-auto text-muted-foreground/20 mb-4" />
                   <p className="text-muted-foreground font-medium">You haven't submitted any reports yet.</p>
                   <Button asChild variant="link" className="mt-2">
                     <Link href="/submit">Start your first report</Link>
                   </Button>
                 </div>
               )}
               
               {totalCount > 5 && (
                 <Button asChild variant="ghost" className="w-full text-muted-foreground hover:text-primary py-6 border-2 border-dashed border-gray-100 rounded-2xl">
                   <Link href="/complaints">View All My Activity ({totalCount})</Link>
                 </Button>
               )}
             </div>
          </div>

          <div className="space-y-6">
            <h2 className="text-2xl font-bold px-2">Hero Progress</h2>
            <Card className="border-none shadow-sm rounded-3xl overflow-hidden bg-white">
              <CardContent className="p-6 space-y-6">
                {[
                  { title: 'Temple Guardian', desc: 'Report 10 issues', progress: Math.min((totalCount / 10) * 100, 100), icon: ShieldCheck },
                  { title: 'Cleanup Hero', desc: 'Resolve 5 spots', progress: Math.min((resolvedCount / 5) * 100, 100), icon: Leaf },
                  { title: 'Active Citizen', desc: 'Maintain streak', progress: totalCount > 0 ? 30 : 0, icon: Award },
                ].map((badge, i) => (
                  <div key={i} className="flex gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-secondary flex items-center justify-center shrink-0">
                      <badge.icon className="w-6 h-6 text-primary" />
                    </div>
                    <div className="flex-1 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <h4 className="font-bold text-sm">{badge.title}</h4>
                        <span className="text-[10px] font-bold text-primary">{Math.round(badge.progress)}%</span>
                      </div>
                      <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full bg-primary transition-all duration-1000" style={{ width: `${badge.progress}%` }}></div>
                      </div>
                      <p className="text-[10px] text-muted-foreground">{badge.desc}</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="border-none shadow-lg rounded-3xl overflow-hidden bg-accent text-white">
              <CardContent className="p-6">
                <div className="flex items-center gap-2 mb-3">
                  <Award className="w-5 h-5 text-blue-200" />
                  <h4 className="font-bold">Madurai Pride</h4>
                </div>
                <p className="text-sm opacity-90 leading-relaxed italic">
                  "Every piece of plastic removed from our streets preserves the heritage of our thousand-pillar city."
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
