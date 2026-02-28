
"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Camera, ClipboardList, User, MapPin, Leaf } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

export function Navbar() {
  const pathname = usePathname();

  const navItems = [
    { label: 'Submit', href: '/submit', icon: Camera },
    { label: 'Complaints', href: '/complaints', icon: ClipboardList },
    { label: 'Profile', href: '/profile', icon: User },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t md:top-0 md:bottom-auto md:border-t-0 md:border-b shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="bg-primary p-1.5 rounded-lg text-white group-hover:scale-110 transition-transform">
              <Leaf className="w-6 h-6" />
            </div>
            <span className="hidden sm:block font-headline text-xl font-bold text-primary tracking-tight">
              Vision-AI Clean Madurai
            </span>
          </Link>

          <div className="flex flex-1 justify-around md:justify-end md:gap-4 lg:gap-8">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex flex-col md:flex-row items-center gap-1 md:gap-2 px-3 py-2 text-sm font-medium transition-colors",
                    isActive 
                      ? "text-primary md:bg-secondary md:rounded-full" 
                      : "text-muted-foreground hover:text-primary"
                  )}
                >
                  <Icon className="w-5 h-5" />
                  <span className="text-[10px] md:text-sm font-semibold uppercase md:capitalize tracking-wider md:tracking-normal">
                    {item.label}
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </nav>
  );
}
