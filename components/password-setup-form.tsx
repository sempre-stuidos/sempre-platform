"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Eye, EyeOff } from "lucide-react";
import { supabase } from "@/lib/supabase";

interface PasswordSetupFormProps {
  email: string;
  user_id: string | null;
  user_role_id: number | null;
  onPasswordSet: () => void;
  className?: string;
}

export function PasswordSetupForm({
  email,
  user_id,
  user_role_id,
  onPasswordSet,
  className,
}: PasswordSetupFormProps) {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [hasResetSession, setHasResetSession] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [showOtpInput, setShowOtpInput] = useState(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);

  // Check if user has a session from password reset email
  useEffect(() => {
    const checkSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          setHasResetSession(true);
        } else {
          // If no session, show OTP input option
          setShowOtpInput(true);
        }
      } catch (error) {
        console.error("Error checking session:", error);
        // On error, show OTP input as fallback
        setShowOtpInput(true);
      }
    };
    checkSession();
  }, []);

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!otpCode || otpCode.length < 6) {
      toast.error("Please enter a valid 6-digit code");
      return;
    }

    setIsVerifyingOtp(true);

    try {
      // Verify OTP code for password recovery
      const { data, error } = await supabase.auth.verifyOtp({
        email: email,
        token: otpCode,
        type: 'recovery'
      });

      if (error) {
        throw error;
      }

      if (data.session) {
        setHasResetSession(true);
        setShowOtpInput(false);
        toast.success("Code verified! Please set your new password.");
      } else {
        throw new Error("Failed to verify code");
      }
    } catch (error: unknown) {
      console.error("Error verifying OTP:", error);
      const errorMessage = error instanceof Error ? error.message : "Invalid or expired code";
      toast.error(errorMessage);
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  const validatePassword = (pwd: string): string | null => {
    if (pwd.length < 6) {
      return "Password must be at least 6 characters";
    }
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate passwords
    const passwordError = validatePassword(password);
    if (passwordError) {
      toast.error(passwordError);
      return;
    }

    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    setIsLoading(true);

    try {
      // If user has a session from password reset email, use updateUser directly
      if (hasResetSession) {
        const { error: updateError } = await supabase.auth.updateUser({
          password: password,
        });

        if (updateError) {
          throw updateError;
        }

        toast.success("Password reset successfully!");
        onPasswordSet();
        return;
      }

      if (user_id) {
        // Existing auth user (OAuth user) - update password via API
        const response = await fetch("/api/auth/update-password", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            user_id,
            password,
          }),
        });

        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(data.error || "Failed to set password");
        }

        // Sign in with the new password
        const { supabase } = await import("@/lib/supabase");
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (signInError) {
          throw signInError;
        }

        toast.success("Password set successfully!");
        onPasswordSet();
      } else if (user_role_id) {
        // No auth user yet - create one via API
        const response = await fetch("/api/auth/create-user", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email,
            password,
            user_role_id,
          }),
        });

        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(data.error || "Failed to create account");
        }

        // Sign in with the new password
        const { supabase } = await import("@/lib/supabase");
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (signInError) {
          throw signInError;
        }

        toast.success("Account created successfully!");
        onPasswordSet();
      } else {
        throw new Error("Missing user information");
      }
    } catch (error: unknown) {
      console.error("Error setting password:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Failed to set password";
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Show OTP input if no session and OTP input is enabled
  if (showOtpInput && !hasResetSession) {
    return (
      <div className={className}>
        <form onSubmit={handleVerifyOtp} className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="otpCode" className="text-white">
              Enter Verification Code
            </Label>
            <Input
              id="otpCode"
              type="text"
              value={otpCode}
              onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="Enter 6-digit code"
              className="bg-white/5 border-white/20 text-white text-center text-2xl tracking-widest"
              required
              maxLength={6}
              disabled={isVerifyingOtp}
              autoFocus
            />
            <p className="text-xs text-white/60 text-center">
              Alternatively, enter the code from your email
            </p>
          </div>
          <Button
            type="submit"
            className="w-full bg-white/5 border-white/20 text-white hover:bg-white/10 hover:text-white"
            disabled={isVerifyingOtp || otpCode.length !== 6}
          >
            {isVerifyingOtp ? "Verifying..." : "Verify Code"}
          </Button>
        </form>
      </div>
    );
  }

  return (
    <div className={className}>
      {!hasResetSession && (
        <div className="mb-4 p-3 bg-white/5 border border-white/20 rounded-md">
          <p className="text-xs text-white/80 mb-2">Link didn't work?</p>
          <button
            type="button"
            onClick={() => setShowOtpInput(true)}
            className="text-xs text-white/60 hover:text-white underline"
          >
            Enter verification code instead
          </button>
        </div>
      )}
      <form onSubmit={handleSubmit} className="grid gap-4">
        <div className="grid gap-2">
          <Label htmlFor="password" className="text-white">
            New Password
          </Label>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              className="bg-white/5 border-white/20 text-white pr-10"
              required
              minLength={6}
              disabled={isLoading}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-white/60 hover:text-white"
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          </div>
          {password && validatePassword(password) && (
            <p className="text-sm text-red-400">{validatePassword(password)}</p>
          )}
        </div>

        <div className="grid gap-2">
          <Label htmlFor="confirmPassword" className="text-white">
            Confirm Password
          </Label>
          <div className="relative">
            <Input
              id="confirmPassword"
              type={showConfirmPassword ? "text" : "password"}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm your password"
              className="bg-white/5 border-white/20 text-white pr-10"
              required
              minLength={6}
              disabled={isLoading}
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-white/60 hover:text-white"
            >
              {showConfirmPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          </div>
          {confirmPassword &&
            password !== confirmPassword &&
            confirmPassword.length > 0 && (
              <p className="text-sm text-red-400">Passwords do not match</p>
            )}
        </div>

        <Button
          type="submit"
          className="w-full bg-white/5 border-white/20 text-white hover:bg-white/10 hover:text-white"
          disabled={isLoading}
        >
          {isLoading ? "Saving Password..." : "Save Password"}
        </Button>
      </form>
      </div>
  );
}


