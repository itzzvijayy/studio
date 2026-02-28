
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Leaf, Camera, CheckCircle, BarChart3, ArrowRight } from 'lucide-react';
import Image from 'next/image';
import { PlaceHolderImages } from '@/lib/placeholder-images';

export default function LandingPage() {
  const heroImg = PlaceHolderImages.find(img => img.id === 'hero-bg');

  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="relative h-[85vh] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <Image
            src={heroImg?.imageUrl || 'https://picsum.photos/seed/madurai/1200/800'}
            alt="Beautiful Madurai Landscape"
            fill
            className="object-cover brightness-50"
            data-ai-hint="green park"
          />
        </div>
        
        <div className="relative z-10 max-w-4xl px-6 text-center text-white">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 mb-6">
            <Leaf className="w-4 h-4 text-green-400" />
            <span className="text-sm font-medium">Eco-friendly Madurai</span>
          </div>
          <h1 className="text-4xl md:text-7xl font-bold mb-6 tracking-tight leading-[1.1]">
            Clean Madurai, <br />
            <span className="text-green-400">AI-Powered</span> Cleanup
          </h1>
          <p className="text-lg md:text-xl text-gray-200 mb-10 max-w-2xl mx-auto leading-relaxed">
            Report environmental concerns instantly. Our Vision-AI automatically identifies waste types and severity to prioritize city cleanup.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg" className="h-14 px-8 text-lg rounded-full shadow-xl hover:shadow-2xl transition-all">
              <Link href="/submit">
                Submit a Complaint <ArrowRight className="ml-2 w-5 h-5" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="h-14 px-8 text-lg rounded-full bg-white/10 backdrop-blur-md text-white border-white/30 hover:bg-white/20">
              <Link href="/complaints">Track Status</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold text-gray-900 mb-4">How it works</h2>
            <p className="text-muted-foreground text-lg">Four simple steps to a cleaner community.</p>
          </div>

          <div className="grid md:grid-cols-4 gap-8">
            {[
              { 
                icon: Camera, 
                title: 'Capture', 
                desc: 'Take a photo of the waste site with your phone.',
                color: 'bg-green-100 text-green-700'
              },
              { 
                icon: Leaf, 
                title: 'AI Analysis', 
                desc: 'Our AI classifies the waste type and severity instantly.',
                color: 'bg-blue-100 text-blue-700'
              },
              { 
                icon: BarChart3, 
                title: 'Prioritize', 
                desc: 'The city council receives reports ranked by urgency.',
                color: 'bg-indigo-100 text-indigo-700'
              },
              { 
                icon: CheckCircle, 
                title: 'Resolve', 
                desc: 'Track the cleanup progress in real-time until resolved.',
                color: 'bg-emerald-100 text-emerald-700'
              },
            ].map((feature, i) => (
              <div key={i} className="group p-8 rounded-2xl border border-gray-100 bg-gray-50/50 hover:bg-white hover:shadow-xl transition-all">
                <div className={`w-14 h-14 rounded-xl flex items-center justify-center mb-6 transition-transform group-hover:scale-110 ${feature.color}`}>
                  <feature.icon className="w-7 h-7" />
                </div>
                <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Impact Stats */}
      <section className="py-20 bg-primary text-white">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-12">
            {[
              { label: 'Complaints Resolved', value: '1,240+' },
              { label: 'Citizens Reporting', value: '5,000+' },
              { label: 'Tons Cleaned', value: '120' },
              { label: 'AI Accuracy', value: '98%' },
            ].map((stat, i) => (
              <div key={i}>
                <div className="text-4xl md:text-5xl font-bold mb-2">{stat.value}</div>
                <div className="text-green-200 font-medium">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-background">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <div className="bg-white p-12 rounded-3xl shadow-2xl border border-gray-100">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">Ready to make a difference?</h2>
            <p className="text-lg text-muted-foreground mb-10">
              Join thousands of Madurai residents dedicated to preserving our city's heritage and environment.
            </p>
            <Button asChild size="lg" className="h-14 px-10 rounded-full text-lg shadow-lg">
              <Link href="/submit">Start Your First Report</Link>
            </Button>
          </div>
        </div>
      </section>

      <footer className="py-12 bg-white border-t border-gray-100">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6 text-muted-foreground">
          <div className="flex items-center gap-2">
             <Leaf className="w-5 h-5 text-primary" />
             <span className="font-bold text-primary">Vision-AI Clean Madurai</span>
          </div>
          <p>© 2024 Madurai City Council. Empowering Citizens through AI.</p>
          <div className="flex gap-6">
            <Link href="#" className="hover:text-primary">Privacy Policy</Link>
            <Link href="#" className="hover:text-primary">Terms of Service</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
