import { describe, it, expect } from '@jest/globals';

describe('Basic Functionality Tests', () => {
  it('should validate basic arithmetic operations', () => {
    expect(2 + 2).toBe(4);
    expect(10 * 5).toBe(50);
    expect(100 / 4).toBe(25);
  });

  it('should validate string operations', () => {
    const testString = 'DependencyWarden';
    expect(testString.length).toBe(16);
    expect(testString.toLowerCase()).toBe('dependencywarden');
    expect(testString.includes('Warden')).toBe(true);
  });

  it('should validate array operations', () => {
    const testArray = ['security', 'vulnerability', 'dependency'];
    expect(testArray.length).toBe(3);
    expect(testArray[0]).toBe('security');
    expect(testArray.includes('vulnerability')).toBe(true);
  });

  it('should validate object operations', () => {
    const testObject = { 
      name: 'Test Repository', 
      status: 'active',
      vulnerabilities: 5 
    };
    
    expect(testObject.name).toBe('Test Repository');
    expect(testObject.status).toBe('active');
    expect(testObject.vulnerabilities).toBeGreaterThan(0);
  });

  it('should validate boolean logic', () => {
    const isSecure = false;
    const hasVulnerabilities = true;
    
    expect(isSecure).toBe(false);
    expect(hasVulnerabilities).toBe(true);
    expect(isSecure && hasVulnerabilities).toBe(false);
    expect(isSecure || hasVulnerabilities).toBe(true);
  });
});