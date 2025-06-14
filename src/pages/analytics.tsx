import { BusinessIntelligenceDashboard } from "@/components/BusinessIntelligenceDashboard";
import { ProFeatureShowcase } from "@/components/ProFeatureShowcase";

export default function AnalyticsPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Analytics & Insights
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Strategic data-driven insights for security optimization and business growth
            </p>
          </div>
          <ProFeatureShowcase 
            trigger={
              <div className="text-right">
                <div className="text-sm text-gray-500 mb-1">Unlock Advanced Analytics</div>
                <div className="text-purple-600 font-semibold cursor-pointer hover:text-purple-700">
                  Upgrade to Pro →
                </div>
              </div>
            }
          />
        </div>

        <BusinessIntelligenceDashboard />
      </div>
    </div>
  );
}