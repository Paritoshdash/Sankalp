'use client';

import { useState, FormEvent, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from '@/components/ui/use-toast';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Trophy, ArrowLeft, ArrowRight, Loader2 } from 'lucide-react';

export default function AchievementsPage() {
  const { toast } = useToast();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    const user = localStorage.getItem('currentUser');
    if (user) {
      setCurrentUser(JSON.parse(user));
    } else {
      router.push('/login');
    }
  }, [router]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    
    if (!currentUser) {
      toast({ title: "Error", description: "You must be logged in to submit achievements.", variant: "destructive" });
      return;
    }

    setIsSubmitting(true);
    const formData = new FormData(event.currentTarget);
    formData.append('userId', currentUser.id);

    try {
      const response = await fetch('/api/user/achievements', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Submission failed.');
      }
      
      toast({
        title: "Success! 🎉",
        description: "Your achievements have been saved.",
      });
      
      router.push('/fitness-details');

    } catch (error: any) {
      toast({
        title: "Submission Error",
        description: error.message || "An error occurred.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputStyles = "bg-black/20 border-white/20 text-[#FAF9F6] focus:ring-[#DDD92A] focus:border-[#DDD92A]";

  return (
    <div className="min-h-screen bg-[#013a63]">
      <div className="bg-[#013a63]/80 backdrop-blur-sm border-b border-white/10 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center space-x-2 text-[#EAE151] hover:text-[#DDD92A]">
              <ArrowLeft className="h-5 w-5" />
              <span>Back to Home</span>
            </Link>
            <div className="flex items-center space-x-2">
              <Trophy className="h-6 w-6 text-[#DDD92A]" />
              <span className="font-bold text-[#FAF9F6]">Team Sankalp</span>
            </div>
          </div>
        </div>
      </div>
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center space-y-4 mb-12">
            <h1 className="text-4xl sm:text-5xl font-bold text-[#FAF9F6]">Showcase Your <span className="text-[#DDD92A] block">Achievements</span></h1>
            <p className="text-xl text-[#EEEFA8] max-w-3xl mx-auto">Upload your certificates and share experiences to build a strong profile.</p>
        </div>

        <Card className="w-full max-w-2xl mx-auto bg-[#014f86] border-white/10 text-[#FAF9F6]">
          <form onSubmit={handleSubmit}>
            <CardHeader>
              <CardTitle>Add Your Accomplishments</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="certificate" className="text-[#EEEFA8]">Upload Certificate</Label>
                <Input id="certificate" name="certificate" type="file" required className={`${inputStyles} file:text-[#EEEFA8]`} />
                <p className="text-sm text-white/60">Supported formats: PDF, PNG, JPG.</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="level" className="text-[#EEEFA8]">Achievement Level</Label>
                <Select name="level" required>
                  <SelectTrigger id="level" className={inputStyles}>
                    <SelectValue placeholder="Select the level of achievement" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#014f86] border-white/10 text-[#FAF9F6]">
                    <SelectItem value="district" className="focus:bg-black/20">State</SelectItem>
                    <SelectItem value="state" className="focus:bg-black/20">District</SelectItem>
                    <SelectItem value="national" className="focus:bg-black/20">University</SelectItem>
                    <SelectItem value="international" className="focus:bg-black/20">College</SelectItem>
                    <SelectItem value="other" className="focus:bg-black/20">School</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="experience" className="text-[#EEEFA8]">Game Experience</Label>
                <Textarea id="experience" name="experience" placeholder="Describe your experience, e.g., 'Played nationals twice...'" className={inputStyles} required />
              </div>
            </CardContent>
            <CardFooter className="flex flex-col gap-4">
              <Button type="submit" className="w-full bg-[#DDD92A] hover:bg-[#c8c426] text-[#11486b] font-semibold" disabled={isSubmitting}>
                {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save & Continue'}
                {!isSubmitting && <ArrowRight className="h-4 w-4 ml-2" />}
              </Button>
              <Button variant="link" asChild className="text-[#EEEFA8] hover:text-[#DDD92A]">
                 <Link href="/fitness-details">Skip for now</Link>
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
}