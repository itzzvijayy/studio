
"use client";

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Camera, MapPin, X, Loader2, Send, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { aiWasteDetectionAndClassification } from '@/ai/flows/ai-waste-detection-and-classification-flow';
import { aiComplaintSummaryFromText } from '@/ai/flows/ai-complaint-summary-from-text';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { useFirestore, useUser, addDocumentNonBlocking } from '@/firebase';
import { collection } from 'firebase/firestore';

export function ReportForm() {
  const [image, setImage] = useState<string | null>(null);
  const [description, setDescription] = useState('');
  const [address, setAddress] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [aiResult, setAiResult] = useState<any>(null);
  const [location, setLocation] = useState<{lat: number, lng: number} | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const router = useRouter();
  const firestore = useFirestore();
  const { user } = useUser();

  const handleGetLocation = () => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition((position) => {
        const coords = {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        };
        setLocation(coords);
        if (!address || address.includes(',')) {
          setAddress(`${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)}`);
        }
        toast({
          title: "Location Captured",
          description: `Coordinates: ${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)}`,
        });
      }, () => {
        toast({
          title: "Location Error",
          description: "Could not retrieve your current location. Please enter address manually.",
          variant: "destructive",
        });
      });
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const dataUri = reader.result as string;
        setImage(dataUri);
        runAiAnalysis(dataUri);
        handleGetLocation();
      };
      reader.readAsDataURL(file);
    }
  };

  const runAiAnalysis = async (dataUri: string) => {
    setIsAnalyzing(true);
    try {
      const result = await aiWasteDetectionAndClassification({ photoDataUri: dataUri });
      setAiResult(result);
      
      if (result.wasteDetected && result.analysisDetails && !description) {
        setDescription(result.analysisDetails);
      }

      if (!result.wasteDetected) {
        toast({
          title: "No Waste Detected",
          description: "Our AI didn't find clear waste in this image. You can still describe it manually.",
        });
      }
    } catch (error) {
      console.error('AI Analysis Error:', error);
      toast({
        title: "Analysis Failed",
        description: "Vision-AI encountered an error. You can still report manually.",
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!image) {
      toast({ title: "Image Required", description: "Please take or upload a photo of the waste.", variant: "destructive" });
      return;
    }
    if (!address) {
      toast({ title: "Location Required", description: "Please provide a location or address.", variant: "destructive" });
      return;
    }
    if (!description || description.length < 5) {
      toast({ title: "Description Required", description: "Please provide a brief description of the issue.", variant: "destructive" });
      return;
    }
    if (!user) {
      toast({ title: "Session Error", description: "You must be signed in to submit a report.", variant: "destructive" });
      return;
    }

    setIsSubmitting(true);
    try {
      const summaryResult = await aiComplaintSummaryFromText({ complaintText: description });
      
      const newComplaint = {
        userId: user.uid,
        userName: user.displayName || 'Anonymous Citizen',
        imageUrl: image, // Note: In production, images should be uploaded to Storage first.
        location: location ? { ...location, address } : { lat: 0, lng: 0, address },
        description: description,
        aiSummary: summaryResult.summary,
        aiKeyDetails: summaryResult.keyDetails,
        aiAnalysis: {
          wasteDetected: aiResult?.wasteDetected ?? false,
          wasteType: aiResult?.wasteType ?? 'unknown',
          severity: aiResult?.severity ?? 'medium',
          analysisDetails: aiResult?.analysisDetails ?? description,
        },
        status: 'pending',
        createdAt: new Date().toISOString(),
      };

      addDocumentNonBlocking(collection(firestore, 'complaints'), newComplaint);
      
      toast({
        title: "Report Received",
        description: "Thank you for helping keep Madurai clean! We've received your report.",
      });
      router.push('/complaints');
    } catch (error) {
      console.error('Submission Error:', error);
      toast({
        title: "Submission Failed",
        description: "We couldn't process your report right now.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8 max-w-2xl mx-auto pb-10">
      <div className="space-y-4">
        <h2 className="text-2xl font-bold tracking-tight">Report Waste</h2>
        <p className="text-muted-foreground text-sm">Upload a photo and our Vision-AI will identify the waste type and severity for priority cleanup.</p>
      </div>

      <div className="relative">
        {image ? (
          <div className="relative group rounded-3xl overflow-hidden aspect-video border-4 border-white shadow-2xl">
            <Image 
              src={image} 
              alt="Uploaded waste" 
              fill 
              className="object-cover"
            />
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <Button 
                type="button" 
                variant="destructive" 
                size="icon" 
                className="rounded-full h-12 w-12"
                onClick={() => { setImage(null); setAiResult(null); }}
              >
                <X className="w-6 h-6" />
              </Button>
            </div>
          </div>
        ) : (
          <div 
            onClick={() => fileInputRef.current?.click()}
            className="flex flex-col items-center justify-center aspect-video rounded-3xl border-2 border-dashed border-muted-foreground/30 bg-muted/20 hover:bg-muted/30 transition-all cursor-pointer group"
          >
            <div className="p-4 bg-primary text-white rounded-full mb-4 shadow-lg group-hover:scale-110 transition-transform">
              <Camera className="w-8 h-8" />
            </div>
            <p className="font-semibold text-lg">Capture Photo</p>
            <p className="text-sm text-muted-foreground mt-1">Tap to open camera or gallery</p>
          </div>
        )}
        <input 
          type="file" 
          ref={fileInputRef} 
          onChange={handleImageChange} 
          accept="image/*" 
          className="hidden" 
        />
      </div>

      {isAnalyzing && (
        <Card className="border-accent/20 bg-accent/5 animate-pulse rounded-2xl">
          <CardContent className="p-6 flex items-center gap-4">
            <Loader2 className="w-6 h-6 animate-spin text-accent" />
            <div className="space-y-1">
              <p className="font-semibold text-accent">AI Analysis in progress...</p>
              <p className="text-xs text-muted-foreground">Identifying waste and assessing environmental impact</p>
            </div>
          </CardContent>
        </Card>
      )}

      {aiResult && aiResult.wasteDetected && (
        <Card className="border-green-200 bg-green-50 shadow-lg overflow-hidden transition-all duration-500 animate-in slide-in-from-top-4 rounded-2xl">
          <CardContent className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="w-5 h-5 text-green-600" />
              <span className="font-bold text-green-700 uppercase tracking-wider text-xs">Vision-AI Classification</span>
            </div>
            <div className="flex flex-wrap gap-2 mb-4">
              <Badge variant="secondary" className="bg-white text-green-800 border-green-200 py-1 px-3 capitalize">
                {aiResult.wasteType}
              </Badge>
              <Badge 
                className={cn(
                  "py-1 px-3 capitalize border-none",
                  aiResult.severity === 'critical' || aiResult.severity === 'high' 
                    ? "bg-red-500 text-white" 
                    : "bg-blue-500 text-white"
                )}
              >
                Severity: {aiResult.severity}
              </Badge>
            </div>
            <p className="text-sm text-green-900 leading-relaxed italic">
              {aiResult.analysisDetails}
            </p>
          </CardContent>
        </Card>
      )}

      <div className="space-y-6">
        <div className="space-y-2">
          <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Cleanup Site Location</label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input 
                placeholder="e.g. Near Meenakshi Temple, West Tower" 
                className="h-12 rounded-xl pl-10"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
              />
            </div>
            <Button 
              type="button" 
              variant="outline" 
              className="h-12 w-12 rounded-xl p-0 shrink-0 border-muted-foreground/20"
              onClick={handleGetLocation}
            >
              <MapPin className="w-5 h-5" />
            </Button>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Citizen Description</label>
          <Textarea 
            placeholder="Help us understand the situation better..." 
            className="min-h-[120px] rounded-2xl p-4 resize-none"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        <Button 
          type="submit" 
          disabled={isSubmitting || isAnalyzing || !image}
          className="w-full h-14 rounded-2xl text-lg font-bold shadow-lg hover:shadow-xl transition-all"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              Sending Report...
            </>
          ) : (
            <>
              <Send className="w-5 h-5 mr-2" />
              Submit Report
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
