import React from 'react';

const UserNotRegisteredError = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#05060D] px-4 pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]">
      <div className="max-w-md w-full p-8 bg-[#0B1020] rounded-2xl border border-[#00F5FF]/25" style={{ boxShadow: "0 0 30px rgba(0,245,255,0.08)" }}>
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 mb-6 rounded-full" style={{ background: "rgba(255,59,92,0.12)", border: "1px solid rgba(255,59,92,0.4)" }}>
            <svg className="w-8 h-8 text-[#FF3B5C]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h1 className="text-3xl font-display font-bold text-[#F8FAFC] mb-4">Access Restricted</h1>
          <p className="text-[#94A3B8] mb-8">
            You are not registered to use this application. Please contact the app administrator to request access.
          </p>
          <div className="p-4 rounded-lg text-sm text-[#94A3B8]" style={{ background: "rgba(0,245,255,0.05)", border: "1px solid rgba(0,245,255,0.15)" }}>
            <p>If you believe this is an error, you can:</p>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>Verify you are logged in with the correct account</li>
              <li>Contact the app administrator for access</li>
              <li>Try logging out and back in again</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserNotRegisteredError;