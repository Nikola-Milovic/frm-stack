import { useState } from "react";
import { signIn } from "#lib/auth";
import { Button } from "@yourcompany/web/components/base/button";
import { Input } from "@yourcompany/web/components/base/input";
import { Label } from "@yourcompany/web/components/base/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@yourcompany/web/components/base/card";
import { LoadingSpinner } from "@yourcompany/web/components/base/loading-spinner";

interface SignInProps {
  onSuccess?: () => void;
  className?: string;
}

export const SignIn = ({ onSuccess, className }: SignInProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const result = await signIn.email({
        email,
        password,
      });

      if (result.error) {
        setError(result.error.message || "Sign in failed");
      } else {
        onSuccess?.();
      }
    } catch {
      setError("An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Sign In</CardTitle>
        <CardDescription>Enter your email and password to sign in</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="your@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={isLoading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={isLoading}
              minLength={6}
            />
          </div>

          {error && <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md border border-red-200">{error}</div>}

          <Button type="submit" className="w-full" disabled={isLoading || !email || !password}>
            {isLoading ? (
              <>
                <LoadingSpinner size="sm" />
                Signing In...
              </>
            ) : (
              "Sign In"
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};
