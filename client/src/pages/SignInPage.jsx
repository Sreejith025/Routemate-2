import React from "react";
import { SignIn } from "@clerk/clerk-react";
import { dark } from "@clerk/themes";

const SignInPage = () => {
  return (
    <div className="min-h-[85vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative">
      {/* Background ambient glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-600/20 rounded-full blur-[100px] pointer-events-none" />
      
      <div className="relative z-10 flex flex-col items-center">
        <SignIn
          path="/sign-in"
          routing="path"
          signUpUrl="/sign-up"
          appearance={{
            baseTheme: dark,
            elements: {
              cardBox: "shadow-2xl rounded-2xl overflow-hidden border border-slate-800",
              card: "glass-card p-8 bg-slate-900/90 text-slate-100",
              headerTitle: "text-2xl font-bold text-white text-center",
              headerSubtitle: "text-slate-400 text-center text-sm",
              socialButtonsBlockButton:
                "bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700 transition-colors",
              formButtonPrimary:
                "bg-indigo-600 hover:bg-indigo-500 text-white font-medium shadow-lg shadow-indigo-600/30 transition-all",
              formFieldInput:
                "bg-slate-800 border-slate-700 text-white focus:border-indigo-500 focus:ring-indigo-500/20",
              footerActionLink: "text-indigo-400 hover:text-indigo-300 font-medium",
              footer: "bg-slate-950/80 border-t border-slate-800 text-slate-400",
            },
          }}
        />
      </div>
    </div>
  );
};

export default SignInPage;
