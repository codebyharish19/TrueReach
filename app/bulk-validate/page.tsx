"use client";
export const dynamic = 'force-dynamic';
import { useState, useCallback } from 'react';
import { Upload, Download, FileText, CheckCircle, AlertTriangle, X, Search, ArrowUpDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { validateEmail } from '@/lib/email-validation';

interface ValidationResult {
  email: string;
  syntax: boolean;
  domain: boolean;
  mx: boolean;
  disposable: boolean;
  roleBased: boolean;
  catchAll: boolean;
  smtp: boolean;
  score: number;
  status: 'valid' | 'risky' | 'invalid';
}

interface UploadedFile {
  name: string;
  size: number;
  emails: string[];
}

export default function BulkValidatePage() {
  const [uploadedFile, setUploadedFile] = useState<UploadedFile | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [validationProgress, setValidationProgress] = useState(0);
  const [results, setResults] = useState<ValidationResult[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<keyof ValidationResult>('email');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [isDragOver, setIsDragOver] = useState(false);
  const { toast } = useToast();

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    const csvFile = files.find(file => file.name.endsWith('.csv'));
    
    if (csvFile) {
      processFile(csvFile);
    } else {
      toast({
        title: "Invalid File Type",
        description: "Please upload a CSV file.",
        variant: "destructive",
      });
    }
  }, [toast]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const processFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const lines = text.split('\n').filter(line => line.trim());
      
      if (lines.length === 0) {
        toast({
          title: "Empty File",
          description: "The uploaded file appears to be empty.",
          variant: "destructive",
        });
        return;
      }

      const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/"/g, ''));
      
      const emailColumnIndex = headers.findIndex(h => 
        h.includes('email') || h.includes('e-mail') || h.includes('mail')
      );
      
      if (emailColumnIndex === -1) {
        toast({
          title: "No Email Column Found",
          description: "Please ensure your CSV has a column containing 'email', 'e-mail', or 'mail'.",
          variant: "destructive",
        });
        return;
      }

      const emails = lines.slice(1)
        .map(line => {
          const columns = line.split(',');
          return columns[emailColumnIndex]?.trim().replace(/"/g, '');
        })
        .filter(email => email && email.includes('@'))
        .filter((email, index, self) => self.indexOf(email) === index); // Remove duplicates

      if (emails.length === 0) {
        toast({
          title: "No Valid Emails Found",
          description: "No valid email addresses were found in the uploaded file.",
          variant: "destructive",
        });
        return;
      }

      setUploadedFile({
        name: file.name,
        size: file.size,
        emails: emails
      });

      toast({
        title: "File Uploaded Successfully",
        description: `Found ${emails.length} unique email addresses to validate.`,
      });
    };

    reader.onerror = () => {
      toast({
        title: "File Read Error",
        description: "There was an error reading the file. Please try again.",
        variant: "destructive",
      });
    };

    reader.readAsText(file);
  };

  const validateEmails = async () => {
    if (!uploadedFile) return;

    setIsValidating(true);
    setValidationProgress(0);
    setResults([]);

    const validationResults: ValidationResult[] = [];

    try {
      for (let i = 0; i < uploadedFile.emails.length; i++) {
        const email = uploadedFile.emails[i];
        
        // Add small delay to show progress
        await new Promise(resolve => setTimeout(resolve, 50));

        try {
          const result = await validateEmail(email);
          validationResults.push(result);
        } catch (error) {
          // If validation fails for individual email, add it with failed status
          validationResults.push({
            email,
            syntax: false,
            domain: false,
            mx: false,
            disposable: false,
            roleBased: false,
            catchAll: false,
            smtp: false,
            score: 0,
            status: 'invalid'
          });
        }

        setValidationProgress(Math.round(((i + 1) / uploadedFile.emails.length) * 100));
        setResults([...validationResults]);
      }

      const validCount = validationResults.filter(r => r.status === 'valid').length;
      const riskyCount = validationResults.filter(r => r.status === 'risky').length;
      const invalidCount = validationResults.filter(r => r.status === 'invalid').length;

      toast({
        title: "Validation Complete!",
        description: `${validCount} valid, ${riskyCount} risky, ${invalidCount} invalid emails found.`,
      });

    } catch (error) {
      toast({
        title: "Validation Error",
        description: "An error occurred during bulk validation. Please try again.",
        variant: "destructive",
      });
    }

    setIsValidating(false);
  };

  const downloadResults = () => {
    if (results.length === 0) return;

    const headers = [
      'Email', 'Syntax', 'Domain', 'MX', 'Disposable', 'Role-based', 
      'Catch-All', 'SMTP', 'Score', 'Status'
    ];

    const csvContent = [
      headers.join(','),
      ...results.map(result => [
        `"${result.email}"`,
        result.syntax ? 'Pass' : 'Fail',
        result.domain ? 'Pass' : 'Fail',
        result.mx ? 'Pass' : 'Fail',
        result.disposable ? 'Yes' : 'No',
        result.roleBased ? 'Yes' : 'No',
        result.catchAll ? 'Yes' : 'No',
        result.smtp ? 'Pass' : 'Fail',
        result.score,
        result.status.charAt(0).toUpperCase() + result.status.slice(1)
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `validation-results-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: "Download Started",
      description: "Your validation results are being downloaded.",
    });
  };

  const handleSort = (field: keyof ValidationResult) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const filteredAndSortedResults = results
    .filter(result => 
      result.email.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      const aValue = a[sortField];
      const bValue = b[sortField];
      
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortDirection === 'asc' 
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }
      
      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
      }
      
      if (typeof aValue === 'boolean' && typeof bValue === 'boolean') {
        return sortDirection === 'asc' 
          ? (aValue === bValue ? 0 : aValue ? 1 : -1)
          : (aValue === bValue ? 0 : aValue ? -1 : 1);
      }
      
      return 0;
    });

  const getStatusBadge = (status: string) => {
    const colors = {
      valid: 'bg-emerald-500 hover:bg-emerald-600',
      risky: 'bg-yellow-500 hover:bg-yellow-600',
      invalid: 'bg-red-500 hover:bg-red-600'
    };
    return colors[status as keyof typeof colors] || 'bg-gray-500';
  };

  const getCheckIcon = (passed: boolean) => {
    return passed ? (
      <CheckCircle className="h-4 w-4 text-emerald-500" />
    ) : (
      <X className="h-4 w-4 text-red-500" />
    );
  };

  const getWarningIcon = (isWarning: boolean) => {
    return isWarning ? (
      <AlertTriangle className="h-4 w-4 text-yellow-500" />
    ) : (
      <CheckCircle className="h-4 w-4 text-emerald-500" />
    );
  };

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Bulk Email Validation
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300">
            Upload a CSV file and validate multiple email addresses with our 8-layer validation engine
          </p>
        </div>

        {/* File Upload */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Upload CSV File</CardTitle>
            <CardDescription>
              Upload a CSV file containing email addresses. The file should have a column named 'email', 'e-mail', or 'mail'.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div
              className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                isDragOver 
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/20' 
                  : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
              }`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <div className="space-y-2">
                <p className="text-lg font-medium">
                  Drag and drop your CSV file here
                </p>
                <p className="text-sm text-muted-foreground">
                  or click to browse files
                </p>
              </div>
              <input
                type="file"
                accept=".csv"
                onChange={handleFileSelect}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
            </div>

            {uploadedFile && (
              <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                <div className="flex items-center space-x-3">
                  <FileText className="h-5 w-5 text-blue-500" />
                  <div>
                    <p className="font-medium">{uploadedFile.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {uploadedFile.emails.length} email addresses found • {(uploadedFile.size / 1024).toFixed(1)} KB
                    </p>
                  </div>
                </div>
                <Button
                  onClick={validateEmails}
                  disabled={isValidating}
                  className="bg-gradient-to-r from-blue-500 to-emerald-500 hover:from-blue-600 hover:to-emerald-600"
                >
                  {isValidating ? 'Validating...' : 'Start Validation'}
                </Button>
              </div>
            )}

            {isValidating && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Validation Progress</span>
                  <span>{validationProgress}%</span>
                </div>
                <Progress value={validationProgress} className="h-2" />
                <p className="text-sm text-muted-foreground text-center">
                  Processing {Math.ceil((validationProgress / 100) * (uploadedFile?.emails.length || 0))} of {uploadedFile?.emails.length || 0} emails
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Results */}
        {results.length > 0 && (
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <CardTitle className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-emerald-500 mr-2" />
                    Validation Results ({results.length})
                  </CardTitle>
                  <CardDescription>
                    Detailed validation results for each email address
                  </CardDescription>
                </div>
                <div className="flex flex-col sm:flex-row gap-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search emails..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 w-full sm:w-64"
                    />
                  </div>
                  <Button
                    onClick={downloadResults}
                    variant="outline"
                    className="flex items-center"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download CSV
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2 font-medium">
                        <button
                          onClick={() => handleSort('email')}
                          className="flex items-center hover:text-foreground"
                        >
                          Email
                          <ArrowUpDown className="h-3 w-3 ml-1" />
                        </button>
                      </th>
                      <th className="text-center p-2 font-medium">Syntax</th>
                      <th className="text-center p-2 font-medium">Domain</th>
                      <th className="text-center p-2 font-medium">MX</th>
                      <th className="text-center p-2 font-medium">Disposable</th>
                      <th className="text-center p-2 font-medium">Role-based</th>
                      <th className="text-center p-2 font-medium">Catch-All</th>
                      <th className="text-center p-2 font-medium">SMTP</th>
                      <th className="text-center p-2 font-medium">
                        <button
                          onClick={() => handleSort('score')}
                          className="flex items-center hover:text-foreground"
                        >
                          Score
                          <ArrowUpDown className="h-3 w-3 ml-1" />
                        </button>
                      </th>
                      <th className="text-center p-2 font-medium">
                        <button
                          onClick={() => handleSort('status')}
                          className="flex items-center hover:text-foreground"
                        >
                          Status
                          <ArrowUpDown className="h-3 w-3 ml-1" />
                        </button>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredAndSortedResults.map((result, index) => (
                      <tr key={index} className="border-b hover:bg-muted/50">
                        <td className="p-2 font-mono text-xs break-all max-w-48">
                          {result.email}
                        </td>
                        <td className="p-2 text-center">
                          {getCheckIcon(result.syntax)}
                        </td>
                        <td className="p-2 text-center">
                          {getCheckIcon(result.domain)}
                        </td>
                        <td className="p-2 text-center">
                          {getCheckIcon(result.mx)}
                        </td>
                        <td className="p-2 text-center">
                          {getWarningIcon(result.disposable)}
                        </td>
                        <td className="p-2 text-center">
                          {getWarningIcon(result.roleBased)}
                        </td>
                        <td className="p-2 text-center">
                          {getWarningIcon(result.catchAll)}
                        </td>
                        <td className="p-2 text-center">
                          {getCheckIcon(result.smtp)}
                        </td>
                        <td className="p-2 text-center font-semibold">
                          {result.score}%
                        </td>
                        <td className="p-2 text-center">
                          <Badge className={`${getStatusBadge(result.status)} text-white capitalize`}>
                            {result.status}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {filteredAndSortedResults.length === 0 && searchTerm && (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">
                    No emails found matching "{searchTerm}"
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}