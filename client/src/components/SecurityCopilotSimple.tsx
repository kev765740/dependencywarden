import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Brain } from "lucide-react";

interface SecurityCopilotSimpleProps {
  prefilledMessage?: string;
  alertContext?: {
    repo: string;
    vulnerability: string;
    severity: string;
  };
}

export function SecurityCopilotSimple({ prefilledMessage, alertContext }: SecurityCopilotSimpleProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Button
      onClick={() => setIsOpen(!isOpen)}
      className="fixed bottom-6 right-6 z-50 h-14 w-14 rounded-full shadow-lg bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white border-0"
      size="lg"
    >
      <Brain className="h-6 w-6" />
    </Button>
  );
}