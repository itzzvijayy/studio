
import { WasteComplaint } from './types';

export const MOCK_COMPLAINTS: WasteComplaint[] = [
  {
    id: '1',
    userId: 'user-1',
    userName: 'Rajesh Kumar',
    imageUrl: 'https://images.unsplash.com/photo-1611284446314-60a58ac0deb9?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080',
    location: {
      lat: 9.9252,
      lng: 78.1198,
      address: 'Near West Tower, Meenakshi Amman Temple, Madurai',
    },
    description: 'A large pile of plastic bags and water bottles has been left by the temple gate, obstructing the walkway.',
    aiSummary: 'Plastic waste accumulation near Meenakshi Temple West Tower.',
    aiKeyDetails: ['High foot traffic area', 'Predominantly plastic', 'Pilgrim safety concern'],
    aiAnalysis: {
      wasteDetected: true,
      wasteType: 'plastic',
      severity: 'high',
      analysisDetails: 'Significant accumulation of single-use plastics in a heritage zone. Immediate cleanup recommended due to high visitor volume.',
    },
    status: 'pending',
    createdAt: new Date().toISOString(),
  },
  {
    id: '2',
    userId: 'user-2',
    userName: 'Anitha Selvam',
    imageUrl: 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080',
    location: {
      lat: 9.9185,
      lng: 78.1250,
      address: 'Vaigai River Bank, near Albert Victor Bridge, Madurai',
    },
    description: 'Organic waste and household garbage dumped along the river bank, creating a foul smell.',
    aiSummary: 'Illegal dumping along the Vaigai river bank.',
    aiKeyDetails: ['River pollution', 'Organic waste', 'Odor nuisance'],
    aiAnalysis: {
      wasteDetected: true,
      wasteType: 'organic',
      severity: 'critical',
      analysisDetails: 'Decaying organic matter on the river bank poses environmental risks to the Vaigai ecosystem and health risks to nearby residents.',
    },
    status: 'in-progress',
    createdAt: new Date(Date.now() - 86400000).toISOString(),
  }
];
