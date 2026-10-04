import { useLocation } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';


export default function PageNotFound({}) {
    const location = useLocation();
    const pageName = location.pathname.substring(1);

    const { data: authData, isFetched } = useQuery({
        queryKey: ['user'],
        queryFn: async () => {
            try {
                const user = await base44.auth.me();
                return { user, isAuthenticated: true };
            } catch (error) {
                return { user: null, isAuthenticated: false };
            }
        }
    });
    
    return (
        <div className="min-h-screen flex items-center justify-center p-6 bg-[#05060D] font-body">
            <div className="max-w-md w-full">
                <div className="text-center space-y-6">
                    {/* 404 Error Code */}
                    <div className="space-y-2">
                        <h1
                            className="text-7xl font-display font-black tracking-[0.1em]"
                            style={{
                                background: "linear-gradient(180deg,#00F5FF 0%,#FF2E93 100%)",
                                WebkitBackgroundClip: "text",
                                backgroundClip: "text",
                                color: "transparent",
                                filter: "drop-shadow(0 0 18px rgba(0,245,255,0.5))",
                            }}
                        >
                            404
                        </h1>
                        <div className="h-0.5 w-16 mx-auto" style={{ background: "linear-gradient(90deg,#00F5FF,#FF2E93)", boxShadow: "0 0 8px rgba(0,245,255,0.6)" }}></div>
                    </div>
                    
                    {/* Main Message */}
                    <div className="space-y-3">
                        <h2 className="text-2xl font-display font-bold tracking-wider text-[#F8FAFC]" style={{ textShadow: "0 0 12px rgba(0,245,255,0.3)" }}>
                            Page Not Found
                        </h2>
                        <p className="text-[#94A3B8] leading-relaxed font-body">
                            The page <span className="font-semibold text-[#00F5FF]">"{pageName}"</span> could not be found in this application.
                        </p>
                    </div>
                    
                    {/* Admin Note */}
                    {isFetched && authData.isAuthenticated && authData.user?.role === 'admin' && (
                        <div className="mt-8 p-4 rounded-lg border border-[#FF2E93]/30 bg-[#FF2E93]/5">
                            <div className="flex items-start space-x-3">
                                <div className="flex-shrink-0 w-5 h-5 rounded-full bg-[#FF2E93]/20 flex items-center justify-center mt-0.5">
                                    <div className="w-2 h-2 rounded-full bg-[#FF2E93]" style={{ boxShadow: "0 0 6px #FF2E93" }}></div>
                                </div>
                                <div className="text-left space-y-1">
                                    <p className="text-sm font-display font-bold tracking-wide text-[#F8FAFC]">Admin Note</p>
                                    <p className="text-sm text-[#94A3B8] leading-relaxed">
                                        This could mean that the AI hasn't implemented this page yet. Ask it to implement it in the chat.
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}
                    
                    {/* Action Button */}
                    <div className="pt-6">
                        <button 
                            onClick={() => window.location.href = '/'} 
                            className="inline-flex items-center px-5 py-3 text-sm font-display font-bold tracking-wider text-[#05060D] rounded-lg transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-[#05060D] focus-visible:ring-[#00F5FF]/60"
                            style={{ background: "linear-gradient(90deg,#00F5FF,#FF2E93)", boxShadow: "0 0 14px rgba(0,245,255,0.4)" }}
                        >
                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                            </svg>
                            Go Home
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}