import { LabScene } from '@/components/scene/LabScene';
import { LabHUD } from '@/components/ui/LabHUD';
import { TitleScreen } from '@/components/ui/TitleScreen';
import { TutorSystem } from '@/components/ui/TutorSystem';

export default function Home() {
  return (
    <main className="relative h-[100dvh] min-h-[32rem] w-full overflow-hidden">
      <LabScene />
      <LabHUD />
      <TitleScreen />
      <TutorSystem />
    </main>
  );
}
