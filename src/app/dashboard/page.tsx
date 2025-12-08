import { redirect } from 'next/navigation';

export default function DashboardPage() {
  // Redirect the user to the new chat page as the default dashboard view.
  redirect('/dashboard/chat/new');

  // This part will not be rendered because the redirect happens on the server.
  // It's good practice to return null or a loading indicator.
  return null;
}
