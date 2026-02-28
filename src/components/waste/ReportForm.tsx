
"use client";

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Camera, Upload, MapPin, X, Loader2, Send, AlertTriangle, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { aiWasteDetectionAndClassification } from '@/ai/flows/ai-waste-detection-and-classification-flow';
import { aiComplaintSummaryFromText } from '@/ai/flows/ai-complaint-summary-from-text';
import Image from 'next/image';

export function ReportForm() {
  const [image, setImage] = useState<string | null>(null);
  const [description, setDescription] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [aiResult, setAiResult] = useState<any>(null);
  const [location, setLocation] = useState<{lat: number, lng: number} | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const router = useRouter();

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result as string);
        runAiAnalysis(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const runAiAnalysis = async (dataUri: string) => {
    setIsAnalyzing(true);
    try {
      const result = await aiWasteDetectionAndClassification({ photoDataUri: dataUri });
      setAiResult(result);
      if (!result.wasteDetected) {
        toast({
          title: "No Waste Detected",
          description: "Our AI didn't find clear waste in this image. Please ensure the waste is clearly visible.",
        });
      }
    } catch (error) {
      console.error(error);
      toast({
        title: "Analysis Failed",
        description: "There was an error analyzing the image. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleGetLocation = () => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition((position) => {
        setLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude
        });
        toast({
          title: "Location Captured",
          description: `Coordinates: ${position.coords.latitude.toFixed(4)}, ${position.coords.longitude.toFixed(4)}`,
        });
      }, () => {
        toast({
          title: "Location Error",
          description: "Could not retrieve your current location.",
          variant: "destructive",
        });
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!image || !description) {
      toast({
        title: "Missing Information",
        description: "Please provide both an image and a description.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      // Summarize with AI before saving
      const summaryResult = await aiComplaintSummaryFromText({ complaintText: description });
      
      // In a real app, we'd send to a database here
      // For this demo, we'll simulate a successful submission
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      toast({
        title: "Complaint Submitted",
        description: "Thank you for helping keep Madurai clean! Your report is being processed.",
      });
      router.push('/complaints');
    } catch (error) {
      toast({
        title: "Submission Error",
        description: "Failed to submit complaint. Please try again later.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8 max-w-2xl mx-auto">
      <div className="space-y-4">
        <h2 className="text-2xl font-bold tracking-tight">Report Waste</h2>
        <p className="text-muted-foreground">Upload a photo and describe the issue. Our Vision-AI will handle the classification.</p>
      </div>

      {/* Image Upload Area */}
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
            <p className="font-semibold text-lg">Tap to take photo</p>
            <p className="text-sm text-muted-foreground mt-1">or click to upload from gallery</p>
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

      {/* AI Analysis Result Card */}
      {isAnalyzing && (
        <Card className="border-accent/20 bg-accent/5 animate-pulse">
          <CardContent className="p-6 flex items-center gap-4">
            <Loader2 className="w-6 h-6 animate-spin text-accent" />
            <div className="space-y-1">
              <p className="font-semibold text-accent">AI Analysis in progress...</p>
              <p className="text-xs text-muted-foreground">Classifying waste type and assessing severity</p>
            </div>
          </CardContent>
        </Card>
      )}

      {aiResult && aiResult.wasteDetected && (
        <Card className="border-green-200 bg-green-50 shadow-lg overflow-hidden transition-all duration-500 animate-in slide-in-from-top-4">
          <CardContent className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="w-5 h-5 text-green-600" />
              <span className="font-bold text-green-700 uppercase tracking-wider text-xs">AI Vision Insights</span>
            </div>
            <div className="flex flex-wrap gap-2 mb-4">
              <Badge variant="secondary" className="bg-green-100 text-green-800 border-green-200 py-1 px-3">
                {aiResult.wasteType}
              </Badge>
              <Badge 
                className={cn(
                  "py-1 px-3",
                  aiResult.severity === 'critical' || aiResult.severity === 'high' 
                    ? "bg-red-100 text-red-800 hover:bg-red-100" 
                    : "bg-blue-100 text-blue-800 hover:bg-blue-100"
                )}
              >
                Severity: {aiResult.severity}
              </Badge>
            </div>
            <p className="text-sm text-green-900 leading-relaxed italic">
              &quot;{aiResult.analysisDetails}&quot;
            </p>
          </CardContent>
        </Card>
      )}

      <div className="space-y-6">
        <div className="space-y-2">
          <label className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Location</label>
          <div className="flex gap-2">
            <Input 
              placeholder="e.g. Near Meenakshi Temple, West Tower" 
              className="h-12 rounded-xl"
              value={location ? `${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}` : ''}
              readOnly={!!location}
            />
            <Button 
              type="button" 
              variant="outline" 
              className="h-12 w-12 rounded-xl p-0 shrink-0"
              onClick={handleGetLocation}
            >
              <MapPin className="w-5 h-5" />
            </Button>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Description</label>
          <Textarea 
            placeholder="Tell us more about the waste problem... (location hints, type, size)" 
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
              Submitting...
            </>
          ) : (
            <>
              <Send className="w-5 h-5 mr-2" />
              Report Concern
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
