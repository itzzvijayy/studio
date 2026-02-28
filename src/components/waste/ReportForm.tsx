
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
  const [isCameraLoading, setIsCameraLoading] = useState(false);
  
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
    setIsCameraLoading(false);
  };

  const startCamera = async () => {
    setIsCameraActive(true);
    setIsCameraLoading(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: 'environment',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        } 
      });
      setHasCameraPermission(true);

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          setIsCameraLoading(false);
          videoRef.current?.play().catch(console.error);
        };
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
      setHasCameraPermission(false);
      setIsCameraActive(false);
      setIsCameraLoading(false);
      toast({
        title: "Camera Access Required",
        description: "Please enable camera permissions in your browser settings to report waste.",
        variant: "destructive",
      });
    }
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;

      // Ensure video is ready
      if (video.readyState < 2 || video.videoWidth === 0) {
        toast({
          title: "Camera Warming Up",
          description: "Please wait a second for the lens to focus.",
          variant: "destructive",
        });
        return;
      }

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const context = canvas.getContext('2d');
      if (context) {
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUri = canvas.toDataURL('image/jpeg', 0.85);
        setImage(dataUri);
        stopCamera();
        runAiAnalysis(dataUri);
        handleGetLocation();
        
        toast({
          title: "Photo Captured",
          description: "Vision-AI is now analyzing the site.",
        });
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
          title: "Location Unavailable",
          description: "We couldn't pinpoint your location automatically. Please type it in.",
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
        title: "AI Offline",
        description: "We couldn't analyze the photo automatically, but you can still submit.",
        variant: "destructive"
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!image) return;
    if (!user) {
      toast({ title: "Session Expired", description: "Please sign in again to submit reports.", variant: "destructive" });
      return;
    }

    setIsSubmitting(true);
    try {
      const summaryResult = await aiComplaintSummaryFromText({ complaintText: description || "Waste report" });
      
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
        title: "Madurai Guardian Success",
        description: "Your report has been logged. Together we keep our city sacred.",
      });
      router.push('/complaints');
    } catch (error) {
      console.error('Submission Error:', error);
      toast({
        title: "Communication Error",
        description: "Failed to send report. Check your internet connection.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8 max-w-2xl mx-auto pb-24">
      <div className="space-y-4">
        <h2 className="text-3xl font-extrabold tracking-tight text-primary">Citizen Action</h2>
        <p className="text-muted-foreground text-sm">Snap a photo to help us identify and resolve environmental concerns across the heritage city.</p>
      </div>

      <div className="relative group rounded-[2.5rem] overflow-hidden aspect-video border-8 border-white shadow-2xl bg-muted flex items-center justify-center ring-1 ring-gray-100">
        {image ? (
          <div className="relative h-full w-full">
            <Image src={image} alt="Captured report" fill className="object-cover" />
            <Button 
              type="button" 
              variant="destructive" 
              size="icon" 
              className="absolute top-4 right-4 rounded-full shadow-lg border-2 border-white hover:scale-110 transition-transform"
              onClick={() => { setImage(null); setAiResult(null); }}
            >
              <RefreshCcw className="w-5 h-5" />
            </Button>
          </div>
        ) : isCameraActive ? (
          <div className="relative h-full w-full bg-black">
            <video 
              ref={videoRef} 
              className="w-full h-full object-cover" 
              autoPlay 
              muted 
              playsInline 
            />
            {isCameraLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm">
                <Loader2 className="w-12 h-12 animate-spin text-white" />
              </div>
            )}
            <div className="absolute bottom-8 left-0 right-0 flex justify-center gap-6 px-4">
               <Button 
                type="button" 
                variant="outline" 
                className="rounded-full bg-white/20 text-white border-white/40 backdrop-blur-md hover:bg-white/30"
                onClick={stopCamera}
              >
                Cancel
              </Button>
              <Button 
                type="button" 
                size="icon" 
                disabled={isCameraLoading}
                className="h-20 w-20 rounded-full bg-primary text-white border-[6px] border-white/30 hover:scale-110 transition-transform shadow-2xl active:scale-95"
                onClick={capturePhoto}
              >
                <div className="w-14 h-14 rounded-full border-4 border-white flex items-center justify-center">
                  <div className="w-10 h-10 rounded-full bg-white/20" />
                </div>
              </Button>
            </div>
          </div>
        ) : (
          <div 
            className="text-center p-12 w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-gray-50 via-white to-gray-100 cursor-pointer hover:from-gray-100 hover:to-gray-200 transition-all duration-500 group" 
            onClick={startCamera}
          >
            <div className="w-24 h-24 rounded-3xl bg-primary/10 flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-primary/20 transition-all duration-500 shadow-inner">
              <CameraIcon className="w-12 h-12 text-primary" />
            </div>
            <p className="font-extrabold text-2xl text-primary tracking-tight">Open Citizen Lens</p>
            <p className="text-sm text-muted-foreground mt-2 max-w-[200px] leading-tight">Tap to capture live environmental evidence</p>
          </div>
        )}
      </div>

      <canvas ref={canvasRef} className="hidden" />

      {isAnalyzing && (
        <Card className="border-accent/20 bg-accent/5 animate-pulse rounded-3xl overflow-hidden">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="relative">
              <Sparkles className="w-8 h-8 text-accent animate-bounce" />
              <Loader2 className="w-8 h-8 absolute top-0 left-0 animate-spin opacity-30" />
            </div>
            <div>
              <p className="font-bold text-accent">Vision-AI Initializing Analysis</p>
              <p className="text-xs text-accent/60">Detecting waste patterns and severity...</p>
            </div>
          </CardContent>
        </Card>
      )}

      {aiResult && aiResult.wasteDetected && (
        <Card className="border-none bg-green-50/50 shadow-lg rounded-[2rem] overflow-hidden border border-green-100/50 backdrop-blur-sm">
          <CardContent className="p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-green-500 rounded-xl">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <span className="font-black text-green-700 uppercase tracking-widest text-xs">Vision-AI Verified Report</span>
            </div>
            <div className="flex flex-wrap gap-3 mb-6">
              <Badge variant="outline" className="bg-white/80 border-green-200 text-green-700 font-bold capitalize px-4 py-1.5 rounded-xl shadow-sm">
                Type: {aiResult.wasteType}
              </Badge>
              <Badge className={cn(
                "capitalize border-none px-4 py-1.5 rounded-xl shadow-md font-bold", 
                aiResult.severity === 'critical' ? 'bg-red-600' : 'bg-primary'
              )}>
                {aiResult.severity} Severity
              </Badge>
            </div>
            <div className="bg-white/50 p-4 rounded-2xl border border-green-100">
              <p className="text-sm text-green-900 leading-relaxed font-medium italic">"{aiResult.analysisDetails}"</p>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="space-y-6">
        <div className="space-y-2 px-1">
          <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">Site Location</label>
          <div className="relative">
            <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-primary" />
            <Input 
              placeholder="Landmark, Street, or Temple Tower..." 
              className="h-14 rounded-2xl pl-12 border-gray-200 focus:ring-primary shadow-sm text-lg"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
            />
          </div>
        </div>

        <div className="space-y-2 px-1">
          <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">Additional Observations</label>
          <Textarea 
            placeholder="Help our cleanup crew understand the situation..." 
            className="min-h-[120px] rounded-[1.5rem] p-5 resize-none border-gray-200 focus:ring-primary shadow-sm text-lg"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        <Button 
          type="submit" 
          disabled={isSubmitting || isAnalyzing || !image}
          className="w-full h-16 rounded-[1.5rem] text-xl font-black shadow-2xl hover:scale-[1.02] active:scale-[0.98] transition-all bg-primary hover:bg-primary/90"
        >
          {isSubmitting ? (
            <><Loader2 className="w-6 h-6 mr-3 animate-spin" /> Verifying...</>
          ) : (
            <><Send className="w-6 h-6 mr-3" /> Log Public Report</>
          )}
        </Button>
      </div>
    </form>
  );
}
