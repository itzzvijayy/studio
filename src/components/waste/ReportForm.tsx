
"use client";

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Camera, MapPin, X, Loader2, Send, Sparkles, RefreshCcw, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
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
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const router = useRouter();
  const firestore = useFirestore();
  const { user } = useUser();

  // Handle Camera Permissions and Stream
  useEffect(() => {
    const getCameraPermission = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: { facingMode: 'environment' } // Prefer back camera
        });
        setHasCameraPermission(true);

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (error) {
        console.error('Error accessing camera:', error);
        setHasCameraPermission(false);
      }
    };

    if (!image) {
      getCameraPermission();
    }

    return () => {
      // Cleanup stream on unmount or when image is captured
      if (videoRef.current?.srcObject) {
        const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
        tracks.forEach(track => track.stop());
      }
    };
  }, [image]);

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const context = canvas.getContext('2d');
      if (context) {
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUri = canvas.toDataURL('image/jpeg');
        setImage(dataUri);
        runAiAnalysis(dataUri);
        handleGetLocation();
      }
    }
  };

  const handleGetLocation = () => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition((position) => {
        const coords = {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        };
        setLocation(coords);
        if (!address || /^-?\d+\.\d+,\s*-?\d+\.\d+$/.test(address)) {
          setAddress(`${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)}`);
        }
        toast({
          title: "Location Captured",
          description: `Captured precise coordinates for cleanup.`,
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

  const runAiAnalysis = async (dataUri: string) => {
    setIsAnalyzing(true);
    try {
      const result = await aiWasteDetectionAndClassification({ photoDataUri: dataUri });
      setAiResult(result);
      
      if (result.wasteDetected && result.analysisDetails && !description) {
        setDescription(result.analysisDetails);
      }
    } catch (error) {
      console.error('AI Analysis Error:', error);
      toast({
        title: "Analysis Error",
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
      toast({ title: "Photo Needed", description: "Please take a photo of the waste.", variant: "destructive" });
      return;
    }
    if (!address) {
      toast({ title: "Location Needed", description: "Please provide a location or address.", variant: "destructive" });
      return;
    }
    if (!description || description.length < 5) {
      toast({ title: "Details Needed", description: "Please provide a brief description of the issue.", variant: "destructive" });
      return;
    }
    if (!user) {
      toast({ title: "Not Signed In", description: "Wait a moment while we sign you in...", variant: "destructive" });
      return;
    }

    setIsSubmitting(true);
    try {
      const summaryResult = await aiComplaintSummaryFromText({ complaintText: description });
      
      const newComplaint = {
        userId: user.uid,
        userName: user.displayName || 'Madurai Citizen',
        imageUrl: image,
        location: location ? { ...location, address } : { lat: 0, lng: 0, address },
        description: description,
        aiSummary: summaryResult.summary,
        aiKeyDetails: summaryResult.keyDetails,
        aiAnalysis: {
          wasteDetected: aiResult?.wasteDetected ?? true,
          wasteType: aiResult?.wasteType ?? 'mixed',
          severity: aiResult?.severity ?? 'medium',
          analysisDetails: aiResult?.analysisDetails ?? description,
        },
        status: 'pending',
        createdAt: new Date().toISOString(),
      };

      await addDocumentNonBlocking(collection(firestore, 'complaints'), newComplaint);
      
      toast({
        title: "Report Submitted",
        description: "Your report is live! Thank you for keeping Madurai clean.",
      });
      router.push('/complaints');
    } catch (error) {
      console.error('Submission Error:', error);
      toast({
        title: "Submission Error",
        description: "We couldn't process your report right now. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8 max-w-2xl mx-auto pb-10">
      <div className="space-y-4">
        <h2 className="text-2xl font-bold tracking-tight">Report Cleanup Needed</h2>
        <p className="text-muted-foreground text-sm">Snap a photo of the environmental concern. Our AI will identify waste and coordinate cleanup priority.</p>
      </div>

      <div className="relative group rounded-3xl overflow-hidden aspect-video border-4 border-white shadow-2xl bg-black">
        {image ? (
          <div className="relative h-full w-full">
            <Image 
              src={image} 
              alt="Waste captured" 
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
                <RefreshCcw className="w-6 h-6" />
              </Button>
            </div>
          </div>
        ) : (
          <div className="relative h-full w-full">
            <video 
              ref={videoRef} 
              className="w-full h-full object-cover" 
              autoPlay 
              muted 
              playsInline
            />
            {hasCameraPermission === false && (
              <div className="absolute inset-0 flex items-center justify-center p-6 text-center bg-muted/80 backdrop-blur-sm">
                <div className="space-y-4">
                  <AlertCircle className="w-12 h-12 text-destructive mx-auto" />
                  <p className="font-bold">Camera Access Required</p>
                  <p className="text-sm text-muted-foreground">Please enable camera permissions to report waste directly from your location.</p>
                </div>
              </div>
            )}
            {hasCameraPermission === true && (
              <div className="absolute bottom-6 left-1/2 -translate-x-1/2">
                <Button 
                  type="button" 
                  size="icon" 
                  className="h-16 w-16 rounded-full bg-white text-primary border-4 border-primary/20 hover:scale-110 transition-transform"
                  onClick={capturePhoto}
                >
                  <Camera className="w-8 h-8" />
                </Button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Hidden canvas for capturing frames */}
      <canvas ref={canvasRef} className="hidden" />

      {isAnalyzing && (
        <Card className="border-accent/20 bg-accent/5 animate-pulse rounded-2xl">
          <CardContent className="p-6 flex items-center gap-4">
            <Loader2 className="w-6 h-6 animate-spin text-accent" />
            <div className="space-y-1">
              <p className="font-semibold text-accent">Vision-AI is Analyzing...</p>
              <p className="text-xs text-muted-foreground">Identifying waste types and assessing severity</p>
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
          <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Site Address or Landmarks</label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input 
                placeholder="e.g. Near Meenakshi Temple, Madurai" 
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
            placeholder="Help the cleanup team by describing the situation..." 
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
              Submitting Report...
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
