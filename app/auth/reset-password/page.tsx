import type { Metadata } from 'next'
import Link from 'next/link'
import { Suspense } from 'react'

import { ResetPasswordForm } from '@/components/auth/reset-password-form'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

export const metadata: Metadata = {
  title: 'Reset password',
}

export default function ResetPasswordPage() {
  return (
    <Card className="w-full">
      <CardHeader className="text-center">
        <CardTitle className="text-xl">Choose a new password</CardTitle>
        <CardDescription>Enter a new password for your account</CardDescription>
      </CardHeader>
      <CardContent>
        <Suspense fallback={<p className="text-sm text-muted-foreground">Loading…</p>}>
          <ResetPasswordForm />
        </Suspense>
      </CardContent>
      <CardFooter className="justify-center text-sm">
        <Link
          href="/auth/login"
          className="text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline"
        >
          Back to sign in
        </Link>
      </CardFooter>
    </Card>
  )
}
