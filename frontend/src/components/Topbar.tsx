import { SignedOut, UserButton, useAuth } from "@clerk/clerk-react";
import { LayoutDashboardIcon, Crown, Search } from "lucide-react";
import { Link } from "react-router-dom";
import SignInOAuthButtons from "./SignInOAuthButtons";
import { useAuthStore } from "@/stores/useAuthStore";
import { usePremiumStore } from "@/stores/usePremiumStore";
import { cn } from "@/lib/utils";
import { buttonVariants } from "./ui/button";
import PremiumBadge from "./PremiumBadge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./ui/tooltip";
import { useEffect } from "react";

const Topbar = () => {
  const { isAdmin } = useAuthStore();
  const { premiumStatus, checkPremiumStatus } = usePremiumStore();
  const isPremium = premiumStatus?.isPremium || false;
  const { isSignedIn } = useAuth();

  // Check premium status when component mounts
  useEffect(() => {
    checkPremiumStatus();
  }, [checkPremiumStatus]);

  console.log({ isAdmin, isPremium });

  return (
    <div
      className="flex items-center justify-between p-4 sticky top-0 bg-zinc-900/75 
      backdrop-blur-md z-10
    "
    >
      <div className="flex gap-2 items-center">
        <img src="/audix.png" className="size-8" alt="Audix logo" />
        Audix
      </div>
      <div className="flex items-center gap-4">
        {/* Search Button */}
        <Link
          to="/search"
          className={cn(
            buttonVariants({ variant: "ghost", size: "default" }),
            "rounded-md flex items-center gap-2 bg-zinc-800/40 hover:bg-zinc-700/40 text-zinc-300 hover:text-white border border-zinc-700/50 hover:border-zinc-600 transition-all"
          )}
          title="Search songs"
        >
          <Search className="size-4" />
          Search
        </Link>

        {isAdmin && (
          <Link
            to={"/admin"}
            className={cn(buttonVariants({ variant: "outline" }))}
          >
            <LayoutDashboardIcon className="size-4  mr-2" />
            Admin Dashboard
          </Link>
        )}

        <SignedOut>
          <SignInOAuthButtons />
        </SignedOut>

        {/* Premium upgrade button - Only show when user is logged in and not premium */}
        {isSignedIn && !isPremium && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Link
                  to="/premium"
                  className={cn(
                    buttonVariants({ variant: "outline", size: "sm" }),
                    "bg-gradient-to-r from-amber-500 to-yellow-300 text-black border-none hover:from-amber-600 hover:to-yellow-400"
                  )}
                >
                  <Crown className="mr-1 h-4 w-4" />
                  Upgrade
                </Link>
              </TooltipTrigger>
              <TooltipContent>
                <p>Upgrade to Premium</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}

        <div className="flex items-center gap-1">
          <UserButton />
          {isPremium && <PremiumBadge />}
        </div>
      </div>
    </div>
  );
};
export default Topbar;
