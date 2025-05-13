import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import toast from "react-hot-toast";
import { axiosInstance } from "@/lib/axios";

// Define types
declare global {
  interface Window {
    Razorpay: any;
  }
}

interface RazorpayCheckoutProps {
  tier: string;
  onSuccess: () => void;
  onFailure: (error: string) => void;
}

// Define pricing for each tier
const TIER_PRICES = {
  basic: "₹99",
  standard: "₹149",
  premium: "₹199",
};

const RazorpayCheckout = ({
  tier,
  onSuccess,
  onFailure,
}: RazorpayCheckoutProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [scriptLoaded, setScriptLoaded] = useState(false);

  // Preload Razorpay script on component mount
  useEffect(() => {
    const loadScript = async () => {
      try {
        if (window.Razorpay) {
          console.log("Razorpay script already loaded");
          setScriptLoaded(true);
          return;
        }

        console.log("Preloading Razorpay script...");
        const script = document.createElement("script");
        script.src = "https://checkout.razorpay.com/v1/checkout.js";
        script.async = true;

        // Create script load promise
        const scriptPromise = new Promise<boolean>((resolve) => {
          script.onload = () => {
            console.log("Razorpay script loaded successfully");
            resolve(true);
          };
          script.onerror = () => {
            console.error("Failed to load Razorpay script");
            resolve(false);
          };
        });

        // Add script to document
        document.body.appendChild(script);

        // Wait for script to load
        const isLoaded = await scriptPromise;
        setScriptLoaded(isLoaded);
      } catch (error) {
        console.error("Error loading Razorpay script:", error);
        setScriptLoaded(false);
      }
    };

    loadScript();

    // Cleanup function
    return () => {
      // No cleanup needed as we want to keep the script loaded
    };
  }, []);

  // Function to initiate payment
  const initiatePayment = async () => {
    try {
      setIsLoading(true);
      toast.loading("Initializing payment...", { id: "payment" });

      // Validate tier
      if (!["basic", "standard", "premium"].includes(tier)) {
        toast.error("Invalid plan selected", { id: "payment" });
        onFailure("Invalid plan selected");
        setIsLoading(false);
        return;
      }

      // Check if script is loaded
      if (!window.Razorpay) {
        console.log("Razorpay script not loaded yet, loading now...");
        // Try loading script again if it failed earlier
        const script = document.createElement("script");
        script.src = "https://checkout.razorpay.com/v1/checkout.js";

        const scriptLoaded = await new Promise<boolean>((resolve) => {
          script.onload = () => resolve(true);
          script.onerror = () => resolve(false);
          document.body.appendChild(script);
        });

        if (!scriptLoaded) {
          toast.error("Failed to load payment gateway", { id: "payment" });
          onFailure("Failed to load payment gateway");
          setIsLoading(false);
          return;
        }
      }

      console.log(`Starting payment process for tier: ${tier}`);

      // Create a payment order
      const { data } = await axiosInstance.post("/payments/create-order", {
        tier,
      });

      if (!data || !data.order || !data.key_id) {
        toast.error("Failed to create payment order", { id: "payment" });
        onFailure("Failed to create payment order");
        setIsLoading(false);
        return;
      }

      console.log(`Order created for tier: ${tier}`, data);
      toast.success("Payment gateway ready!", { id: "payment" });

      // Get the order details
      const orderId = data.order.id;
      const amount = data.order.amount;
      const currency = data.order.currency;

      // Get the display price for showing the correct amount in the UI
      const displayedPrice =
        data.displayedPrice || TIER_PRICES[tier as keyof typeof TIER_PRICES];

      // Initialize Razorpay with a slight delay to ensure UI is updated
      setTimeout(() => {
        try {
          // Initialize Razorpay
          const options = {
            key: data.key_id,
            amount: amount,
            currency: currency,
            name: "Audix Premium",
            description: `Subscribe to Audix ${
              tier.charAt(0).toUpperCase() + tier.slice(1)
            } Plan (${displayedPrice})`,
            order_id: orderId,
            prefill: {
              name: data.name || "",
              email: data.email || "",
              contact: data.contact || "",
            },
            theme: {
              color: "#10b981", // Emerald-600
            },
            handler: async function (response: any) {
              try {
                console.log("Payment response received:", response);

                // Verify payment with server
                const { data: verifyData } = await axiosInstance.post(
                  "/payments/verify-payment",
                  {
                    razorpay_order_id: response.razorpay_order_id,
                    razorpay_payment_id: response.razorpay_payment_id,
                    razorpay_signature: response.razorpay_signature,
                    tier,
                  }
                );

                if (verifyData.success) {
                  toast.success("Payment successful! You are now premium!", {
                    id: "payment",
                  });
                  onSuccess();
                } else {
                  toast.error("Payment verification failed", { id: "payment" });
                  onFailure("Payment verification failed");
                }
              } catch (error: any) {
                console.error("Error during payment verification:", error);
                toast.error("Payment verification failed", { id: "payment" });
                onFailure(
                  error?.response?.data?.message ||
                    "Payment verification failed"
                );
              } finally {
                setIsLoading(false);
              }
            },
            modal: {
              ondismiss: function () {
                toast.error("Payment cancelled", { id: "payment" });
                onFailure("Payment cancelled by user");
                setIsLoading(false);
              },
            },
            retry: {
              enabled: false,
            },
          };

          const razorpay = new window.Razorpay(options);
          razorpay.on("payment.failed", function (response: any) {
            console.error("Payment failed:", response.error);
            toast.error(`Payment failed: ${response.error.description}`, {
              id: "payment",
            });
            onFailure(response.error.description);
            setIsLoading(false);
          });

          // Open Razorpay popup
          razorpay.open();

          // Clear the loading toast
          toast.dismiss("payment");
        } catch (razorpayError) {
          console.error("Error initializing Razorpay:", razorpayError);
          toast.error("Failed to initialize payment gateway", {
            id: "payment",
          });
          onFailure("Failed to initialize payment gateway");
          setIsLoading(false);
        }
      }, 300); // Add a small delay to ensure everything is ready
    } catch (error: any) {
      console.error("Razorpay error:", error);
      toast.error("Failed to initialize payment", { id: "payment" });
      onFailure(
        error?.response?.data?.message || "Failed to initialize payment"
      );
      setIsLoading(false);
    }
  };

  return (
    <Button
      onClick={initiatePayment}
      className="bg-emerald-600 hover:bg-emerald-700 w-full"
      disabled={isLoading}
    >
      {isLoading
        ? "Processing..."
        : `Pay ${
            TIER_PRICES[tier as keyof typeof TIER_PRICES] || TIER_PRICES.premium
          } with Razorpay`}
    </Button>
  );
};

export default RazorpayCheckout;
