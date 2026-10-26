import { ErrorState } from '@/components/ui/States';

export default function NotFound() {
  return (
    <main id="main" className="container-page py-16">
      <ErrorState status={404} message="The page you’re looking for doesn’t exist." />
    </main>
  );
}
