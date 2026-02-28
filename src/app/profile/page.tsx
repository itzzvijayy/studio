
"use client";

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { Settings, Leaf, MapPin, Award, ShieldCheck, ChevronRight, Loader2 } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { useFirestore, useUser, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where, orderBy, limit } from 'firebase/firestore';
import { WasteComplaint } from '@/lib/types';

export default function ProfilePage() {
  const avatarImg = PlaceHolderImages.find(img => img.id === 'avatar-user');
  const { user } = useUser();
  const firestore = useFirestore();

  const userComplaintsQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(
      collection(firestore, 'complaints'),
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc'),
      limit(5)
    );
  }, [firestore, user]);

  const { data: userComplaints, isLoading } = useCollection<WasteComplaint>(userComplaintsQuery);

  const resolvedCount = userComplaints?.filter(c => c.status === 'resolved').length || 0;
  const totalCount = userComplaints?.length || 0;

  return (
    <div className="container px-4 py-8 md:py-12 max-w-4xl">
      <div className="flex flex-col gap-10">
        <div className="relative">
          <div className="h-48 rounded-3xl bg-gradient-to-r from-primary to-accent overflow-hidden">
             <div className="absolute inset-0 opacity-20 pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/leaf.png')]"></div>
          </div>
          <div className="absolute -bottom-8 left-8 flex items-end gap-6">
            <Avatar className="h-32 w-32 border-4 border-white shadow-2xl rounded-3xl">
              <AvatarImage src={avatarImg?.imageUrl} />
              <AvatarFallback className="text-4xl">{user?.displayName?.[0] || 'C'}</AvatarFallback>
            </Avatar>
            <div className="pb-2 text-white md:text-foreground">
               <h1 className="text-3xl font-bold tracking-tight">{user?.displayName || 'Citizen Guardian'}</h1>
               <p className="text-blue-100 md:text-muted-foreground font-medium">Madurai District Hero</p>
            </div>
          </div>
          <div className="absolute -bottom-8 right-8">
             <Button variant="outline" className="rounded-full bg-white shadow-md border-none">
               <Settings className="w-4 h-4 mr-2" /> Edit Profile
             </Button>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
          {[
            { label: 'Reports', value: totalCount.toString(), icon: Leaf, color: 'text-green-600', bg: 'bg-green-50' },
            { label: 'Resolved', value: resolvedCount.toString(), icon: ShieldCheck, color: 'text-blue-600', bg: 'bg-blue-50' },
            { label: 'Impact Score', value: (totalCount * 50).toString(), icon: Award, color: 'text-orange-600', bg: 'bg-orange-50' },
            { label: 'Locations', value: totalCount > 0 ? 'Madurai' : '0', icon: MapPin, color: 'text-purple-600', bg: 'bg-purple-50' },
          ].map((stat, i) => (
            <Card key={i} className="border-none shadow-sm rounded-2xl overflow-hidden">
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
             <h2 className="text-2xl font-bold px-2">Your Recent Activity</h2>
             <div className="space-y-4">
               {isLoading ? (
                 <div className="flex justify-center py-10">
                   <Loader2 className="w-8 h-8 animate-spin text-primary" />
                 </div>
               ) : userComplaints && userComplaints.length > 0 ? userComplaints.map((c) => (
                 <Link key={c.id} href={`/complaints/${c.id}`}>
                   <Card className="hover:shadow-md transition-all border-none shadow-sm mb-4 group cursor-pointer overflow-hidden">
                     <CardContent className="p-4 flex items-center gap-4">
                        <div className="relative h-20 w-20 rounded-xl overflow-hidden shrink-0">
                          <Image src={c.imageUrl} alt={c.aiSummary} fill className="object-cover" />
                        </div>
                        <div className="flex-1 min-w-0">
                           <div className="flex items-center justify-between mb-1">
                             <h4 className="font-bold truncate text-lg group-hover:text-primary transition-colors">{c.aiSummary}</h4>
                             <Badge variant="outline" className="text-[10px] font-bold uppercase">{c.status}</Badge>
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
                 <div className="text-center py-10 bg-white rounded-3xl border-2 border-dashed">
                   <p className="text-muted-foreground">You haven't submitted any complaints yet.</p>
                 </div>
               )}
               <Button asChild variant="ghost" className="w-full text-muted-foreground hover:text-primary">
                 <Link href="/complaints">View All Activity</Link>
               </Button>
             </div>
          </div>

          <div className="space-y-6">
            <h2 className="text-2xl font-bold px-2">Badges</h2>
            <Card className="border-none shadow-sm rounded-3xl overflow-hidden bg-white">
              <CardContent className="p-6 space-y-6">
                {[
                  { title: 'Waste Warrior', desc: 'Reported 10 items', progress: Math.min((totalCount / 10) * 100, 100), icon: ShieldCheck },
                  { title: 'Spotless Scout', desc: 'Help resolved 5 reports', progress: Math.min((resolvedCount / 5) * 100, 100), icon: Leaf },
                  { title: 'Community Pillar', desc: 'Consistent reporter', progress: totalCount > 0 ? 30 : 0, icon: Award },
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
                        <div className="h-full bg-primary" style={{ width: `${badge.progress}%` }}></div>
                      </div>
                      <p className="text-[10px] text-muted-foreground">{badge.desc}</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="border-none shadow-lg rounded-3xl overflow-hidden bg-accent text-white">
              <CardContent className="p-6">
                <h4 className="font-bold mb-2">Madurai Fact</h4>
                <p className="text-sm opacity-90 leading-relaxed">
                  Every report helps our civic teams prioritize the heart of the temple city. Thank you for your service!
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
