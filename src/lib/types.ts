
export type WasteType = 'plastic' | 'organic' | 'electronic' | 'glass' | 'paper' | 'metal' | 'textile' | 'hazardous' | 'mixed' | 'unknown';
export type Severity = 'low' | 'medium' | 'high' | 'critical';
export type ComplaintStatus = 'pending' | 'in-progress' | 'resolved';

export interface WasteComplaint {
  id: string;
  userId: string;
  userName: string;
  imageUrl: string;
  location: {
    lat: number;
    lng: number;
    address: string;
  };
  description: string;
  aiSummary: string;
  aiKeyDetails: string[];
  aiAnalysis: {
    wasteDetected: boolean;
    wasteType?: WasteType;
    severity?: Severity;
    analysisDetails: string;
  };
  status: ComplaintStatus;
  createdAt: string;
}
