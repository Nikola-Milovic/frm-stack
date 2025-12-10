import { useEffect, useState } from "react";
import { useAuth } from "#providers/auth-provider";
import { SignIn } from "#components/auth/signin";
import { SignUp } from "#components/auth/signup";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@yourcompany/web/components/base/tabs";
import { useNavigate, useSearchParams } from "react-router";

export default function AuthPage() {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialModeParam = searchParams.get("mode");

  const initialMode = initialModeParam === "signup" ? "signup" : "signin";
  const [activeTab, setActiveTab] = useState<"signin" | "signup">(initialMode);

  useEffect(() => {
    if (initialModeParam === "signup" || initialModeParam === "signin") {
      setActiveTab(initialModeParam);
    }
  }, [initialModeParam]);

  useEffect(() => {
    if (isAuthenticated) {
      navigate("/", { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const handleAuthSuccess = () => {
    navigate("/", { replace: true });
  };

  if (isAuthenticated) {
    return null;
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4" data-testid="auth-page">
      <div className="w-full max-w-md">
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as "signin" | "signup")}>
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="signin">Sign In</TabsTrigger>
            <TabsTrigger value="signup">Sign Up</TabsTrigger>
          </TabsList>
          <TabsContent value="signin">
            <SignIn onSuccess={handleAuthSuccess} />
          </TabsContent>
          <TabsContent value="signup">
            <SignUp onSuccess={handleAuthSuccess} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
