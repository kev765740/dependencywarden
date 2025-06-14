import OpenAI from "openai";

// Initialize OpenAI with error handling
let openai: OpenAI | null = null;
try {
  if (process.env.OPENAI_API_KEY) {
    openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
} catch (error) {
  console.warn('OpenAI initialization failed:', error);
}

interface SecurityTrend {
  metric: string;
  currentValue: number;
  predictedValue: number;
  trend: 'increasing' | 'decreasing' | 'stable';
  confidence: number;
  timeframe: string;
  factors: string[];
}

interface RiskForecast {
  repositoryId: number;
  riskScore: number;
  predictedRiskScore: number;
  riskCategories: {
    dependency: number;
    configuration: number;
    code_quality: number;
    deployment: number;
  };
  recommendations: string[];
  preventiveActions: string[];
  timeToMitigation: string;
}

interface SecurityMetrics {
  vulnerabilityCount: number;
  criticalVulnerabilities: number;
  averageResolutionTime: number;
  packageAge: number;
  updateFrequency: number;
  testCoverage: number;
  deploymentFrequency: number;
  failureRate: number;
}

export class PredictiveSecurityAnalytics {

  /**
   * Generate comprehensive security forecasts for repositories
   */
  async generateSecurityForecast(
    repositoryId: number,
    historicalData: SecurityMetrics[],
    currentMetrics: SecurityMetrics
  ): Promise<RiskForecast> {

    // Analyze historical trends
    const trends = await this.analyzeTrends(historicalData);
    
    // Predict future vulnerabilities
    const vulnerabilityForecast = await this.predictVulnerabilities(repositoryId, trends, currentMetrics);
    
    // Calculate risk categories
    const riskCategories = await this.calculateRiskCategories(currentMetrics, trends);
    
    // Generate AI-powered recommendations
    const recommendations = await this.generatePredictiveRecommendations(
      repositoryId,
      vulnerabilityForecast,
      riskCategories,
      trends
    );

    return {
      repositoryId,
      riskScore: currentMetrics.vulnerabilityCount * 2 + currentMetrics.criticalVulnerabilities * 5,
      predictedRiskScore: vulnerabilityForecast.predictedCount * 2 + vulnerabilityForecast.predictedCritical * 5,
      riskCategories,
      recommendations: recommendations.recommendations,
      preventiveActions: recommendations.preventiveActions,
      timeToMitigation: recommendations.timeToMitigation
    };
  }

  /**
   * Analyze historical trends to identify patterns
   */
  private async analyzeTrends(historicalData: SecurityMetrics[]): Promise<SecurityTrend[]> {
    if (historicalData.length < 2) {
      return [];
    }

    const trends: SecurityTrend[] = [];
    const latest = historicalData[historicalData.length - 1];
    const previous = historicalData[historicalData.length - 2];

    // Vulnerability trend
    trends.push({
      metric: 'vulnerability_count',
      currentValue: latest.vulnerabilityCount,
      predictedValue: this.predictLinearTrend(historicalData.map(d => d.vulnerabilityCount)),
      trend: latest.vulnerabilityCount > previous.vulnerabilityCount ? 'increasing' : 
             latest.vulnerabilityCount < previous.vulnerabilityCount ? 'decreasing' : 'stable',
      confidence: this.calculateTrendConfidence(historicalData.map(d => d.vulnerabilityCount)),
      timeframe: '30 days',
      factors: this.identifyTrendFactors('vulnerability_count', historicalData)
    });

    // Resolution time trend
    trends.push({
      metric: 'resolution_time',
      currentValue: latest.averageResolutionTime,
      predictedValue: this.predictLinearTrend(historicalData.map(d => d.averageResolutionTime)),
      trend: latest.averageResolutionTime > previous.averageResolutionTime ? 'increasing' : 
             latest.averageResolutionTime < previous.averageResolutionTime ? 'decreasing' : 'stable',
      confidence: this.calculateTrendConfidence(historicalData.map(d => d.averageResolutionTime)),
      timeframe: '30 days',
      factors: this.identifyTrendFactors('resolution_time', historicalData)
    });

    return trends;
  }

  /**
   * Predict future vulnerability patterns using AI analysis
   */
  private async predictVulnerabilities(
    repositoryId: number,
    trends: SecurityTrend[],
    currentMetrics: SecurityMetrics
  ): Promise<{
    predictedCount: number;
    predictedCritical: number;
    riskFactors: string[];
    timeline: string;
  }> {

    const prompt = `Analyze this repository's security metrics and predict future vulnerabilities:

Current Metrics:
- Total Vulnerabilities: ${currentMetrics.vulnerabilityCount}
- Critical Vulnerabilities: ${currentMetrics.criticalVulnerabilities}
- Average Resolution Time: ${currentMetrics.averageResolutionTime} days
- Package Age: ${currentMetrics.packageAge} days
- Update Frequency: ${currentMetrics.updateFrequency} updates/month
- Test Coverage: ${currentMetrics.testCoverage}%
- Deployment Frequency: ${currentMetrics.deploymentFrequency} deploys/week
- Failure Rate: ${currentMetrics.failureRate}%

Trends: ${JSON.stringify(trends, null, 2)}

Based on industry patterns, dependency lifecycles, and current metrics, predict:
1. Expected vulnerability count in next 30 days
2. Expected critical vulnerabilities in next 30 days
3. Key risk factors contributing to predictions
4. Timeline for when risks will materialize

Respond with JSON containing predictions and analysis.`;

    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: "You are a cybersecurity data analyst specializing in predictive vulnerability analysis."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        response_format: { type: "json_object" },
        temperature: 0.2
      });

      const prediction = JSON.parse(response.choices[0].message.content || '{}');
      
      return {
        predictedCount: prediction.predictedCount || currentMetrics.vulnerabilityCount,
        predictedCritical: prediction.predictedCritical || currentMetrics.criticalVulnerabilities,
        riskFactors: prediction.riskFactors || [],
        timeline: prediction.timeline || '30 days'
      };
    } catch (error) {
      console.error('Error predicting vulnerabilities:', error);
      return {
        predictedCount: currentMetrics.vulnerabilityCount,
        predictedCritical: currentMetrics.criticalVulnerabilities,
        riskFactors: ['Unable to generate predictions'],
        timeline: '30 days'
      };
    }
  }

  /**
   * Calculate risk scores by category
   */
  private async calculateRiskCategories(
    currentMetrics: SecurityMetrics,
    trends: SecurityTrend[]
  ): Promise<{
    dependency: number;
    configuration: number;
    code_quality: number;
    deployment: number;
  }> {

    // Dependency risk based on age and update frequency
    const dependencyRisk = Math.min(
      (currentMetrics.packageAge / 365) * 3 + 
      (10 - currentMetrics.updateFrequency) * 0.5, 
      10
    );

    // Configuration risk based on vulnerabilities and test coverage
    const configurationRisk = Math.min(
      currentMetrics.vulnerabilityCount * 0.5 + 
      (100 - currentMetrics.testCoverage) * 0.05,
      10
    );

    // Code quality risk based on test coverage and failure rate
    const codeQualityRisk = Math.min(
      (100 - currentMetrics.testCoverage) * 0.08 + 
      currentMetrics.failureRate * 0.2,
      10
    );

    // Deployment risk based on frequency and failure rate
    const deploymentRisk = Math.min(
      currentMetrics.failureRate * 0.3 + 
      (currentMetrics.deploymentFrequency > 10 ? 2 : 0),
      10
    );

    return {
      dependency: Math.round(dependencyRisk * 10) / 10,
      configuration: Math.round(configurationRisk * 10) / 10,
      code_quality: Math.round(codeQualityRisk * 10) / 10,
      deployment: Math.round(deploymentRisk * 10) / 10
    };
  }

  /**
   * Generate AI-powered predictive recommendations
   */
  private async generatePredictiveRecommendations(
    repositoryId: number,
    vulnerabilityForecast: any,
    riskCategories: any,
    trends: SecurityTrend[]
  ): Promise<{
    recommendations: string[];
    preventiveActions: string[];
    timeToMitigation: string;
  }> {

    const prompt = `Generate predictive security recommendations based on this analysis:

Repository ID: ${repositoryId}
Predicted Vulnerabilities: ${vulnerabilityForecast.predictedCount}
Predicted Critical: ${vulnerabilityForecast.predictedCritical}

Risk Categories:
- Dependency Risk: ${riskCategories.dependency}/10
- Configuration Risk: ${riskCategories.configuration}/10
- Code Quality Risk: ${riskCategories.code_quality}/10
- Deployment Risk: ${riskCategories.deployment}/10

Risk Factors: ${vulnerabilityForecast.riskFactors.join(', ')}
Trends: ${JSON.stringify(trends, null, 2)}

Provide:
1. Strategic recommendations to prevent predicted vulnerabilities
2. Specific preventive actions to implement immediately
3. Estimated time to implement mitigation strategies

Focus on proactive measures, automation opportunities, and process improvements.
Respond with JSON containing structured recommendations.`;

    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: "You are a senior security architect providing strategic predictive recommendations."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        response_format: { type: "json_object" },
        temperature: 0.3
      });

      const analysis = JSON.parse(response.choices[0].message.content || '{}');
      
      return {
        recommendations: analysis.recommendations || ['Review dependency management strategy'],
        preventiveActions: analysis.preventiveActions || ['Implement automated dependency updates'],
        timeToMitigation: analysis.timeToMitigation || '2-4 weeks'
      };
    } catch (error) {
      console.error('Error generating predictive recommendations:', error);
      return {
        recommendations: ['Review security metrics and trends'],
        preventiveActions: ['Implement regular security scanning'],
        timeToMitigation: '2-4 weeks'
      };
    }
  }

  /**
   * Generate security trend analysis for multiple repositories
   */
  async generateTrendAnalysis(repositoriesData: Array<{
    repositoryId: number;
    historicalData: SecurityMetrics[];
    currentMetrics: SecurityMetrics;
  }>): Promise<{
    overallTrends: SecurityTrend[];
    portfolioRisk: number;
    highestRiskRepos: number[];
    industryComparison: {
      better: number;
      similar: number;
      worse: number;
    };
    strategicRecommendations: string[];
  }> {

    // Calculate overall trends across all repositories
    const overallMetrics = this.aggregateMetrics(repositoriesData);
    const overallTrends = await this.analyzeTrends(overallMetrics);

    // Calculate portfolio-wide risk score
    const portfolioRisk = this.calculatePortfolioRisk(repositoriesData);

    // Identify highest risk repositories
    const highestRiskRepos = await this.identifyHighRiskRepositories(repositoriesData);

    // Generate strategic recommendations
    const strategicRecommendations = await this.generateStrategicRecommendations(
      overallTrends,
      portfolioRisk,
      repositoriesData
    );

    return {
      overallTrends,
      portfolioRisk,
      highestRiskRepos,
      industryComparison: {
        better: 65, // Simulated industry comparison
        similar: 25,
        worse: 10
      },
      strategicRecommendations
    };
  }

  /**
   * Predict optimal security investment allocation
   */
  async predictSecurityInvestment(
    budget: number,
    currentSpending: {
      tools: number;
      training: number;
      personnel: number;
      infrastructure: number;
    },
    riskProfile: any
  ): Promise<{
    recommendedAllocation: {
      tools: number;
      training: number;
      personnel: number;
      infrastructure: number;
    };
    expectedROI: number;
    riskReduction: number;
    justification: string[];
  }> {

    const prompt = `Analyze optimal security investment allocation:

Total Budget: $${budget}
Current Spending:
- Tools: $${currentSpending.tools}
- Training: $${currentSpending.training}
- Personnel: $${currentSpending.personnel}
- Infrastructure: $${currentSpending.infrastructure}

Risk Profile: ${JSON.stringify(riskProfile, null, 2)}

Recommend optimal budget allocation to maximize risk reduction and ROI.
Consider:
- Current risk levels and trends
- Industry best practices
- Cost-effectiveness of different investment areas
- Expected impact on security posture

Provide detailed allocation recommendations with justification.`;

    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: "You are a cybersecurity economics expert providing investment optimization recommendations."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        response_format: { type: "json_object" },
        temperature: 0.2
      });

      const analysis = JSON.parse(response.choices[0].message.content || '{}');
      
      return {
        recommendedAllocation: analysis.recommendedAllocation || currentSpending,
        expectedROI: analysis.expectedROI || 2.5,
        riskReduction: analysis.riskReduction || 25,
        justification: analysis.justification || ['Balanced approach to security investment']
      };
    } catch (error) {
      console.error('Error predicting security investment:', error);
      return {
        recommendedAllocation: currentSpending,
        expectedROI: 2.0,
        riskReduction: 20,
        justification: ['Maintain current investment strategy']
      };
    }
  }

  // Helper methods

  private predictLinearTrend(values: number[]): number {
    if (values.length < 2) return values[0] || 0;
    
    const n = values.length;
    const sumX = (n * (n - 1)) / 2;
    const sumY = values.reduce((sum, val) => sum + val, 0);
    const sumXY = values.reduce((sum, val, idx) => sum + val * idx, 0);
    const sumXX = (n * (n - 1) * (2 * n - 1)) / 6;
    
    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;
    
    return slope * n + intercept;
  }

  private calculateTrendConfidence(values: number[]): number {
    if (values.length < 3) return 50;
    
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
    const stdDev = Math.sqrt(variance);
    
    // Lower standard deviation = higher confidence
    const confidence = Math.max(20, 100 - (stdDev / mean) * 100);
    return Math.round(confidence);
  }

  private identifyTrendFactors(metric: string, data: SecurityMetrics[]): string[] {
    const factors: string[] = [];
    
    if (metric === 'vulnerability_count') {
      const latestUpdate = data[data.length - 1].updateFrequency;
      if (latestUpdate < 2) factors.push('Low update frequency');
      
      const avgPackageAge = data.reduce((sum, d) => sum + d.packageAge, 0) / data.length;
      if (avgPackageAge > 180) factors.push('Aging dependencies');
    }
    
    if (metric === 'resolution_time') {
      const avgTestCoverage = data.reduce((sum, d) => sum + d.testCoverage, 0) / data.length;
      if (avgTestCoverage < 70) factors.push('Low test coverage');
    }
    
    return factors;
  }

  private aggregateMetrics(repositoriesData: any[]): SecurityMetrics[] {
    // Aggregate metrics across all repositories by time period
    // This would typically group by date and calculate averages
    return [];
  }

  private calculatePortfolioRisk(repositoriesData: any[]): number {
    const totalRisk = repositoriesData.reduce((sum, repo) => {
      const currentMetrics = repo.currentMetrics;
      const riskScore = currentMetrics.vulnerabilityCount * 2 + currentMetrics.criticalVulnerabilities * 5;
      return sum + riskScore;
    }, 0);
    
    return Math.min(totalRisk / repositoriesData.length, 10);
  }

  private async identifyHighRiskRepositories(repositoriesData: any[]): Promise<number[]> {
    const riskScores = repositoriesData.map(repo => ({
      id: repo.repositoryId,
      risk: repo.currentMetrics.vulnerabilityCount * 2 + repo.currentMetrics.criticalVulnerabilities * 5
    }));
    
    riskScores.sort((a, b) => b.risk - a.risk);
    return riskScores.slice(0, 5).map(repo => repo.id);
  }

  private async generateStrategicRecommendations(
    trends: SecurityTrend[],
    portfolioRisk: number,
    repositoriesData: any[]
  ): Promise<string[]> {
    const recommendations: string[] = [];
    
    if (portfolioRisk > 7) {
      recommendations.push('Implement enterprise-wide vulnerability management program');
    }
    
    const increasingTrends = trends.filter(t => t.trend === 'increasing');
    if (increasingTrends.length > 0) {
      recommendations.push('Address increasing security trends with proactive measures');
    }
    
    return recommendations;
  }
}

export const predictiveSecurityAnalytics = new PredictiveSecurityAnalytics();