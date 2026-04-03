'use client'

import { GalleryVerticalEnd, Keyboard } from "lucide-react"

import { LoginForm } from "@/components/login-form"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button";
import CustomToast from "@/components/ui/CustomToast";

export default function LoginPage() {
  const [showErrorToast, setShowErrorToast] = useState(false);
  const [showSuccessToast, setShowSuccessToast] = useState(false);


  const handleShowErrorToast = () => {
    setShowErrorToast(true);
    setTimeout(() => setShowErrorToast(false), 5000); // Hide after 5 seconds
  };

  const handleShowSuccessToast = () => {
    setShowSuccessToast(true);
    setTimeout(() => setShowSuccessToast(false), 5000); // Hide after 5 seconds
  };

  return (
    <div className="grid min-h-svh lg:grid-cols-2">

      <div className="flex flex-col gap-4 p-6 md:p-10">
        <div className="flex justify-center gap-2 md:justify-start">
          <a href="#" className="flex items-center gap-2 font-medium">
            <div className="flex h-6 w-6 items-center justify-center rounded-md">
              <Keyboard className="size-8" />
            </div>
          </a>
        </div>
        <div className="flex flex-1 items-center justify-center">
          <div className="w-full max-w-xs">
            <LoginForm />
            <Button disabled = {showErrorToast}g onClick={handleShowErrorToast}>Show error toast</Button>
            <button onClick={handleShowSuccessToast}>Show success toast</button>
          </div>
        </div>
      </div>
      <div className="relative hidden bg-muted lg:block">
        <img
          src="/placeholder.svg"
          alt="Image"
          className="absolute inset-0 h-full w-full object-cover dark:brightness-[0.2] dark:grayscale"
        />
      </div>
      {showErrorToast && <CustomToast styles='error' message='Error Occured' />}
      {showSuccessToast && <CustomToast styles='success' message='Success!' />}
    </div>
  )
}
