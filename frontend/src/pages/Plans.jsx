import { useState, useEffect } from "react";
import { useAuth } from "../auth/AuthContext";
import { useNavigate } from "react-router-dom";

const API_URL = import.meta.env.VITE_API_URL;

const Plans = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const res = await fetch(`${API_URL}/api/v1/plan/plans`, {
          credentials: "include",
        });
        const data = await res.json();
        if (res.ok) {
          setPlans(data.data);
        } else {
          setError(data.message || "Failed to fetch plans");
        }
      } catch {
        setError("Something went wrong. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchPlans();
  }, []);

  const loadScript = (src) => {
    return new Promise((resolve) => {
      const script = document.createElement("script");
        script.src = src;
        script.onload = () => resolve(true);
        script.onerror = () => resolve(false);
        document.body.appendChild(script);
    });
  }

  useEffect(() => {
    loadScript("https://checkout.razorpay.com/v1/checkout.js");
  }, []);

  const onPayment=async (planId) => {
    console.log("Initiating payment for plan:", planId);

    const options = {
        
        planId: planId,
    };

   try {
        const res = await fetch(`${API_URL}/api/v1/payment/create-order`, {
            method: "POST",
            credentials: "include",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(options),
        });

   
        if (!res.ok) {
            console.error("Failed to create order");
            return;
        }
        console.log("Order creation response received:", res);

        const data= await res.json();
        const order = data.data;
        
        console.log("Order created successfully:", order);

        const paymentObject= new window.Razorpay({
            key: process.env.VITE_RAZORPAY_KEY_ID,
            order_id: order.id,
            amount: order.amount,
            currency: order.currency,
            handler: async function(response){
                console.log("Payment successful:", response);
                const options2 = {
                    razorpay_order_id: response.razorpay_order_id,
                    razorpay_payment_id: response.razorpay_payment_id,
                    razorpay_signature: response.razorpay_signature,
                }

                const verifyRes = await fetch(`${API_URL}/api/v1/payment/verify-payment`, {
                    method: "POST",
                    credentials: "include",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify(options2),
                });
                const verifyData = await verifyRes.json();
                if(verifyRes.ok){
                    console.log("Payment verified successfully:", verifyData);
                    alert("Payment successful and verified!");
                }
                else{
                    console.error("Payment verification failed:", verifyData);
                    alert("Payment verification failed. Please contact support.");
                }
            }
        }) 
        paymentObject.open(); 
    } catch(error){
        console.error("Payment initiation failed:", error);
    
    }

}

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="bg-red-50 border border-red-200 rounded-lg px-6 py-4 text-red-700 text-sm">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-5xl mx-auto">
        <div className="mb-6">
          <button
            onClick={() => navigate("/")}
            className="inline-flex items-center text-sm font-medium text-indigo-600 hover:text-indigo-500 cursor-pointer"
          >
            ← Home
          </button>
        </div>

        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold text-gray-900">Choose Your Plan</h1>
          <p className="mt-2 text-gray-600">
            Pick the plan that fits your needs
          </p>
        </div>

        {plans.length === 0 ? (
          <p className="text-center text-gray-500">No plans available yet.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {plans.map((plan) => {
              const isCurrentPlan = user?.plan === plan.name.toLowerCase();
              return (
                <div
                  key={plan._id}
                  className={`bg-white rounded-2xl border p-6 flex flex-col justify-between shadow-sm transition-shadow hover:shadow-md ${
                    isCurrentPlan
                      ? "border-indigo-500 ring-2 ring-indigo-500"
                      : "border-gray-200"
                  }`}
                >
                  {isCurrentPlan && (
                    <span className="self-start mb-3 inline-block rounded-full bg-indigo-100 text-indigo-700 text-xs font-semibold px-3 py-1">
                      Current Plan
                    </span>
                  )}

                  <div>
                    <h2 className="text-xl font-semibold text-gray-900">
                      {plan.name}
                    </h2>

                    <div className="mt-4 flex items-baseline gap-1">
                      <span className="text-4xl font-bold text-gray-900">
                        {plan.currency === "INR" ? "₹" : "$"}
                        {plan.price}
                      </span>
                      <span className="text-sm text-gray-500">
                        /{plan.interval === "monthly" ? "mo" : "yr"}
                      </span>
                    </div>

                    <ul className="mt-6 space-y-3">
                      {plan.features?.maxForms != null && (
                        <FeatureItem text={`Up to ${plan.features.maxForms} forms`} />
                      )}
                      {plan.features?.maxResponses != null && (
                        <FeatureItem text={`Up to ${plan.features.maxResponses} responses`} />
                      )}
                      {plan.features?.allowFileUpload && (
                        <FeatureItem text="File uploads" />
                      )}
                      {plan.features?.allowGeofence && (
                        <FeatureItem text="Geofence support" />
                      )}
                    </ul>
                  </div>

                  <button
                    disabled={isCurrentPlan}
                    onClick={() => {
                      if (!user) navigate("/login");
                        else onPayment(plan._id);
                    }}
                    className={`mt-8 w-full rounded-lg px-4 py-2.5 text-sm font-semibold transition-colors ${
                      isCurrentPlan
                        ? "bg-gray-100 text-gray-400 cursor-default"
                        : "bg-indigo-600 text-white hover:bg-indigo-500 cursor-pointer"
                    }`}
                  >
                    {isCurrentPlan ? "Active" : "Get Started"}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

const FeatureItem = ({ text }) => (
  <li className="flex items-center gap-2 text-sm text-gray-700">
    <svg
      className="h-4 w-4 flex-shrink-0 text-indigo-500"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={2.5}
      stroke="currentColor"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
    </svg>
    {text}
  </li>
);

export default Plans;
