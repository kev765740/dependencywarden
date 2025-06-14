import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Home, Search, Shield, ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <Card className="w-full max-w-lg text-center shadow-xl">
        <CardHeader className="pb-4">
          <div className="mx-auto mb-4 w-24 h-24 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
            <Shield className="h-12 w-12 text-blue-600 dark:text-blue-400" />
          </div>
          <CardTitle className="text-4xl font-bold text-gray-900 dark:text-gray-100">
            404
          </CardTitle>
          <CardDescription className="text-xl text-gray-600 dark:text-gray-400">
            Page Not Found
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
            Oops! The page you're looking for seems to have vanished into the digital void. 
            Don't worry though - your security monitoring is still running smoothly.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/">
              <Button className="w-full sm:w-auto">
                <Home className="mr-2 h-4 w-4" />
                Back to Dashboard
              </Button>
            </Link>
            <Button 
              variant="outline" 
              onClick={() => window.history.back()}
              className="w-full sm:w-auto"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Go Back
            </Button>
          </div>

          <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              Common destinations:
            </p>
            <div className="flex flex-col space-y-2 text-sm">
              <Link href="/" className="text-blue-600 dark:text-blue-400 hover:underline">
                🏠 Dashboard - View your repositories
              </Link>
              <Link href="/settings" className="text-blue-600 dark:text-blue-400 hover:underline">
                ⚙️ Settings - Configure monitoring
              </Link>
              <Link href="/referrals" className="text-blue-600 dark:text-blue-400 hover:underline">
                🎁 Referrals - Earn rewards
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
