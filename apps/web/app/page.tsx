import { redirect } from 'next/navigation';

// Root "/" redirects to the Quran browser
export default function RootPage() {
  redirect('/quran');
}
