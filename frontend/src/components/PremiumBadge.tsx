import { Crown } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface PremiumBadgeProps {
  tier?: 'basic' | 'standard' | 'premium';
  size?: 'sm' | 'md' | 'lg';
}

const PremiumBadge = ({ tier = 'premium', size = 'md' }: PremiumBadgeProps) => {
  // Different colors based on tier
  const colors = {
    basic: "from-blue-400 to-blue-500",
    standard: "from-purple-400 to-purple-500",
    premium: "from-amber-400 to-yellow-500"
  };
  
  // Different sizes
  const sizes = {
    sm: "h-3 w-3",
    md: "h-4 w-4",
    lg: "h-5 w-5"
  };
  
  const tierNames = {
    basic: "Basic",
    standard: "Standard",
    premium: "Premium"
  };
  
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className={`inline-flex bg-gradient-to-r ${colors[tier]} rounded-full p-0.5 ml-1 cursor-help`}>
            <Crown className={`${sizes[size]} text-black`} />
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p className="text-xs">{tierNames[tier]} Member</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default PremiumBadge;
