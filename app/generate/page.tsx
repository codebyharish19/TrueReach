"use client";

import { useState } from 'react';
import { Copy, CheckCircle, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';

interface GeneratedEmail {
  email: string;
  pattern: string;
}

export default function GeneratePage() {
  const [firstName, setFirstName] = useState('');
  const [middleName, setMiddleName] = useState('');
  const [lastName, setLastName] = useState('');
  const [domain, setDomain] = useState('');
  const [generatedEmails, setGeneratedEmails] = useState<GeneratedEmail[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();

  const generateEmails = () => {
    if (!firstName || !lastName || !domain) {
      toast({
        title: "Missing Information",
        description: "Please fill in first name, last name, and domain.",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    
    // Simulate API delay
    setTimeout(() => {
      const emails: GeneratedEmail[] = [];
      const f = firstName.toLowerCase();
      const m = middleName.toLowerCase();
      const l = lastName.toLowerCase();
      const d = domain.toLowerCase().replace(/^@/, '');

      // Generate various email patterns
      const patterns = [
        { email: `${f}.${l}@${d}`, pattern: 'firstname.lastname' },
        { email: `${f}${l}@${d}`, pattern: 'firstnamelastname' },
        { email: `${f.charAt(0)}.${l}@${d}`, pattern: 'f.lastname' },
        { email: `${f}.${l.charAt(0)}@${d}`, pattern: 'firstname.l' },
        { email: `${f}${l.charAt(0)}@${d}`, pattern: 'firstnamel' },
        { email: `${f.charAt(0)}${l}@${d}`, pattern: 'flastname' },
        { email: `${l}.${f}@${d}`, pattern: 'lastname.firstname' },
        { email: `${l}${f}@${d}`, pattern: 'lastnamefirstname' },
        { email: `${f}_${l}@${d}`, pattern: 'firstname_lastname' },
        { email: `${f}-${l}@${d}`, pattern: 'firstname-lastname' },
      ];

      // Add middle name variations if provided
      if (m) {
        patterns.push(
          { email: `${f}.${m}.${l}@${d}`, pattern: 'firstname.middlename.lastname' },
          { email: `${f}${m}${l}@${d}`, pattern: 'firstnamemiddlenamelastname' },
          { email: `${f.charAt(0)}.${m.charAt(0)}.${l}@${d}`, pattern: 'f.m.lastname' },
          { email: `${f}.${m.charAt(0)}.${l}@${d}`, pattern: 'firstname.m.lastname' }
        );
      }

      setGeneratedEmails(patterns);
      setIsGenerating(false);
      
      toast({
        title: "Emails Generated!",
        description: `Generated ${patterns.length} email variations.`,
      });
    }, 1000);
  };

  const copyToClipboard = async (email: string) => {
    try {
      await navigator.clipboard.writeText(email);
      toast({
        title: "Copied!",
        description: `${email} copied to clipboard.`,
      });
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to copy email to clipboard.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Email Combination Generator
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300">
            Generate smart email combinations using advanced name permutation patterns
          </p>
        </div>

        {/* Input Form */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Contact Information</CardTitle>
            <CardDescription>
              Enter the person's details to generate email combinations
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name *</Label>
                <Input
                  id="firstName"
                  placeholder="John"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="middleName">Middle Name (Optional)</Label>
                <Input
                  id="middleName"
                  placeholder="Michael"
                  value={middleName}
                  onChange={(e) => setMiddleName(e.target.value)}
                />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name *</Label>
                <Input
                  id="lastName"
                  placeholder="Smith"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="domain">Domain *</Label>
                <Input
                  id="domain"
                  placeholder="company.com"
                  value={domain}
                  onChange={(e) => setDomain(e.target.value)}
                />
              </div>
            </div>
            <Button 
              onClick={generateEmails}
              disabled={isGenerating}
              className="w-full bg-gradient-to-r from-blue-500 to-emerald-500 hover:from-blue-600 hover:to-emerald-600"
            >
              {isGenerating ? 'Generating...' : 'Generate Email Combinations'}
            </Button>
          </CardContent>
        </Card>

        {/* Results */}
        {generatedEmails.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <CheckCircle className="h-5 w-5 text-emerald-500 mr-2" />
                Generated Email Combinations ({generatedEmails.length})
              </CardTitle>
              <CardDescription>
                Click any email to copy it to your clipboard, or validate it directly
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {generatedEmails.map((item, index) => (
                  <div
                    key={index}
                    className="group p-4 rounded-lg border bg-card hover:bg-accent hover:text-accent-foreground transition-colors"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-mono text-sm font-medium break-all">
                        {item.email}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(item.email)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">
                        {item.pattern}
                      </span>
                      <Link href={`/validate?email=${encodeURIComponent(item.email)}`}>
                        <Button variant="ghost" size="sm" className="text-xs opacity-0 group-hover:opacity-100 transition-opacity">
                          Validate
                          <ExternalLink className="h-3 w-3 ml-1" />
                        </Button>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="mt-6 pt-6 border-t text-center">
                <p className="text-sm text-muted-foreground mb-4">
                  Want to validate these emails for deliverability?
                </p>
                <Link href="/validate">
                  <Button variant="outline">
                    Go to Email Validator
                    <ExternalLink className="h-4 w-4 ml-2" />
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}