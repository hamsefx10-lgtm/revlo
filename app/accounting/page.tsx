// app/accounting/page.tsx - Redirects to /projects/accounting (new accounting hub)
import { redirect } from 'next/navigation';

export default function AccountingRedirectPage() {
  redirect('/projects/accounting');
}
