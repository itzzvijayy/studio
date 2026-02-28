
"use client";

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Camera, MapPin, X, Loader2, Send, Sparkles, RefreshCcw, AlertCircle, CameraIcon } from 'lucide-react';
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
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [description, setDescription] = useState('');
  const [address, setAddress] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [aiResult, setAiResult] = useState<any>(null);
  const [location, setLocation] = useState<{lat: number, lng: number} | null>(null);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { toast } = useToast();
  const router = useRouter();
  const firestore = useFirestore();
  const { user } = useUser();

  const stopCamera = () => {
    if (videoRef.current?.srcObject) {
      const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
      tracks.forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
  };

  const startCamera = async () => {
    setIsCameraActive(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
      });
      setHasCameraPermission(true);

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
      setHasCameraPermission(false);
      setIsCameraActive(false);
      toast({
        title: "Camera Error",
        description: "Please enable camera permissions in your browser settings.",
        variant: "destructive",
      });
    }
  };

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
        stopCamera();
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
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!image) return;
    if (!user) {
      toast({ title: "Session Initializing", description: "Wait a moment while we secure your session...", variant: "destructive" });
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
        description: "Thank you! Your report has been added to the public feed.",
      });
      router.push('/complaints');
    } catch (error) {
      console.error('Submission Error:', error);
      toast({
        title: "Submission Error",
        description: "We couldn't process your report. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8 max-w-2xl mx-auto pb-20">
      <div className="space-y-4">
        <h2 className="text-3xl font-bold tracking-tight">Citizen Report</h2>
        <p className="text-muted-foreground text-sm">Tap the camera icon to capture waste or environmental concerns in your area.</p>
      </div>

      <div className="relative group rounded-3xl overflow-hidden aspect-video border-4 border-white shadow-2xl bg-muted flex items-center justify-center">
        {image ? (
          <div className="relative h-full w-full">
            <Image src={image} alt="Captured report" fill className="object-cover" />
            <Button 
              type="button" 
              variant="destructive" 
              size="icon" 
              className="absolute top-4 right-4 rounded-full shadow-lg"
              onClick={() => { setImage(null); setAiResult(null); }}
            >
              <RefreshCcw className="w-5 h-5" />
            </Button>
          </div>
        ) : isCameraActive ? (
          <div className="relative h-full w-full bg-black">
            <video ref={videoRef} className="w-full h-full object-cover" autoPlay muted playsInline />
            <div className="absolute bottom-6 left-0 right-0 flex justify-center gap-4 px-4">
               <Button 
                type="button" 
                variant="outline" 
                className="rounded-full bg-white/20 text-white border-white/40 backdrop-blur-md"
                onClick={stopCamera}
              >
                Cancel
              </Button>
              <Button 
                type="button" 
                size="icon" 
                className="h-16 w-16 rounded-full bg-primary text-white border-4 border-white/20 hover:scale-110 transition-transform"
                onClick={capturePhoto}
              >
                <Camera className="w-8 h-8" />
              </Button>
            </div>
          </div>
        ) : (
          <div className="text-center p-12 w-full h-full flex flex-col items-center justify-center bg-gradient-to-b from-gray-50 to-gray-100 cursor-pointer hover:from-gray-100 hover:to-gray-200 transition-colors" onClick={startCamera}>
            <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <CameraIcon className="w-10 h-10 text-primary" />
            </div>
            <p className="font-bold text-lg text-primary">Open Camera</p>
            <p className="text-xs text-muted-foreground mt-1">Tap to snap a live photo</p>
          </div>
        )}
      </div>

      <canvas ref={canvasRef} className="hidden" />

      {isAnalyzing && (
        <Card className="border-accent/20 bg-accent/5 animate-pulse rounded-2xl">
          <CardContent className="p-6 flex items-center gap-4">
            <Loader2 className="w-6 h-6 animate-spin text-accent" />
            <p className="font-semibold text-accent">Vision-AI analyzing the site...</p>
          </CardContent>
        </Card>
      )}

      {aiResult && aiResult.wasteDetected && (
        <Card className="border-none bg-green-50 shadow-sm rounded-2xl overflow-hidden border border-green-100">
          <CardContent className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="w-4 h-4 text-green-600" />
              <span className="font-bold text-green-700 uppercase tracking-wider text-[10px]">AI Assessment</span>
            </div>
            <div className="flex flex-wrap gap-2 mb-4">
              <Badge variant="outline" className="bg-white capitalize">{aiResult.wasteType}</Badge>
              <Badge className={cn("capitalize border-none", aiResult.severity === 'critical' ? 'bg-red-500' : 'bg-blue-500')}>
                {aiResult.severity} Urgency
              </Badge>
            </div>
            <p className="text-sm text-green-900 leading-relaxed italic">{aiResult.analysisDetails}</p>
          </CardContent>
        </Card>
      )}

      <div className="space-y-6">
        <div className="space-y-2">
          <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1">Location Details</label>
          <div className="relative">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              placeholder="Landmark or street name..." 
              className="h-12 rounded-xl pl-10"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1">Additional Notes</label>
          <Textarea 
            placeholder="Describe any specifics for the cleanup crew..." 
            className="min-h-[100px] rounded-2xl p-4 resize-none"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        <Button 
          type="submit" 
          disabled={isSubmitting || isAnalyzing || !image}
          className="w-full h-14 rounded-2xl text-lg font-bold shadow-lg"
        >
          {isSubmitting ? <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Submitting...</> : <><Send className="w-5 h-5 mr-2" /> Send Report</>}
        </Button>
      </div>
    </form>
  );
}
