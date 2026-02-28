
"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useAuth, useUser, useFirestore, initiateEmailSignIn, initiateEmailSignUp } from '@/firebase';
import { Loader2, Mail, Lock, User, Leaf, Phone, Briefcase, UserCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { doc, setDoc } from 'firebase/firestore';
import { UserRole } from '@/lib/types';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<UserRole>('citizen');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const auth = useAuth();
  const firestore = useFirestore();
  const { user } = useUser();
  const router = useRouter();
  const { toast } = useToast();

  if (user && !user.isAnonymous) {
    router.push('/profile');
    return null;
  }

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    initiateEmailSignIn(auth, email, password)
      .then(() => {
        router.push('/profile');
      })
      .catch((error: any) => {
        setIsSubmitting(false);
        let message = "Could not sign you in. Please check your credentials.";
        if (error.code === 'auth/invalid-credential') {
          message = "Invalid email or password. Please try again.";
        }
        
        toast({
          title: "Login Failed",
          description: message,
          variant: "destructive",
        });
      });
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const userCredential = await initiateEmailSignUp(auth, email, password);
      const newUser = userCredential.user;

      // Create the user profile document in Firestore
      const userRef = doc(firestore, 'users', newUser.uid);
      await setDoc(userRef, {
        id: newUser.uid,
        name: name,
        email: email,
        contactNumber: phone,
        role: role,
        registeredDateTime: new Date().toISOString(),
      });

      toast({
        title: "Account Created",
        description: `Welcome, ${role === 'worker' ? 'Cleanup Guardian' : 'Madurai Citizen'}!`,
      });
      router.push('/profile');
    } catch (error: any) {
      setIsSubmitting(false);
      let message = "We couldn't create your account. Please try again.";
      if (error.code === 'auth/email-already-in-use') {
        message = "This email is already registered.";
      }

      toast({
        title: "Sign Up Failed",
        description: message,
        variant: "destructive",
      });
    }
  };

  return (
    <div className="container min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary text-white mb-4 shadow-xl">
            <Leaf className="w-10 h-10" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight">Citizen & Worker Portal</h1>
          <p className="text-muted-foreground">Join the movement for a cleaner, greener Madurai.</p>
        </div>

        <Card className="border-none shadow-2xl rounded-3xl overflow-hidden bg-white/80 backdrop-blur-sm">
          <CardContent className="p-0">
            <Tabs defaultValue="login" className="w-full">
              <TabsList className="w-full grid grid-cols-2 h-14 bg-muted/50 rounded-none border-b">
                <TabsTrigger value="login" className="data-[state=active]:bg-white data-[state=active]:shadow-none font-bold">Login</TabsTrigger>
                <TabsTrigger value="signup" className="data-[state=active]:bg-white data-[state=active]:shadow-none font-bold">Join Us</TabsTrigger>
              </TabsList>

              <TabsContent value="login" className="p-8 mt-0">
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input 
                        id="email" 
                        type="email" 
                        placeholder="citizen@madurai.in" 
                        className="pl-10 h-12 rounded-xl"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input 
                        id="password" 
                        type="password" 
                        placeholder="••••••••" 
                        className="pl-10 h-12 rounded-xl"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                  <Button type="submit" className="w-full h-12 rounded-xl text-lg font-bold mt-2" disabled={isSubmitting}>
                    {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : "Sign In"}
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="signup" className="p-8 mt-0">
                <form onSubmit={handleSignUp} className="space-y-4">
                  <div className="space-y-4 mb-4">
                    <Label>Join as a...</Label>
                    <RadioGroup 
                      defaultValue="citizen" 
                      value={role} 
                      onValueChange={(v) => setRole(v as UserRole)}
                      className="grid grid-cols-2 gap-4"
                    >
                      <div>
                        <RadioGroupItem value="citizen" id="r-citizen" className="peer sr-only" />
                        <Label
                          htmlFor="r-citizen"
                          className="flex flex-col items-center justify-between rounded-xl border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                        >
                          <UserCircle className="mb-2 h-6 w-6" />
                          <span className="text-xs font-bold uppercase">Citizen</span>
                        </Label>
                      </div>
                      <div>
                        <RadioGroupItem value="worker" id="r-worker" className="peer sr-only" />
                        <Label
                          htmlFor="r-worker"
                          className="flex flex-col items-center justify-between rounded-xl border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                        >
                          <Briefcase className="mb-2 h-6 w-6" />
                          <span className="text-xs font-bold uppercase">Worker</span>
                        </Label>
                      </div>
                    </RadioGroup>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="signup-name">Full Name</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input 
                        id="signup-name" 
                        type="text" 
                        placeholder="Meenakshi Sundaram" 
                        className="pl-10 h-12 rounded-xl"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-phone">Contact Number</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input 
                        id="signup-phone" 
                        type="tel" 
                        placeholder="Phone number" 
                        className="pl-10 h-12 rounded-xl"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-email">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input 
                        id="signup-email" 
                        type="email" 
                        placeholder="citizen@madurai.in" 
                        className="pl-10 h-12 rounded-xl"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-password">Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input 
                        id="signup-password" 
                        type="password" 
                        placeholder="••••••••" 
                        className="pl-10 h-12 rounded-xl"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                  <Button type="submit" className="w-full h-12 rounded-xl text-lg font-bold mt-2" disabled={isSubmitting}>
                    {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : "Create Account"}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        <p className="text-center text-sm text-muted-foreground">
          By signing up, you agree to protect Madurai's heritage.
        </p>
      </div>
    </div>
  );
}
