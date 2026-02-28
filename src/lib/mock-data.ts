
import { WasteComplaint } from './types';

export const MOCK_COMPLAINTS: WasteComplaint[] = [
  {
    id: '1',
    userId: 'user-1',
    userName: 'Rajesh Kumar',
    imageUrl: 'https://picsum.photos/seed/waste-1/600/400',
    location: {
      lat: 9.9252,
      lng: 78.1198,
      address: 'Meenakshi Amman Temple Area, Madurai',
    },
    description: 'Large pile of plastic bottles and bags discarded near the entrance.',
    aiSummary: 'Plastic waste accumulation near religious landmark.',
    aiKeyDetails: ['High foot traffic area', 'Predominantly plastic', 'Public health concern'],
    aiAnalysis: {
      wasteDetected: true,
      wasteType: 'plastic',
      severity: 'medium',
      analysisDetails: 'The image shows a significant accumulation of single-use plastics. Given the proximity to a major landmark, the environmental and visual impact is notable.',
    },
    status: 'pending',
    createdAt: '2023-11-20T10:30:00Z',
  },
  {
    id: '2',
    userId: 'user-2',
    userName: 'Anitha S.',
    imageUrl: 'https://picsum.photos/seed/waste-2/600/400',
    location: {
      lat: 9.9167,
      lng: 78.1214,
      address: 'Madurai Junction Railway Station',
    },
    description: 'Overflowing dustbins and scattered food waste around the platform edges.',
    aiSummary: 'Sanitation issue at transport hub.',
    aiKeyDetails: ['Organic waste', 'Overflowing bins', 'Pest risk'],
    aiAnalysis: {
      wasteDetected: true,
      wasteType: 'organic',
      severity: 'high',
      analysisDetails: 'Severe organic waste overflow. This poses an immediate hygiene risk and attracts pests in a high-density transit area.',
    },
    status: 'in-progress',
    createdAt: '2023-11-21T08:15:00Z',
  }
];
