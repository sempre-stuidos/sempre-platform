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

  // Check if user has a session from password reset email
  useEffect(() => {
    const checkSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          setHasResetSession(true);
        }
      } catch (error) {
        console.error("Error checking session:", error);
      }
    };
    checkSession();
  }, [email]);

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

  return (
    <div className={className}>
      {!hasResetSession && (
        <div className="mb-4 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-md">
          <p className="text-sm text-white/90 font-medium mb-2">⚠️ No active reset session</p>
          <p className="text-xs text-white/70">
            Please click the password reset link from your email to continue. The link will verify your email and allow you to set a new password.
          </p>
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


