import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { usePremiumStore } from "@/stores/usePremiumStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Crown, Check, CreditCard, ArrowLeft } from "lucide-react";
import Topbar from "@/components/Topbar";
import toast from "react-hot-toast";

const PremiumPage = () => {
  const navigate = useNavigate();
  const { upgradeToPremium, premiumStatus, isLoading } = usePremiumStore();
  
  const [selectedPlan, setSelectedPlan] = useState<string>("premium");
  const [paymentDetails, setPaymentDetails] = useState({
    cardNumber: "",
    cardName: "",
    expiry: "",
    cvv: ""
  });
  
  const plans = [
    {
      id: "basic",
      name: "Basic",
      price: "Rs.49",
      period: "1 month",
      features: [
        "Ad-free music",
        "Unlimited skips",
        "Download up to 100 songs"
      ]  
    },
    {
      id: "standard",
      name: "Standard",
      price: "Rs.199",
      period: "6 months",
      features: [
        "Ad-free music",
        "Unlimited skips",
        "High quality audio",
        "Download up to 100 songs"
      ]
    },
    {
      id: "premium",
      name: "Premium",
      price: "Rs.499",
      period: "1 Year",
      features: [
        "Ad-free music",
        "Unlimited skips",
        "High quality audio",
        "Download up to 100 songs"
      ]
    }
  ];
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPaymentDetails(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form
    if (!paymentDetails.cardNumber || !paymentDetails.cardName || !paymentDetails.expiry || !paymentDetails.cvv) {
      toast.error("Please fill in all payment details");
      return;
    }
    
    // Simple validation for demo
    if (paymentDetails.cardNumber.length < 16) {
      toast.error("Please enter a valid card number");
      return;
    }
    
    toast.loading("Processing payment...", { id: "payment" });
    
    // Call API to upgrade to premium
    const success = await upgradeToPremium("card", selectedPlan);
    
    if (success) {
      toast.success("Successfully upgraded to premium!", { id: "payment" });
      // Redirect to home page after successful upgrade
      setTimeout(() => navigate("/"), 1500);
    } else {
      toast.error("Failed to process payment. Please try again.", { id: "payment" });
    }
  };
  
  // If user is already premium, show different content
  if (premiumStatus?.isPremium) {
    return (
      <main className="rounded-md overflow-hidden h-full bg-gradient-to-b from-zinc-800 to-zinc-900">
        <Topbar />
        <div className="max-w-4xl mx-auto p-6">
          <Button 
            variant="ghost" 
            className="mb-6" 
            onClick={() => navigate(-1)}
          >
            <ArrowLeft className="mr-2 h-4 w-4" /> Back
          </Button>
          
          <div className="bg-zinc-800/50 rounded-xl p-8 text-center">
            <div className="inline-flex bg-gradient-to-r from-amber-500 to-yellow-300 p-4 rounded-full mb-4">
              <Crown className="h-10 w-10 text-black" />
            </div>
            
            <h1 className="text-3xl font-bold mb-2">You're Already Premium!</h1>
            <p className="text-zinc-400 mb-6">
              You're currently on the {premiumStatus.premiumTier} plan.
              {premiumStatus.premiumExpiresAt && (
                <span> Your subscription is valid until {new Date(premiumStatus.premiumExpiresAt).toLocaleDateString()}.</span>
              )}
            </p>
            
            <div className="flex justify-center">
              <Button 
                variant="outline" 
                className="border-zinc-700"
                onClick={() => navigate("/")}
              >
                Continue Enjoying Premium
              </Button>
            </div>
          </div>
        </div>
      </main>
    );
  }
  
  return (
    <main className="rounded-md overflow-hidden h-full bg-gradient-to-b from-zinc-800 to-zinc-900">
      <Topbar />
      <div className="max-w-4xl mx-auto p-6">
        <Button 
          variant="ghost" 
          className="mb-6" 
          onClick={() => navigate(-1)}
        >
          <ArrowLeft className="mr-2 h-4 w-4" /> Back
        </Button>
        
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">Upgrade to Premium</h1>
          <p className="text-zinc-400">
            Enjoy uninterrupted music with premium features.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          {plans.map(plan => (
            <div 
              key={plan.id}
              className={`bg-zinc-800/50 rounded-xl p-6 border-2 transition-all ${
                selectedPlan === plan.id 
                  ? "border-emerald-500" 
                  : "border-transparent hover:border-zinc-700"
              }`}
              onClick={() => setSelectedPlan(plan.id)}
            >
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-xl font-bold">{plan.name}</h3>
                {selectedPlan === plan.id && (
                  <div className="bg-emerald-500 rounded-full p-1">
                    <Check className="h-4 w-4 text-black" />
                  </div>
                )}
              </div>
              
              <div className="mb-4">
                <span className="text-2xl font-bold">{plan.price}</span>
                <span className="text-zinc-400">/{plan.period}</span>
              </div>
              
              <ul className="space-y-2">
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
        
        <form onSubmit={handleSubmit} className="bg-zinc-800/50 rounded-xl p-6">
          <h2 className="text-xl font-bold mb-4">Payment Details</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="space-y-2">
              <Label htmlFor="cardName">Cardholder Name</Label>
              <Input
                id="cardName"
                name="cardName"
                placeholder="John Doe"
                value={paymentDetails.cardName}
                onChange={handleInputChange}
                className="bg-zinc-700 border-zinc-600"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="cardNumber">Card Number</Label>
              <Input
                id="cardNumber"
                name="cardNumber"
                placeholder="4242 4242 4242 4242"
                value={paymentDetails.cardNumber}
                onChange={handleInputChange}
                className="bg-zinc-700 border-zinc-600"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="expiry">Expiry Date</Label>
              <Input
                id="expiry"
                name="expiry"
                placeholder="MM/YY"
                value={paymentDetails.expiry}
                onChange={handleInputChange}
                className="bg-zinc-700 border-zinc-600"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="cvv">CVV</Label>
              <Input
                id="cvv"
                name="cvv"
                placeholder="123"
                value={paymentDetails.cvv}
                onChange={handleInputChange}
                className="bg-zinc-700 border-zinc-600"
              />
            </div>
          </div>
          
          <div className="flex justify-end">
            <Button 
              type="submit" 
              className="bg-emerald-600 hover:bg-emerald-700"
              disabled={isLoading}
            >
              <CreditCard className="mr-2 h-4 w-4" />
              {isLoading ? "Processing..." : "Subscribe Now"}
            </Button>
          </div>
        </form>
      </div>
    </main>
  );
};

export default PremiumPage;
