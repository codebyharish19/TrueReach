"use client";
export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Check, X, AlertTriangle, Mail, Shield, Globe, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { validateEmail } from '@/lib/email-validation';

interface ValidationLayer {
  name: string;
  description: string;
  status: 'pending' | 'pass' | 'fail' | 'warning';
  icon: React.ReactNode;
}

interface ValidationResult {
  email: string;
  score: number;
  status: 'valid' | 'risky' | 'invalid';
  layers: ValidationLayer[];
  details: {
    syntax: boolean;
    domain: boolean;
    mx: boolean;
    disposable: boolean;
    roleBased: boolean;
    catchAll: boolean;
    smtp: boolean;
  };
}

export default function ValidatePage() {
  const searchParams = useSearchParams();
  const [email, setEmail] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  const [result, setResult] = useState<ValidationResult | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const emailParam = searchParams.get('email');
    if (emailParam) {
      setEmail(emailParam);
    }
  }, [searchParams]);

  const validateEmailAddress = async () => {
    if (!email) {
      toast({
        title: "Missing Email",
        description: "Please enter an email address to validate.",
        variant: "destructive",
      });
      return;
    }

    setIsValidating(true);
    setResult(null);

    // Initialize validation layers
    const layers: ValidationLayer[] = [
      {
        name: 'Syntax Check',
        description: 'RFC 5322 compliance validation',
        status: 'pending',
        icon: <Mail className="h-4 w-4" />
      },
      {
        name: 'Domain Validation',
        description: 'DNS resolution and domain existence',
        status: 'pending',
        icon: <Globe className="h-4 w-4" />
      },
      {
        name: 'MX Records',
        description: 'Mail exchange server configuration',
        status: 'pending',
        icon: <Shield className="h-4 w-4" />
      },
      {
        name: 'Disposable Check',
        description: 'Temporary/disposable email detection',
        status: 'pending',
        icon: <AlertTriangle className="h-4 w-4" />
      },
      {
        name: 'Role-Based Check',
        description: 'Generic role account detection',
        status: 'pending',
        icon: <Mail className="h-4 w-4" />
      },
      {
        name: 'Catch-All Detection',
        description: 'Domain catch-all configuration',
        status: 'pending',
        icon: <Globe className="h-4 w-4" />
      },
      {
        name: 'SMTP Verification',
        description: 'Mailbox existence validation',
        status: 'pending',
        icon: <Zap className="h-4 w-4" />
      },
      {
        name: 'Final Scoring',
        description: 'Confidence score calculation',
        status: 'pending',
        icon: <Shield className="h-4 w-4" />
      }
    ];

    // Simulate progressive validation with real validation logic
    for (let i = 0; i < layers.length - 1; i++) {
      await new Promise(resolve => setTimeout(resolve, 300 + Math.random() * 200));
      
      // Update the current layer as processing
      setResult({
        email,
        score: Math.round(((i + 1) / layers.length) * 100),
        status: 'valid',
        layers: [...layers],
        details: {
          syntax: false,
          domain: false,
          mx: false,
          disposable: false,
          roleBased: false,
          catchAll: false,
          smtp: false
        }
      });
    }

    // Perform actual validation
    try {
      const validationResult = await validateEmail(email);
      
      // Update layers with actual results
      layers[0].status = validationResult.syntax ? 'pass' : 'fail';
      layers[1].status = validationResult.domain ? 'pass' : 'fail';
      layers[2].status = validationResult.mx ? 'pass' : 'fail';
      layers[3].status = validationResult.disposable ? 'warning' : 'pass';
      layers[4].status = validationResult.roleBased ? 'warning' : 'pass';
      layers[5].status = validationResult.catchAll ? 'warning' : 'pass';
      layers[6].status = validationResult.smtp ? 'pass' : 'fail';
      layers[7].status = 'pass'; // Final scoring always passes if we get here

      setResult({
        email: validationResult.email,
        score: validationResult.score,
        status: validationResult.status,
        layers,
        details: {
          syntax: validationResult.syntax,
          domain: validationResult.domain,
          mx: validationResult.mx,
          disposable: validationResult.disposable,
          roleBased: validationResult.roleBased,
          catchAll: validationResult.catchAll,
          smtp: validationResult.smtp
        }
      });

      toast({
        title: "Validation Complete!",
        description: `Email validation finished with ${validationResult.score}% confidence.`,
      });

    } catch (error) {
      toast({
        title: "Validation Error",
        description: "An error occurred during validation. Please try again.",
        variant: "destructive",
      });
    }

    setIsValidating(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'valid': return 'bg-emerald-500';
      case 'risky': return 'bg-yellow-500';
      case 'invalid': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pass': return <Check className="h-4 w-4 text-emerald-500" />;
      case 'warning': return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'fail': return <X className="h-4 w-4 text-red-500" />;
      default: return <div className="h-4 w-4 rounded-full bg-gray-300 animate-pulse" />;
    }
  };

  const getStatusDescription = (result: ValidationResult) => {
    if (result.status === 'valid' && result.score >= 80) {
      return "This email has a high probability of being deliverable and appears to be a real, active mailbox.";
    }
    if (result.status === 'valid' && result.score >= 60) {
      return "This email appears to be valid but may have some minor concerns that could affect deliverability.";
    }
    if (result.status === 'risky') {
      let reasons = [];
      if (result.details.disposable) reasons.push("disposable email provider");
      if (result.details.roleBased) reasons.push("role-based address");
      if (result.details.catchAll) reasons.push("catch-all domain");
      if (!result.details.smtp) reasons.push("mailbox verification failed");
      
      const reasonText = reasons.length > 0 ? ` (${reasons.join(', ')})` : "";
      return `This email may be valid but has concerning characteristics${reasonText}.`;
    }
    if (result.status === 'invalid') {
      if (!result.details.syntax) return "This email has invalid syntax and cannot be delivered.";
      if (!result.details.domain) return "The domain for this email address does not exist.";
      if (!result.details.mx) return "The domain has no mail servers configured.";
      return "This email is likely invalid or undeliverable.";
    }
    return "";
  };

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Email Validation Engine
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300">
            Comprehensive 8-layer email validation with detailed confidence scoring
          </p>
        </div>

        {/* Input Form */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Email Address</CardTitle>
            <CardDescription>
              Enter the email address you want to validate
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                placeholder="john.doe@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && !isValidating && validateEmailAddress()}
              />
            </div>
            <Button 
              onClick={validateEmailAddress}
              disabled={isValidating}
              className="w-full bg-gradient-to-r from-blue-500 to-emerald-500 hover:from-blue-600 hover:to-emerald-600"
            >
              {isValidating ? 'Validating...' : 'Validate Email'}
            </Button>
          </CardContent>
        </Card>

        {/* Results */}
        {result && (
          <div className="space-y-6">
            {/* Overall Result */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg">Validation Result</CardTitle>
                    <CardDescription className="font-mono text-sm break-all">
                      {result.email}
                    </CardDescription>
                  </div>
                  <Badge 
                    className={`${getStatusColor(result.status)} text-white capitalize`}
                  >
                    {result.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>Confidence Score</span>
                      <span className="font-semibold">{result.score}%</span>
                    </div>
                    <Progress value={result.score} className="h-3" />
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {getStatusDescription(result)}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Validation Layers */}
            <Card>
              <CardHeader>
                <CardTitle>Validation Layers</CardTitle>
                <CardDescription>
                  Detailed results from our 8-layer validation engine
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {result.layers.map((layer, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-4 rounded-lg border"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="flex-shrink-0">
                          {layer.icon}
                        </div>
                        <div>
                          <div className="font-medium text-sm">{layer.name}</div>
                          <div className="text-xs text-muted-foreground">
                            {layer.description}
                          </div>
                        </div>
                      </div>
                      <div className="flex-shrink-0">
                        {getStatusIcon(layer.status)}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}