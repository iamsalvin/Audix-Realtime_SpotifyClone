import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { usePremiumStore } from "@/stores/usePremiumStore";
import { Button } from "@/components/ui/button";
import { Crown, Check, ArrowLeft, AlertCircle } from "lucide-react";
import Topbar from "@/components/Topbar";
import toast from "react-hot-toast";
import { ScrollArea } from "@/components/ui/scroll-area";
import RazorpayCheckout from "@/components/RazorpayCheckout";
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

// Define plan types and pricing
const PLANS = [
  {
    id: "basic",
    name: "Basic",
    price: "₹99",
    period: "1 Month",
    features: ["Ad-free music", "Unlimited skips", "Download up to 100 songs"],
  },
  {
    id: "standard",
    name: "Standard",
    price: "₹149",
    period: "6 Months",
    features: [
      "Ad-free music",
      "Unlimited skips",
      "High-quality audio",
      "Download up to 100 songs",
    ],
  },
  {
    id: "premium",
    name: "Premium",
    price: "₹199",
    period: "1 Year",
    features: [
      "Ad-free music",
      "Unlimited skips",
      "High-quality audio",
      "Download up to 500 songs",
      "Early access to new features",
    ],
  },
];

const PremiumPage = () => {
  const navigate = useNavigate();
  const { premiumStatus, isLoading, checkPremiumStatus, cancelPremium } =
    usePremiumStore();
  const [isMobile, setIsMobile] = useState(false);
  const [cancellingSubscription, setCancellingSubscription] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<
    "basic" | "standard" | "premium"
  >("premium");

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const handleSelectPlan = (planId: "basic" | "standard" | "premium") => {
    console.log(
      `Selected plan: ${planId} with price: ${
        PLANS.find((p) => p.id === planId)?.price
      }`
    );
    setSelectedPlan(planId);
  };

  const handlePaymentSuccess = () => {
    // Refresh premium status after successful payment
    checkPremiumStatus();

    // Redirect to home page after successful upgrade
    setTimeout(() => navigate("/"), 1500);
  };

  const handlePaymentFailure = (errorMessage: string) => {
    console.error("Payment failed:", errorMessage);
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
        checkPremiumStatus(); // Refresh the premium status
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

  // If user is already premium, show different content
  if (premiumStatus?.isPremium) {
    return (
      <div className="h-full flex flex-col bg-gradient-to-b from-zinc-800 to-zinc-900 rounded-md">
        <Topbar />
        <ScrollArea className="flex-1">
          <div className="max-w-4xl mx-auto p-4 md:p-6">
            <Button
              variant="ghost"
              className="mb-4"
              onClick={() => navigate(-1)}
            >
              <ArrowLeft className="mr-2 h-4 w-4" /> Back
            </Button>

            <div className="bg-zinc-800/50 rounded-xl p-6 md:p-8 text-center">
              <div className="inline-flex bg-gradient-to-r from-amber-500 to-yellow-300 p-4 rounded-full mb-4">
                <Crown className="h-10 w-10 text-black" />
              </div>

              <h1 className="text-2xl md:text-3xl font-bold mb-2">
                You're Already Premium!
              </h1>
              <p className="text-zinc-400 mb-6">
                You're currently on the {premiumStatus.premiumTier} plan.
                {premiumStatus.premiumExpiresAt && (
                  <span>
                    {" "}
                    Your subscription is valid until{" "}
                    {new Date(
                      premiumStatus.premiumExpiresAt
                    ).toLocaleDateString()}
                    .
                  </span>
                )}
              </p>

              <div className="flex flex-col sm:flex-row justify-center gap-3">
                <Button
                  variant="outline"
                  className="border-zinc-700"
                  onClick={() => navigate("/")}
                >
                  Continue Enjoying Premium
                </Button>

                {/* Subscription Cancellation Button with Alert Dialog */}
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="destructive"
                      disabled={cancellingSubscription}
                    >
                      {cancellingSubscription
                        ? "Cancelling..."
                        : "Cancel Subscription"}
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent className="bg-zinc-900 border-zinc-800">
                    <AlertDialogHeader>
                      <AlertDialogTitle className="text-white">
                        Cancel Premium Subscription?
                      </AlertDialogTitle>
                      <AlertDialogDescription className="text-zinc-400">
                        Are you sure you want to cancel your premium
                        subscription? You'll lose access to premium features at
                        the end of your current billing period.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel className="border-zinc-700 bg-zinc-800 hover:bg-zinc-700 text-white">
                        No, Keep It
                      </AlertDialogCancel>
                      <AlertDialogAction
                        className="bg-red-600 hover:bg-red-700 text-white"
                        onClick={handleCancelSubscription}
                      >
                        Yes, Cancel
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          </div>
        </ScrollArea>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-gradient-to-b from-zinc-800 to-zinc-900 rounded-md">
      <Topbar />
      <ScrollArea className="flex-1">
        <div className="max-w-4xl mx-auto p-4 md:p-6 pb-16">
          <Button variant="ghost" className="mb-4" onClick={() => navigate(-1)}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Back
          </Button>

          <div className="text-center mb-6">
            <h1 className="text-2xl md:text-3xl font-bold mb-2">
              Upgrade to Premium
            </h1>
            <p className="text-zinc-400">
              Enjoy uninterrupted music with premium features.
            </p>
          </div>

          <div
            className={`grid grid-cols-1 ${
              isMobile ? "" : "md:grid-cols-3"
            } gap-4 mb-6`}
          >
            {PLANS.map((plan) => (
              <div
                key={plan.id}
                className={`bg-zinc-800/50 rounded-xl p-4 md:p-6 border-2 transition-all cursor-pointer ${
                  selectedPlan === plan.id
                    ? "border-emerald-500"
                    : "border-transparent hover:border-zinc-700"
                }`}
                onClick={() =>
                  handleSelectPlan(plan.id as "basic" | "standard" | "premium")
                }
              >
                <div className="flex justify-between items-start mb-3">
                  <h3 className="text-lg md:text-xl font-bold">{plan.name}</h3>
                  {selectedPlan === plan.id && (
                    <div className="bg-emerald-500 rounded-full p-1">
                      <Check className="h-4 w-4 text-black" />
                    </div>
                  )}
                </div>

                <div className="mb-3">
                  <span className="text-xl md:text-2xl font-bold">
                    {plan.price}
                  </span>
                  <span className="text-zinc-400">/{plan.period}</span>
                </div>

                <ul className="space-y-1.5">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-center text-sm">
                      <Check className="h-4 w-4 text-emerald-500 mr-2 flex-shrink-0" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="bg-zinc-800/50 rounded-xl p-4 md:p-6">
            <h2 className="text-lg md:text-xl font-bold mb-4">
              Payment Method
            </h2>

            <div className="flex justify-center mb-4">
              <p className="text-zinc-400 text-sm max-w-md text-center">
                You will be redirected to Razorpay's secure payment gateway to
                complete your payment.
              </p>
            </div>

            <div className="flex justify-center">
              <div className="w-full max-w-md">
                <RazorpayCheckout
                  tier={selectedPlan}
                  onSuccess={handlePaymentSuccess}
                  onFailure={handlePaymentFailure}
                />
              </div>
            </div>
          </div>
        </div>
      </ScrollArea>
    </div>
  );
};

export default PremiumPage;
