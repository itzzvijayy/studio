"use client";

import { useState } from 'react';
import { ComplaintCard } from '@/components/waste/ComplaintCard';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Search, Filter, ClipboardList, Loader2, AlertCircle, RefreshCw } from 'lucide-react';
import { useFirestore, useUser, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy } from 'firebase/firestore';
import { WasteComplaint } from '@/lib/types';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';

export default function ComplaintsListPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();

  // We only start the query if the user is authenticated (including anonymous)
  // to satisfy the security rules 'request.auth != null'
  const complaintsQuery = useMemoFirebase(() => {
    // Ensure both firestore and user are initialized before querying
    if (!firestore || !user) return null;
    
    return query(
      collection(firestore, 'complaints'),
      orderBy('createdAt', 'desc')
    );
  }, [firestore, user]);

  const { data: complaints, isLoading, error } = useCollection<WasteComplaint>(complaintsQuery);

  const filteredComplaints = (complaints || []).filter(c => {
    const search = searchQuery.toLowerCase();
    const summary = (c.aiSummary || '').toLowerCase();
    const address = (c.location?.address || '').toLowerCase();
    const desc = (c.description || '').toLowerCase();
    return summary.includes(search) || address.includes(search) || desc.includes(search);
  });

  return (
    <div className="container px-4 py-8 md:py-12 max-w-7xl">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
        <div className="space-y-2">
          <div className="flex items-center gap-3 text-primary mb-1">
            <ClipboardList className="w-8 h-8" />
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight">Madurai Public Reports</h1>
          </div>
          <p className="text-muted-foreground text-lg">Real-time environmental monitoring across the heritage city.</p>
        </div>

        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input 
            placeholder="Search streets or landmarks..." 
            className="pl-10 h-12 rounded-full border-muted-foreground/20 focus:ring-primary shadow-sm"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {error && !isUserLoading && (
        <Alert variant="destructive" className="mb-8 rounded-2xl border-destructive/50 bg-destructive/5">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Establishing Secure Session</AlertTitle>
          <AlertDescription className="flex flex-col gap-3">
            <p>The system is initializing your secure citizen credentials. This usually takes just a moment.</p>
            <Button 
              variant="outline" 
              size="sm" 
              className="w-fit gap-2 rounded-full border-destructive/20 hover:bg-destructive/10"
              onClick={() => window.location.reload()}
            >
              <RefreshCw className="w-3 h-3" /> Retry Connection
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {!user && !isUserLoading && !error && (
        <Alert className="mb-8 rounded-2xl border-primary/20 bg-primary/5">
          <Loader2 className="h-4 w-4 animate-spin text-primary" />
          <AlertTitle>Initializing Citizen Access</AlertTitle>
          <AlertDescription>
            Preparing your secure workspace for Madurai city monitoring...
          </AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="all" className="space-y-8">
        <div className="flex items-center justify-between border-b pb-1 overflow-x-auto no-scrollbar">
          <TabsList className="bg-transparent border-none p-0 h-auto gap-8">
            <TabsTrigger value="all" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-0 pb-3 font-bold text-base transition-all">All Reports</TabsTrigger>
            <TabsTrigger value="pending" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-0 pb-3 font-bold text-base transition-all">Pending</TabsTrigger>
            <TabsTrigger value="in-progress" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-0 pb-3 font-bold text-base transition-all">Action Taken</TabsTrigger>
            <TabsTrigger value="resolved" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-0 pb-3 font-bold text-base transition-all">Resolved</TabsTrigger>
          </TabsList>
          
          <div className="hidden md:flex items-center gap-2 text-sm text-muted-foreground">
            <Filter className="w-4 h-4" />
            <span>Sort by: Latest Reports</span>
          </div>
        </div>

        {(isLoading || isUserLoading) ? (
          <div className="flex justify-center py-20">
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="w-10 h-10 animate-spin text-primary" />
              <p className="text-sm font-medium text-muted-foreground">Loading public feed...</p>
            </div>
          </div>
        ) : (
          <>
            <TabsContent value="all" className="m-0">
              {filteredComplaints.length > 0 ? (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
                  {filteredComplaints.map((complaint) => (
                    <ComplaintCard key={complaint.id} complaint={complaint} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-20 bg-white rounded-3xl border-2 border-dashed border-muted-foreground/20">
                  <Search className="w-12 h-12 mx-auto text-muted-foreground mb-4 opacity-20" />
                  <p className="text-xl font-medium text-muted-foreground">No reports found for this view.</p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="pending" className="m-0">
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
                {filteredComplaints.filter(c => c.status === 'pending').map((complaint) => (
                  <ComplaintCard key={complaint.id} complaint={complaint} />
                ))}
              </div>
            </TabsContent>

            <TabsContent value="in-progress" className="m-0">
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
                {filteredComplaints.filter(c => c.status === 'in-progress').map((complaint) => (
                  <ComplaintCard key={complaint.id} complaint={complaint} />
                ))}
              </div>
            </TabsContent>

            <TabsContent value="resolved" className="m-0">
               <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
                {filteredComplaints.filter(c => c.status === 'resolved').map((complaint) => (
                  <ComplaintCard key={complaint.id} complaint={complaint} />
                ))}
              </div>
            </TabsContent>
          </>
        )}
      </Tabs>
    </div>
  );
}