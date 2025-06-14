import { createContext, useContext, useState, ReactNode } from 'react';

interface SecurityCopilotContextType {
  promptHandler: ((prompt: string, context?: any) => void) | null;
  setPromptHandler: (handler: (prompt: string, context?: any) => void) => void;
}

const SecurityCopilotContext = createContext<SecurityCopilotContextType | undefined>(undefined);

export function SecurityCopilotProvider({ children }: { children: ReactNode }) {
  const [promptHandler, setPromptHandler] = useState<((prompt: string, context?: any) => void) | null>(null);

  return (
    <SecurityCopilotContext.Provider value={{ promptHandler, setPromptHandler }}>
      {children}
    </SecurityCopilotContext.Provider>
  );
}

export function useSecurityCopilot() {
  const context = useContext(SecurityCopilotContext);
  if (context === undefined) {
    throw new Error('useSecurityCopilot must be used within a SecurityCopilotProvider');
  }
  return context;
}