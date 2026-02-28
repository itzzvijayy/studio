
"use client";

import { useState } from 'react';
import { MOCK_COMPLAINTS } from '@/lib/mock-data';
import { ComplaintCard } from '@/components/waste/ComplaintCard';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Search, Filter, ClipboardList } from 'lucide-react';

export default function ComplaintsListPage() {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredComplaints = MOCK_COMPLAINTS.filter(c => 
    c.aiSummary.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.location.address.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="container px-4 py-8 md:py-12 max-w-7xl">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
        <div className="space-y-2">
          <div className="flex items-center gap-3 text-primary mb-1">
            <ClipboardList className="w-8 h-8" />
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight">Public Reports</h1>
          </div>
          <p className="text-muted-foreground text-lg">Transparent tracking of all reported environmental issues in Madurai.</p>
        </div>

        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input 
            placeholder="Search location or issue..." 
            className="pl-10 h-12 rounded-full border-muted-foreground/20 focus:ring-primary shadow-sm"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

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
            <span>Sort by: Latest</span>
          </div>
        </div>

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
              <p className="text-xl font-medium text-muted-foreground">No reports found matching your search.</p>
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
           {/* Empty state for resolved for now */}
           <div className="text-center py-20 bg-white rounded-3xl">
              <p className="text-muted-foreground italic">No recently resolved issues in this area.</p>
           </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
