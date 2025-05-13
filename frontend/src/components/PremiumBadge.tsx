import { Crown } from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { usePremiumStore } from "@/stores/usePremiumStore";
import { useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import toast from "react-hot-toast";

interface PremiumBadgeProps {
  tier?: "basic" | "standard" | "premium";
  size?: "sm" | "md" | "lg";
  mode?: "tooltip" | "dropdown";
}

const PremiumBadge = ({
  tier = "premium",
  size = "md",
  mode = "dropdown",
}: PremiumBadgeProps) => {
  const navigate = useNavigate();
  const { cancelPremium } = usePremiumStore();
  const [cancellingSubscription, setCancellingSubscription] = useState(false);

  // Different colors based on tier
  const colors = {
    basic: "from-blue-400 to-blue-500",
    standard: "from-purple-400 to-purple-500",
    premium: "from-amber-400 to-yellow-500",
  };

  // Different sizes
  const sizes = {
    sm: "h-3 w-3",
    md: "h-4 w-4",
    lg: "h-5 w-5",
  };

  const tierNames = {
    basic: "Basic",
    standard: "Standard",
    premium: "Premium",
  };

  const handleCancelSubscription = async () => {
    setCancellingSubscription(true);
    toast.loading("Cancelling subscription...", { id: "cancel-subscription" });

    try {
      const success = await cancelPremium();

      if (success) {
        toast.success("Subscription cancelled successfully", {
          id: "cancel-subscription",
        });
      } else {
        toast.error("Failed to cancel subscription", {
          id: "cancel-subscription",
        });
      }
    } catch (error) {
      console.error("Error cancelling subscription:", error);
      toast.error("Failed to cancel subscription", {
        id: "cancel-subscription",
      });
    } finally {
      setCancellingSubscription(false);
    }
  };

  // Show tooltip only mode
  if (mode === "tooltip") {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div
              className={`inline-flex bg-gradient-to-r ${colors[tier]} rounded-full p-0.5 ml-1 cursor-help`}
            >
              <Crown className={`${sizes[size]} text-black`} />
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p className="text-xs">{tierNames[tier]} Member</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  // Dropdown menu mode with actions
  return (
    <DropdownMenu>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <DropdownMenuTrigger asChild>
              <div
                className={`inline-flex bg-gradient-to-r ${colors[tier]} rounded-full p-0.5 ml-1 cursor-pointer`}
              >
                <Crown className={`${sizes[size]} text-black`} />
              </div>
            </DropdownMenuTrigger>
          </TooltipTrigger>
          <TooltipContent>
            <p className="text-xs">
              {tierNames[tier]} Member - Click for options
            </p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <DropdownMenuContent
        align="end"
        className="w-48 bg-zinc-900 border-zinc-800 text-white"
      >
        <div className="px-2 py-1.5 text-xs font-medium text-zinc-400">
          Subscription Options
        </div>
        <DropdownMenuSeparator className="bg-zinc-800" />
        <DropdownMenuItem
          className="cursor-pointer text-white hover:bg-zinc-800 focus:bg-zinc-800"
          onClick={() => navigate("/premium")}
        >
          Manage Subscription
        </DropdownMenuItem>
        <DropdownMenuSeparator className="bg-zinc-800" />
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <DropdownMenuItem
              className="cursor-pointer text-red-500 hover:bg-zinc-800 focus:bg-zinc-800"
              onSelect={(e: Event) => e.preventDefault()} // Prevent closing dropdown when opening alert
            >
              {cancellingSubscription ? "Cancelling..." : "Cancel Subscription"}
            </DropdownMenuItem>
          </AlertDialogTrigger>
          <AlertDialogContent className="bg-zinc-900 border-zinc-800">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-white">
                Cancel Premium Subscription?
              </AlertDialogTitle>
              <AlertDialogDescription className="text-zinc-400">
                Are you sure you want to cancel your premium subscription?
                You'll lose access to premium features at the end of your
                current billing period.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="border-zinc-700 bg-zinc-800 hover:bg-zinc-700 text-white">
                No, Keep It
              </AlertDialogCancel>
              <AlertDialogAction
                className="bg-red-600 hover:bg-red-700 text-white"
                onClick={handleCancelSubscription}
                disabled={cancellingSubscription}
              >
                Yes, Cancel
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default PremiumBadge;
