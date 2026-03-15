import { redirect } from 'next/navigation'
import { getSupabaseServerClient } from '@/lib/supabase/server'
import { Toaster } from 'sonner'

export default async function ProtectedLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const supabase = await getSupabaseServerClient()

    const {
        data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
        redirect('/login')
    }

    return (
        <>
            <Toaster position="top-right" richColors />
            {children}
        </>
    )
}
