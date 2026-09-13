import React, { useState } from "react";
import {
  LockKeyhole,
  Mail,
  Pickaxe,
  LogIn,
  UserPlus,
  KeyRound,
  Eye,
  EyeOff,
  ShieldCheck,
  Sun,
  Moon,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { firebaseConfigured } from "../firebase";

const firebaseMessage = (error) => {
  if (error.code === "auth/invalid-credential" || error.code === "auth/user-not-found") {
    return "Invalid email or password.";
  }
  if (error.code === "auth/email-already-in-use") return "An account already exists for this email.";
  if (error.code === "auth/weak-password") return "Use a password with at least 6 characters.";
  if (error.code === "auth/invalid-email") return "Enter a valid email address.";
  if (error.code === "auth/too-many-requests") return "Too many attempts. Try again later.";
  return error.message || "Unable to complete request.";
};

const LoginPage = () => {
  const { signIn, signUp, resetPassword, signInWithGoogle, signInAsDemo } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [mode, setMode] = useState("signin"); // "signin" | "signup" | "reset"
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const destination = location.state?.from?.pathname || "/dashboard";

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setSuccess("");
    setSubmitting(true);
    try {
      if (mode === "reset") {
        await resetPassword(email.trim());
        setSuccess("Password reset email sent! Check your inbox.");
        setMode("signin");
        return;
      }
      if (mode === "signup") {
        await signUp(email.trim(), password);
      } else {
        await signIn(email.trim(), password);
      }
      navigate(destination, { replace: true });
    } catch (signInError) {
      setError(firebaseMessage(signInError));
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError("");
    setSuccess("");
    setSubmitting(true);
    try {
      await signInWithGoogle();
      navigate(destination, { replace: true });
    } catch (googleError) {
      setError(firebaseMessage(googleError));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDemoSignIn = async () => {
    setError("");
    setSuccess("");
    setSubmitting(true);
    try {
      await signInAsDemo();
      navigate(destination, { replace: true });
    } catch (demoError) {
      setError(firebaseMessage(demoError));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#F4F7FB] dark:bg-[#090D16] flex flex-col justify-between transition-colors duration-200 relative overflow-hidden font-sans">
      {/* Background Decorative Ambient Highlights */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[500px] overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-150px] left-1/2 -translate-x-1/2 w-[650px] h-[350px] bg-gradient-to-b from-[#3498DB]/15 to-transparent rounded-full blur-3xl"></div>
        <div className="absolute top-[80px] left-[35%] w-[320px] h-[220px] bg-[#27AE60]/10 rounded-full blur-3xl"></div>
      </div>

      {/* Top Header Bar */}
      <header className="w-full px-6 py-5 flex items-center justify-between z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#2980B9] to-[#3498DB] text-white flex items-center justify-center shadow-lg shadow-[#3498DB]/25">
            <Pickaxe className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-base tracking-tight text-[#1B2942] dark:text-white">
                TERRAMIND
              </span>
              <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-[#3498DB]/10 text-[#3498DB] border border-[#3498DB]/25">
                Enterprise
              </span>
            </div>
          </div>
        </div>

        {/* Theme switcher button */}
        <button
          onClick={toggleTheme}
          className="p-2.5 rounded-xl bg-white dark:bg-[#131B2E] text-[#606F81] dark:text-[#94A3B8] hover:text-[#1B2942] dark:hover:text-white border border-[#D8E6F3] dark:border-[#1E293B] shadow-sm hover:shadow transition-all cursor-pointer"
          title={theme === "dark" ? "Switch to Executive Light" : "Switch to Obsidian Dark"}
        >
          {theme === "dark" ? (
            <Sun className="w-4 h-4 text-[#F1C40F]" />
          ) : (
            <Moon className="w-4 h-4 text-[#3498DB]" />
          )}
        </button>
      </header>

      {/* Main Single Centered Card Area */}
      <main className="flex-1 flex items-center justify-center px-4 py-6 z-10">
        <div className="w-full max-w-[440px]">
          
          {/* Card Surface */}
          <div className="bg-white dark:bg-[#131B2E] rounded-3xl border border-[#D8E6F3] dark:border-[#1E293B] shadow-xl dark:shadow-2xl dark:shadow-black/60 p-7 sm:p-9 transition-all">
            
            {/* Centered Heading */}
            <div className="text-center mb-6">
              <h1 className="text-2xl font-black tracking-tight text-[#1B2942] dark:text-white">
                {mode === "signup"
                  ? "Create Account"
                  : mode === "reset"
                  ? "Reset Password"
                  : "Welcome Back"}
              </h1>
              <p className="mt-1.5 text-xs text-[#606F81] dark:text-[#94A3B8]">
                {mode === "signup"
                  ? "Enter your organization credentials to get started."
                  : mode === "reset"
                  ? "Enter your registered email to reset your credentials."
                  : "Sign in to access your geological decision platform."}
              </p>
            </div>

            {!firebaseConfigured && (
              <div className="mb-5 rounded-xl border border-[#F1C40F]/40 bg-[#FFF9E6] dark:bg-[#332B12] p-3 text-xs text-[#8A6700] dark:text-[#F6D365]">
                Firebase is not configured for this deployment. Use demo access below, or add the six{" "}
                <code className="font-bold">VITE_FIREBASE_*</code> variables in Vercel to enable account sign-in.
              </div>
            )}

            {/* Segmented Sign In / Register Tabs (Hidden in reset mode) */}
            {mode !== "reset" && (
              <div className="flex p-1 bg-[#F4F7FB] dark:bg-[#090D16] rounded-xl border border-[#D8E6F3] dark:border-[#1E293B] mb-5">
                <button
                  type="button"
                  onClick={() => {
                    setMode("signin");
                    setError("");
                    setSuccess("");
                  }}
                  className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                    mode === "signin"
                      ? "bg-white dark:bg-[#131B2E] text-[#1B2942] dark:text-white shadow-xs"
                      : "text-[#606F81] dark:text-[#94A3B8] hover:text-[#1B2942] dark:hover:text-white"
                  }`}
                >
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMode("signup");
                    setError("");
                    setSuccess("");
                  }}
                  className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                    mode === "signup"
                      ? "bg-white dark:bg-[#131B2E] text-[#1B2942] dark:text-white shadow-xs"
                      : "text-[#606F81] dark:text-[#94A3B8] hover:text-[#1B2942] dark:hover:text-white"
                  }`}
                >
                  Register
                </button>
              </div>
            )}

            {/* Google Authentication Button */}
            {mode !== "reset" && (
              <>
                <button
                  type="button"
                  onClick={handleGoogleSignIn}
                  disabled={submitting || !firebaseConfigured}
                  className="w-full py-2.5 px-4 rounded-xl bg-white dark:bg-[#101726] border border-[#D8E6F3] dark:border-[#1E293B] hover:bg-[#F8FBFE] dark:hover:bg-[#18233A] text-xs font-bold text-[#1B2942] dark:text-white flex items-center justify-center gap-3 transition shadow-xs hover:shadow cursor-pointer disabled:opacity-60"
                >
                  <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                  <span>Continue with Google</span>
                </button>

                {/* Divider */}
                <div className="relative my-5">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-[#D8E6F3] dark:border-[#1E293B]"></div>
                  </div>
                  <div className="relative flex justify-center text-[10px] uppercase">
                    <span className="bg-white dark:bg-[#131B2E] px-2 text-[#606F81] dark:text-[#94A3B8] font-bold tracking-wider">
                      Or with work email
                    </span>
                  </div>
                </div>
              </>
            )}

            {/* Error & Success Messages */}
            {error && (
              <div className="mb-4 p-3 rounded-xl bg-[#FDEDEC] dark:bg-[#2C1518] border border-[#E74C3C]/30 text-xs text-[#E74C3C] dark:text-[#FF8080] flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span className="font-medium">{error}</span>
              </div>
            )}

            {success && (
              <div className="mb-4 p-3 rounded-xl bg-[#EAFAF1] dark:bg-[#132B20] border border-[#27AE60]/30 text-xs text-[#27AE60] dark:text-[#52E38A] flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                <span className="font-medium">{success}</span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Email Address */}
              <div>
                <label className="block text-xs font-bold text-[#1B2942] dark:text-white mb-1.5">
                  Work Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-3 w-4 h-4 text-[#606F81] dark:text-[#94A3B8]" />
                  <input
                    required
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="geologist@moil.gov.in"
                    className="w-full rounded-xl border border-[#D8E6F3] dark:border-[#1E293B] bg-[#F8FBFE] dark:bg-[#0D1527] py-2.5 pl-10 pr-3.5 text-xs text-[#1B2942] dark:text-white outline-none focus:border-[#3498DB] focus:ring-2 focus:ring-[#3498DB]/20 transition-all font-medium"
                    autoComplete="email"
                  />
                </div>
              </div>

              {/* Password */}
              {mode !== "reset" && (
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-bold text-[#1B2942] dark:text-white">
                      Password
                    </label>
                    {mode === "signin" && (
                      <button
                        type="button"
                        onClick={() => {
                          setMode("reset");
                          setError("");
                          setSuccess("");
                        }}
                        className="text-[11px] font-semibold text-[#3498DB] hover:underline cursor-pointer"
                      >
                        Forgot password?
                      </button>
                    )}
                  </div>
                  <div className="relative">
                    <LockKeyhole className="absolute left-3.5 top-3 w-4 h-4 text-[#606F81] dark:text-[#94A3B8]" />
                    <input
                      required
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••••••"
                      className="w-full rounded-xl border border-[#D8E6F3] dark:border-[#1E293B] bg-[#F8FBFE] dark:bg-[#0D1527] py-2.5 pl-10 pr-10 text-xs text-[#1B2942] dark:text-white outline-none focus:border-[#3498DB] focus:ring-2 focus:ring-[#3498DB]/20 transition-all font-medium"
                      autoComplete={mode === "signup" ? "new-password" : "current-password"}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-3 text-[#606F81] hover:text-[#1B2942] dark:hover:text-white cursor-pointer"
                      tabIndex={-1}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              )}

              {/* Remember Me Checkbox */}
              {mode === "signin" && (
                <div className="flex items-center justify-between pt-1">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="w-4 h-4 rounded border-[#D8E6F3] text-[#3498DB] focus:ring-[#3498DB] accent-[#3498DB]"
                    />
                    <span className="text-xs text-[#606F81] dark:text-[#94A3B8] font-medium">
                      Remember this device
                    </span>
                  </label>
                </div>
              )}

              {/* Submit CTA Button */}
              <button
                type="submit"
                disabled={submitting || !firebaseConfigured}
                className="w-full rounded-xl bg-gradient-to-r from-[#2980B9] to-[#3498DB] hover:from-[#2471A3] hover:to-[#2E86C1] py-3 font-bold text-white transition-all shadow-md shadow-[#3498DB]/25 hover:shadow-lg hover:shadow-[#3498DB]/35 flex items-center justify-center gap-2 text-xs cursor-pointer disabled:opacity-60 active:scale-[0.99] mt-2"
              >
                {submitting ? (
                  <span>Authenticating secure session…</span>
                ) : mode === "signup" ? (
                  <>
                    <UserPlus className="w-4 h-4" /> Create Account
                  </>
                ) : mode === "reset" ? (
                  <>
                    <KeyRound className="w-4 h-4" /> Send Reset Link
                  </>
                ) : (
                  <>
                    <LogIn className="w-4 h-4" /> Sign In
                  </>
                )}
              </button>
            </form>

            {!firebaseConfigured && mode === "signin" && (
              <button
                type="button"
                onClick={handleDemoSignIn}
                disabled={submitting}
                className="w-full mt-3 rounded-xl border border-[#27AE60]/40 bg-[#EAFAF1] dark:bg-[#132B20] py-3 font-bold text-[#218C4A] dark:text-[#52E38A] transition-all hover:bg-[#DDF5E7] dark:hover:bg-[#183B29] disabled:opacity-60"
              >
                {submitting ? "Opening demo session?" : "Continue with Demo Access"}
              </button>
            )}

            {/* Mode switch helper / Back to sign in */}
            <div className="mt-5 text-center">
              {mode === "reset" ? (
                <button
                  type="button"
                  onClick={() => {
                    setMode("signin");
                    setError("");
                    setSuccess("");
                  }}
                  className="text-xs font-semibold text-[#3498DB] hover:underline cursor-pointer"
                >
                  ← Back to sign in
                </button>
              ) : (
                <p className="text-xs text-[#606F81] dark:text-[#94A3B8]">
                  {mode === "signup" ? "Already have an account?" : "Don't have an account?"}{" "}
                  <button
                    type="button"
                    onClick={() => {
                      setMode(mode === "signup" ? "signin" : "signup");
                      setError("");
                      setSuccess("");
                    }}
                    className="font-bold text-[#3498DB] hover:underline cursor-pointer ml-1"
                  >
                    {mode === "signup" ? "Sign in" : "Register"}
                  </button>
                </p>
              )}
            </div>
          </div>

          {/* Under-Card Security Compliance Badge */}
          <div className="mt-6 flex items-center justify-center gap-2 text-[11px] text-[#606F81] dark:text-[#94A3B8]">
            <ShieldCheck className="w-3.5 h-3.5 text-[#27AE60]" />
            <span>Protected by 256-bit TLS encryption • MOIL GIS Protocol</span>
          </div>

        </div>
      </main>

      {/* Subtle Footer */}
      <footer className="w-full py-4 text-center text-[11px] text-[#606F81] dark:text-[#94A3B8] z-10">
        © 2026 Terramind AI Systems. Central Indian Manganese Mining Exploration Node.
      </footer>
    </div>
  );
};

export default LoginPage;
